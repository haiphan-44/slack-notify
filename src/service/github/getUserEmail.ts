import * as core from '@actions/core'
import * as github from '@actions/github'

export const getUserEmail = async ({ username }: { username: string }): Promise<string | null> => {
  const octokit = github.getOctokit(process.env.GITHUB_TOKEN || '')

  try {
    const { data: user } = await octokit.rest.users.getByUsername({
      username
    })

    core.warning(`[getUserEmail] user: ${JSON.stringify(user, null, 2)}`)

    // Public email may be null if user has set it to private
    if (user.email) {
      return user.email
    }

    try {
      const { data: authUser } = await octokit.rest.users.getAuthenticated()

      core.warning(`[getUserEmail] authUser: ${JSON.stringify(authUser, null, 2)}`)

      if (authUser.login === username && authUser.email) {
        return authUser.email
      }
    } catch (error) {
      // Silently fail - we don't have permission or user is not authenticated
      core.debug(`Could not get authenticated user email: ${error}`)
    }

    return null
  } catch (error) {
    core.warning(`Failed to fetch email for user ${username}: ${error}`)
    return null
  }
}
