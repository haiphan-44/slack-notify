import * as core from '@actions/core'
import { CommitCommentEvent, Issue } from '@octokit/webhooks-types'
import { User as SlackUser } from '@slack/web-api/dist/types/response/UsersInfoResponse'

import { COMMENT_ON_PR } from '~/constant'
import * as githubService from '~/service/github/index'
import * as slackService from '~/service/slack/index'
import { IssueContext } from '~/types/type'

export const getSlackTimestamp = async ({ issueContext }: { issueContext: IssueContext }) => {
  try {
    const comments = await githubService.getPullRequestComments({ githubToken: process.env.GITHUB_TOKEN, issueContext })

    if (!Array.isArray(comments) || comments.length === 0) return null
    const matchedComment = findFirstSlackTimestampComment({ comments })
    if (!matchedComment) return null
    const [_, ts] = matchedComment.body.split(COMMENT_ON_PR)
    if (!ts) return null
    return ts.trim()
  } catch (error) {
    core.error(`Error in getSlackTimestamp: ${error}`)
    return null
  }
}

export const convertCreatedPullRequestToSlackUser = async ({
  slackChannelId,
  slackBotToken,
  githubUser
}: {
  slackChannelId: string
  slackBotToken: string
  githubUser: string
}) => {
  const slackUserIds = await slackService.getUsersInSlackChannel({
    channelId: slackChannelId,
    slackBotToken
  })

  const getAllSlackMembersName = await Promise.all<SlackUser[]>(
    // @ts-ignore
    slackUserIds.map(async (slackUserId) => slackService.getSlackUser({ slackBotToken, slackUserId }))
  ).then((res) => res.filter((user) => user !== null && user !== undefined))

  const createdPullRequestSlackUser = getAllSlackMembersName.find((member) => member.name === githubUser)

  return createdPullRequestSlackUser
}

export const findFirstSlackTimestampComment = ({ comments }: { comments: CommitCommentEvent['comment'][] }) => {
  const pattern = COMMENT_ON_PR
  const regex = new RegExp(`${pattern}\\s*(\\d+\\.\\d+)`)

  for (const comment of comments) {
    const match = comment.body.match(regex)
    if (match) {
      return comment
    }
  }

  return null
}
