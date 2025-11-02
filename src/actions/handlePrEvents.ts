import * as core from '@actions/core'
import * as github from '@actions/github'
import { PullRequest, Repository } from '@octokit/webhooks-types'

import { prTitleHandle } from '~/actions/prTitleHandle'
import { formatToBaseName, getPullRequestEventType } from '~/helpers/helper'
import * as slackService from '~/service/slack/index'
import { convertCreatedPullRequestToSlackUser } from '~/service/slack/utils'
import { IssueContext } from '~/types/type'

export const handlePrEvents = async () => {
  const eventType = getPullRequestEventType()

  const { payload, issue } = github.context
  const { pull_request: pullRequest, repository } = payload as { pull_request: PullRequest; repository: Repository }
  switch (eventType) {
    case 'opened':
      await handlePrOpened({ pullRequest, repository, issueContext: issue })
      break
    case 'synchronize':
      await handlePrSynchronized({ pullRequest, repository })
      break
    case 'reopened':
      await handlePrReopened({ pullRequest, repository })
      break
    case 'merge':
      await handlePrMerged({ pullRequest, repository })
      break
    case 'closed':
      await handlePrClosed({ pullRequest, repository })
      break
    case null:
      core.error('Event type is null')
      break
    default:
      core.error(`Event type ${eventType} is not supported`)
      break
  }
}

const handlePrOpened = async ({
  pullRequest,
  repository,
  issueContext
}: {
  pullRequest: PullRequest
  repository: Repository
  issueContext: IssueContext
}) => {
  console.log(`PR opened by user: ${pullRequest.user.login}`)
  console.log(
    '[DEBUG] handlePrOpened',
    JSON.stringify(
      {
        pullRequest,
        repository,
        issueContext
      },
      null,
      2
    )
  )
  // Update PR title and content
  await prTitleHandle()
}

const handlePrSynchronized = async ({
  pullRequest,
  repository
}: {
  pullRequest: PullRequest
  repository: Repository
}) => {
  console.log(`PR synchronized by user: ${pullRequest.user.login}`)

  // Update PR title and content
  await prTitleHandle()
}

const handlePrReopened = async ({ pullRequest, repository }: { pullRequest: PullRequest; repository: Repository }) => {
  console.log(`PR reopened by user: ${pullRequest.user.login}`)
}

const handlePrMerged = async ({ pullRequest, repository }: { pullRequest: PullRequest; repository: Repository }) => {
  console.log(`PR merged by user: ${pullRequest.user.login}`)
  console.log(
    '[DEBUG] handlePrMerged',
    JSON.stringify(
      {
        pullRequest,
        repository
      },
      null,
      2
    )
  )
  const slackChannelId = core.getInput('slack-channel-id')
  const slackBotToken = core.getInput('slack-bot-token')

  const createdPullRequestSlackUser = await convertCreatedPullRequestToSlackUser({
    githubUser: formatToBaseName(pullRequest.user.login),
    slackBotToken,
    slackChannelId
  })

  const mergedBySlackUser = pullRequest.merged_by?.login
    ? await convertCreatedPullRequestToSlackUser({
        githubUser: formatToBaseName(pullRequest.merged_by.login),
        slackBotToken,
        slackChannelId
      })
    : undefined

  core.warning(`createdPullRequestSlackUser: ${createdPullRequestSlackUser}`)
  core.warning(`mergedBySlackUser: ${mergedBySlackUser}`)
  // Create Slack message on merged PR
  await slackService.createSlackMessageOnMergedPr({
    channelId: slackChannelId,
    slackBotToken,
    createdPullRequestSlackUser,
    pullRequest,
    repository,
    mergedBySlackUser
  })
}

const handlePrClosed = async ({ pullRequest, repository }: { pullRequest: PullRequest; repository: Repository }) => {
  console.log(`PR closed by user: ${pullRequest.user.login}`)
}
