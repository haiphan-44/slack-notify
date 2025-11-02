import * as core from '@actions/core'
import { getOctokit } from '@actions/github'
import { PullRequest } from '@octokit/webhooks-types'

import { IssueContext } from '~/types/type'

export const updatePrContent = async ({
  githubToken,
  issueContext,
  body,
  pullRequest
}: {
  githubToken: string
  issueContext: IssueContext
  body: string
  pullRequest: PullRequest
}) => {
  // Validate body is not empty
  if (!body || body.trim() === '') {
    core.warning('Skipping PR content update: body is empty')
    return
  }

  core.warning('Updating PR content... with body: ' + JSON.stringify(body))
  try {
    const octokit = getOctokit(githubToken)
    await octokit.rest.pulls.update({
      owner: issueContext.owner,
      repo: issueContext.repo,
      body: body.trim(),
      pull_number: pullRequest.number
    })
  } catch (error) {
    console.error('Error updatePrContent', error)
    throw error
  }
}
