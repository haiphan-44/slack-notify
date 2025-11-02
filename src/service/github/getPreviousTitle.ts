import * as core from '@actions/core'
import * as github from '@actions/github'

import { IssueContext } from '~/types/type'

export const getPreviousTitle = async ({
  pullRequestNumber,
  issueContext
}: {
  pullRequestNumber: number
  issueContext: IssueContext
}): Promise<string> => {
  const octokit = github.getOctokit(process.env.GITHUB_TOKEN || '')
  const { owner, repo } = issueContext
  try {
    const { data: pr } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullRequestNumber
    })
    return pr.title
  } catch (error) {
    core.error(`Failed to fetch PR title: ${error}`)
    return ''
  }
}
