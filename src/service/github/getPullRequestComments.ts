import { getOctokit } from '@actions/github'
import { CommitCommentEvent } from '@octokit/webhooks-types'

import { IssueContext } from '~/types/type'

export const getPullRequestComments = async ({
  githubToken,
  issueContext
}: {
  githubToken: string
  issueContext: IssueContext
}): Promise<CommitCommentEvent['comment'][] | undefined> => {
  const octokit = getOctokit(githubToken)

  const { owner, repo, number } = issueContext

  try {
    const { data } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: number
    })

    return data as unknown as CommitCommentEvent['comment'][] | undefined
  } catch (error) {
    console.error('Error fetching PR comments:', error)
  }
}
