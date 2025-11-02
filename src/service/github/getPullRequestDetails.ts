import * as core from '@actions/core'
import * as github from '@actions/github'
import { PullRequest } from '@octokit/webhooks-types'

import { IssueContext } from '~/types/type'

/**
 * Fetches full PR details including changed_files from GitHub API
 * Webhook payloads don't include changed_files, so we need to fetch it
 */
export const getPullRequestDetails = async ({
  pullNumber,
  issueContext
}: {
  pullNumber: number
  issueContext: IssueContext
}): Promise<PullRequest> => {
  const octokit = github.getOctokit(process.env.GITHUB_TOKEN || '')
  const { owner, repo } = issueContext
  try {
    const { data: pr } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullNumber
    })
    return pr as unknown as PullRequest
  } catch (error) {
    core.error(`Failed to fetch PR details: ${error}`)
    throw error
  }
}
