import { PullRequest } from '@octokit/webhooks-types'
import axios from 'axios'

export const postCommentOnPr = async ({ pullRequest, body }: { pullRequest: PullRequest; body: string }) => {
  try {
    const githubToken = process.env.GITHUB_TOKEN
    if (!githubToken) throw new Error('GITHUB_TOKEN is not defined')
    const response = await axios.post(
      pullRequest.comments_url,
      {
        body
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
        }
      }
    )

    return response.data
  } catch (error) {
    console.error('Error postCommentOnPr', error)
  }
}
