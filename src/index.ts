import * as core from '@actions/core'
import * as github from '@actions/github'
import { PullRequest } from '@octokit/webhooks-types'

import { handlePrEvents } from '~/actions/handlePrEvents'

const main = async () => {
  const { payload } = github.context
  const { pull_request: pullRequest } = payload as { pull_request: PullRequest }

  const targetBranch = pullRequest.base.ref
  const headBranch = pullRequest.head.ref

  if (!pullRequest || !process.env.GITHUB_TOKEN || !targetBranch || !headBranch) {
    if (!pullRequest) {
      core.error('Missing pull request context')
    }
    if (!process.env.GITHUB_TOKEN) {
      core.error('Missing github token')
    }
    if (!targetBranch) {
      core.error('Missing target branch')
    }
    if (!headBranch) {
      core.error('Missing head branch')
    }
  }

  // Handle PR events
  await handlePrEvents()
}
try {
  main()
} catch (error) {
  if (error instanceof Error) {
    core.error(error.message)
  } else {
    core.error(String(error))
  }
}
