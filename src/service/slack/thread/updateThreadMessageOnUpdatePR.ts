import { PullRequestReview, Repository } from '@octokit/webhooks-types'
import { ChatUpdateArguments, WebClient } from '@slack/web-api'
import { User } from '@slack/web-api/dist/types/response/UsersInfoResponse'

import { SlackMessageColor } from '~/service/slack/constants'
import { PullRequestPayload } from '~/types/type'

export const updateThreadMessageOnUpdatePR = async ({
  channelId,
  slackBotToken,
  slackTimestamp,
  createdPullRequestSlackUser,
  approvedPullRequestSlackUser,
  review,
  pullRequest,
  repository
}: {
  channelId: string
  slackBotToken: string
  slackTimestamp: string
  createdPullRequestSlackUser: User | undefined
  approvedPullRequestSlackUser: User | null
  review: PullRequestReview
  pullRequest: PullRequestPayload
  repository: Repository
}) => {
  const slackClient = new WebClient(slackBotToken)
  const slackUserId = createdPullRequestSlackUser?.id
  const prOpenedBy = slackUserId ? `<@${slackUserId}>` : pullRequest.user.login
  const state = review.state
  let message = ''
  const relatedUrl = review.html_url
  if (state === 'approved') {
    message = `Congrats! ${prOpenedBy} 🎉, <${relatedUrl}|your PR> was *approved* 🎉`
  } else {
    message = `Hi ${prOpenedBy}, you have some comments on <${relatedUrl}|your PR>. Please take a look! :catshake:`
  }
  try {
    if (state === 'approved') {
      console.log('PR approved')
      // Post a Slack message
      await slackClient.chat.postMessage({
        channel: channelId,
        thread_ts: slackTimestamp,
        text: message
      })

      const createdAt = Math.round(new Date(pullRequest.created_at).getTime() / 1000)
      const updatedAt = Math.round(new Date(review.submitted_at as string).getTime() / 1000)

      const approvedBy = approvedPullRequestSlackUser?.id ? `<@${approvedPullRequestSlackUser.id}>` : review.user.login

      // Message payload for approved pull request
      const messagePayload: ChatUpdateArguments = {
        channel: channelId,
        as_user: true,
        ts: slackTimestamp,
        text: `Hi ${prOpenedBy}, your PR have been approved! :pepe_hands:`,
        attachments: [
          {
            color: SlackMessageColor.APPROVED,
            blocks: [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: `:ncp: ${repository.full_name}`,
                  emoji: true
                }
              },
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: `:pull-request: ${pullRequest.title} - #${pullRequest.number}`,
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
                    text: `*When:*\n<!date^${createdAt}^{date_short} at {time}|Fallback Text>`
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
                    text: `*Approved at:*\n<!date^${updatedAt}^{date_short} at {time}|Fallback Text>`
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Approved by:*\n${approvedBy}`
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

      const updateResponse = await slackClient.chat.update(messagePayload)
      console.log('updateResponse:', updateResponse)
    } else {
      console.log('Received some comments')
      // Post a Slack message for comments
      const response = await slackClient.chat.postMessage({
        channel: channelId,
        thread_ts: slackTimestamp,
        text: message
      })
      console.log('Post a Slack message for comments: ', response)
    }
  } catch (error) {
    console.error('Error posting to Slack:', error)
  }
}
