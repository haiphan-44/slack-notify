import { WebClient } from '@slack/web-api'
import { User } from '@slack/web-api/dist/types/response/UsersInfoResponse'

import { PullRequestPayload } from '~/types/type'

export const updateThreadMessageOnClosePR = async ({
  channelId,
  slackBotToken,
  slackTimestamp,
  createdPullRequestSlackUser,
  mergedPullRequestSlackUser,
  pullRequest
}: {
  channelId: string
  slackBotToken: string
  slackTimestamp: string
  createdPullRequestSlackUser: User | undefined
  mergedPullRequestSlackUser: User | null
  pullRequest: PullRequestPayload
}) => {
  const slackClient = new WebClient(slackBotToken)
  const slackUserId = createdPullRequestSlackUser?.id
  const prOpenedBy = slackUserId ? `<@${slackUserId}>` : pullRequest.user.login
  const prMergedBy = mergedPullRequestSlackUser?.id ? `<@${mergedPullRequestSlackUser.id}>` : slackUserId
  const hasMergedState = Boolean(mergedPullRequestSlackUser)
  const relatedUrl = pullRequest.html_url

  try {
    if (hasMergedState) {
      const message = `Hi, ${prOpenedBy}, <${relatedUrl}|your PR> has been merged by ${prMergedBy} 🎉.`
      // Post a Slack message for comments
      const response = await slackClient.chat.postMessage({
        channel: channelId,
        thread_ts: slackTimestamp,
        text: message
      })
      console.log('Post a thread Slack message: ', response)
    } else {
      console.log('Not merge event: ', {
        mergedPullRequestSlackUser,
        pullRequest
      })
    }
  } catch (error) {
    console.error('Error posting to Slack:', error)
  }
}
