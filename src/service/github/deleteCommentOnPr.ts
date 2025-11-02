import { getOctokit } from '@actions/github'

import { getPullRequestComments } from '~/service/github/getPullRequestComments'
import { findFirstSlackTimestampComment } from '~/service/slack/utils'
import { IssueContext } from '~/types/type'

export const deleteCommentOnPr = async ({
  githubToken,
  issueContext
}: {
  githubToken: string
  issueContext: IssueContext
}) => {
  try {
    const octokit = getOctokit(githubToken)
    const comments = await getPullRequestComments({ githubToken, issueContext })
    if (!comments) return
    const findMatchedComment = findFirstSlackTimestampComment({ comments })
    if (findMatchedComment?.id) {
      const response = await octokit.rest.issues.deleteComment({
        comment_id: findMatchedComment.id,
        owner: issueContext.owner,
        repo: issueContext.repo
      })
      console.log({ deleteComment: response })
    } else {
      console.log('Not found Slack Timestamp comment...')
    }
  } catch (error) {
    console.error('Error postCommentOnPr', error)
  }
}
