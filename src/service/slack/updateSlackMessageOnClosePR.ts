import { Repository } from '@octokit/webhooks-types'
import { ChatUpdateArguments, WebClient } from '@slack/web-api'
import { User } from '@slack/web-api/dist/types/response/UsersInfoResponse'

import { SlackMessageColor } from '~/service/slack/constants'
import { PullRequestPayload } from '~/types/type'

export const updateSlackMessageOnClosePR = async ({
  channelId,
  pullRequest,
  repository,
  slackBotToken,
  slackTimestamp,
  createdPullRequestSlackUser,
  approvedPullRequestSlackUser
}: {
  pullRequest: PullRequestPayload
  repository: Repository
  slackTimestamp: string
  channelId: string
  slackBotToken: string
  createdPullRequestSlackUser: User | undefined
  approvedPullRequestSlackUser: User | null
}) => {
  const slackClient = new WebClient(slackBotToken)
  console.log({ pullRequest })
  const state = pullRequest.state === 'closed' ? (pullRequest.merged ? 'MERGED' : 'CLOSED') : pullRequest.state
  const color =
    state === 'MERGED'
      ? SlackMessageColor.MERGED
      : state === 'CLOSED'
        ? SlackMessageColor.CLOSED
        : SlackMessageColor.OPEN

  const createdAtTime = Math.round(new Date(pullRequest.created_at).getTime() / 1000)
  const updatedAtTime = Math.round(new Date(pullRequest.updated_at).getTime() / 1000)
  const slackUserId = createdPullRequestSlackUser?.id
  const prOpenedBy = slackUserId ? `<@${slackUserId}>` : pullRequest.user.login

  const text =
    state === 'MERGED'
      ? `Hi ${prOpenedBy}, <${pullRequest.html_url}|your PR> has been merged! :white_check_mark:`
      : state === 'CLOSED'
        ? `Hi ${prOpenedBy}, <${pullRequest.html_url}|your PR> has been closed! :white_check_mark:`
        : `${prOpenedBy} has opened a new PR. Please help to review it! <!channel> :pepe_hands:`

  const approvedBy = approvedPullRequestSlackUser?.id ? `<@${approvedPullRequestSlackUser.id}>` : prOpenedBy

  const messagePayload: ChatUpdateArguments = {
    channel: channelId,
    as_user: true,
    ts: slackTimestamp,
    text,
    attachments: [
      {
        color,
        // @ts-ignore
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `:ncp: [${repository.name}] - :pull-request: ${pullRequest.title} - #${pullRequest.number}`,
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Status:*\n${state.toUpperCase()}`
              },
              {
                type: 'mrkdwn',
                text: `*Opened by:*\n${prOpenedBy}`
              }
            ]
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*When:*\n<!date^${createdAtTime}^{date_short} at {time}|Fallback Text>`
              },
              {
                type: 'mrkdwn',
                text: `*Files Changed:*\n${pullRequest.changed_files}`
              }
            ]
          },
          approvedPullRequestSlackUser
            ? {
                type: 'section',
                fields: [
                  {
                    type: 'mrkdwn',
                    text: `*Updated:*\n<!date^${updatedAtTime}^{date_short} at {time}|Fallback Text>`
                  },
                  {
                    type: 'mrkdwn',
                    text: `*${state === 'CLOSED' ? 'Closed' : state === 'MERGED' ? 'Merged' : 'Modified'} by:*\n${approvedBy}`
                  }
                ]
              }
            : null,
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  emoji: true,
                  text: 'View PR'
                },
                style: 'primary',
                url: pullRequest.html_url
              }
            ]
          }
        ].filter(Boolean)
      }
    ]
  }

  try {
    const updateResponse = await slackClient.chat.update(messagePayload)
    if (updateResponse.ok) {
      console.log('Slack message updated successfully')
    } else {
      console.error('Failed to update Slack message:', updateResponse.error)
    }
  } catch (error) {
    console.error('Error updating Slack message:', error)
  }
}
