import * as core from '@actions/core'
import { Octokit } from '@octokit/rest'

export const getFileChanges = async ({ targetBranch, headBranch }: { targetBranch: string; headBranch: string }) => {
  const owner = process.env.GITHUB_REPOSITORY_OWNER
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
  const githubToken = process.env.GITHUB_TOKEN

  if (!owner || !repo || !githubToken) {
    throw new Error('Missing owner or repo or githubToken')
  }

  const octokit = new Octokit({
    auth: githubToken
  })

  try {
    const response = await octokit.repos.compareCommits({
      owner,
      repo,
      base: targetBranch,
      head: headBranch
    })
    return response.data.files
  } catch (error) {
    core.error('Error getting diff from GitHub API: ' + String(error))
    throw error
  }
}
