import { Repository } from '@octokit/webhooks-types'
import { ChatPostMessageArguments, WebClient } from '@slack/web-api'
import { User } from '@slack/web-api/dist/types/response/UsersInfoResponse'

import { SlackMessageColor } from '~/service/slack/constants'

export const createSlackMessage = async ({
  channelId,
  slackBotToken,
  pullRequest,
  createdPullRequestSlackUser,
  repository,
  prDetail
}: {
  channelId: string
  slackBotToken: string
  repository: Repository
  pullRequest: any
  createdPullRequestSlackUser: User | undefined
  prDetail: string
}) => {
  const slackClient = new WebClient(slackBotToken)

  const timeTs = Math.round(new Date(pullRequest.created_at).getTime() / 1000)

  const slackUserId = createdPullRequestSlackUser?.id

  const prOpenedBy = slackUserId ? `<@${slackUserId}>` : pullRequest.user.login

  try {
    const messagePayload: ChatPostMessageArguments = {
      channel: channelId,
      as_user: true,
      text: `${prOpenedBy} has opened a new PR. Please help to review it! :5628_pepe_saber:`,
      attachments: [
        {
          color: SlackMessageColor.OPEN,
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
                  text: `*Status:*\nOPEN`
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
                  text: `*When:*\n<!date^${timeTs}^{date_short} at {time}|Fallback Text>`
                },
                {
                  type: 'mrkdwn',
                  text: `${prDetail}`
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
          ]
        }
      ]
    }

    const response = await slackClient.chat.postMessage(messagePayload)
    console.log({ response })
    if (!response.ts) throw new Error('Something wrong with send slack message')
    return response
  } catch (error: any) {
    console.log('error:', error)
    throw new Error(error.message)
  }
}
