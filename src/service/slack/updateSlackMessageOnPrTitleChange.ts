import { Repository } from '@octokit/webhooks-types'
import { ChatUpdateArguments, WebClient } from '@slack/web-api'
import { User } from '@slack/web-api/dist/types/response/UsersInfoResponse'

import { checkLimitText } from '~/helpers/helper'
import { SlackMessageColor } from '~/service/slack/constants'
import { PullRequestPayload } from '~/types/type'

export const updateSlackMessageOnPrTitleChange = async ({
  channelId,
  pullRequest,
  repository,
  slackBotToken,
  slackTimestamp,
  createdPullRequestSlackUser,
  generatedPrTitle
}: {
  pullRequest: PullRequestPayload
  repository: Repository
  slackTimestamp: string
  channelId: string
  slackBotToken: string
  createdPullRequestSlackUser: User | undefined
  generatedPrTitle: string
}) => {
  const slackClient = new WebClient(slackBotToken)
  const state = pullRequest.state === 'closed' ? (pullRequest.merged ? 'MERGED' : 'CLOSED') : pullRequest.state
  const color =
    state === 'MERGED'
      ? SlackMessageColor.MERGED
      : state === 'CLOSED'
        ? SlackMessageColor.CLOSED
        : SlackMessageColor.OPEN

  const createdAtTime = Math.round(new Date(pullRequest.created_at).getTime() / 1000)

  const slackUserId = createdPullRequestSlackUser?.id
  const prOpenedBy = slackUserId ? `<@${slackUserId}>` : pullRequest.user.login

  const text = `${prOpenedBy} has opened a new PR. Please help to review it! <!channel> :pepe_hands:`

  console.log({
    generatedPrTitle,
    formattedPrTitle: `:ncp: [${repository.name}] - :pull-request: ${checkLimitText(generatedPrTitle)} - #${pullRequest.number}`,
    lengthOfText:
      `:ncp: [${repository.name}] - :pull-request: ${checkLimitText(generatedPrTitle)} - #${pullRequest.number}`.length
  })

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
              text: `:ncp: [${repository.name}] - :pull-request: ${checkLimitText(generatedPrTitle)} - #${pullRequest.number}`,
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
