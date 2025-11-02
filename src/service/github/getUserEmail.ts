import * as core from '@actions/core'
import * as github from '@actions/github'

export const getUserEmail = async ({ username }: { username: string }): Promise<string | null> => {
  const octokit = github.getOctokit(process.env.GITHUB_TOKEN || '')

  try {
    const { data: user } = await octokit.rest.users.getByUsername({
      username
    })

    // Public email may be null if user has set it to private
    if (user.email) {
      return user.email
    }

    try {
      const { data: authUser } = await octokit.rest.users.getAuthenticated()

      if (authUser.login === username && authUser.email) {
        return authUser.email
      }
    } catch (error) {
      core.debug(`Could not get authenticated user email: ${error}`)
    }

    return null
  } catch (error) {
    core.warning(`Failed to fetch email for user ${username}: ${error}`)
    return null
  }
}
