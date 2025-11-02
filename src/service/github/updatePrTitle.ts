import * as core from '@actions/core'
import { getOctokit } from '@actions/github'
import { PullRequest } from '@octokit/webhooks-types'

import { IssueContext } from '~/types/type'

export const updatePrTitle = async ({
  githubToken,
  issueContext,
  title,
  pullRequest
}: {
  githubToken: string
  issueContext: IssueContext
  title: string
  pullRequest: PullRequest
}) => {
  // Validate title is not empty
  if (!title || title.trim() === '') {
    core.warning('Skipping PR title update: title is empty')
    return
  }

  try {
    const octokit = getOctokit(githubToken)
    await octokit.rest.pulls.update({
      owner: issueContext.owner,
      repo: issueContext.repo,
      title: title.trim(),
      pull_number: pullRequest.number
    })
  } catch (error) {
    console.error('Error updatePrTitle', error)
    throw error
  }
}
