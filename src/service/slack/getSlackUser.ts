import { WebClient } from '@slack/web-api'

export const getSlackUser = async ({ slackBotToken, slackUserId }: { slackBotToken: string; slackUserId: string }) => {
  const slackClient = new WebClient(slackBotToken)
  try {
    const response = await slackClient.users.info({ user: slackUserId })
    if (response.ok) {
      return response.user
    }
    return null
  } catch (error) {
    console.error('Error fetching users in channel:', error)
    return null
  }
}
