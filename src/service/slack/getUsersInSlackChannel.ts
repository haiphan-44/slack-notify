import { WebClient } from '@slack/web-api'

export const getUsersInSlackChannel = async ({
  channelId,
  slackBotToken
}: {
  channelId: string
  slackBotToken: string
}) => {
  const slackClient = new WebClient(slackBotToken)
  try {
    const response = await slackClient.conversations.members({
      channel: channelId
    })
    if (response.ok) {
      return response.members as string[]
    }
    return []
  } catch (error) {
    console.error('Error fetching users in channel:', error)
    return []
  }
}
