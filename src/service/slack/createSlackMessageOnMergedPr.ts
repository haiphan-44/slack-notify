import * as core from '@actions/core'
import { Repository } from '@octokit/webhooks-types'
import { ChatPostMessageArguments, WebClient } from '@slack/web-api'
import { User } from '@slack/web-api/dist/types/response/UsersInfoResponse'

import { SlackMessageColor } from '~/service/slack/constants'
import { PullRequestPayload } from '~/types/type'

export const createSlackMessageOnMergedPr = async ({
  channelId,
  slackBotToken,
  pullRequest,
  createdPullRequestSlackUser,
  mergedBySlackUser,
  repository
}: {
  channelId: string
  slackBotToken: string
  repository: Repository
  pullRequest: PullRequestPayload
  createdPullRequestSlackUser: User | undefined
  mergedBySlackUser: User | undefined
}) => {
  const slackClient = new WebClient(slackBotToken)

  const createdAtTime = Math.round(new Date(pullRequest.created_at).getTime() / 1000)
  const updatedAtTime = Math.round(new Date(pullRequest.updated_at).getTime() / 1000)

  const openedById = createdPullRequestSlackUser?.id
  const mergedById = mergedBySlackUser?.id

  const prOpenedBy = openedById ? `<@${openedById}>` : pullRequest.user.login
  const mergedBy = mergedById ? `<@${mergedById}>` : pullRequest.merged_by?.login

  const text = `Hi ${prOpenedBy}, your PR <${pullRequest.html_url}|has been merged successfully> :white_check_mark:`

  try {
    const messagePayload: ChatPostMessageArguments = {
      channel: channelId,
      as_user: true,
      text,
      attachments: [
        {
          color: SlackMessageColor.MERGED,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `:employmenthero: [${repository.name}] - :pr-closed: ${pullRequest.title} - #${pullRequest.number}`,
                emoji: true
              }
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Status:*\nMERGED`
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
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Updated:*\n<!date^${updatedAtTime}^{date_short} at {time}|Fallback Text>`
                },
                {
                  type: 'mrkdwn',
                  text: `*Merged by:*\n${mergedBy}`
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

    const response = await slackClient.chat.postMessage(messagePayload)
    if (!response.ts) throw new Error('Something wrong with send slack message')
    return response
  } catch (error: any) {
    core.error(`[createSlackMessageOnMergedPr] Failed to create slack message on merged PR: ${error.message}`)
    throw error
  }
}
