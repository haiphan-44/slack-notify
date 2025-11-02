import * as core from '@actions/core'
import { components } from '@octokit/openapi-types'
import { Octokit } from '@octokit/rest'

import { SYSTEM_PROMPT } from '~/service/copilot/constant'
import { generateContent } from '~/service/copilot/generateContent'
import { CopilotQueryBuilder } from '~/service/copilot/type'
import { generateCopilotRequest } from '~/service/copilot/utils'
import { getFileChanges } from '~/service/github/getFileChanges.js'

interface FileComment {
  path: string
  body: string
  line: number
}

const getReviewSuggestions = async (content: string): Promise<string> => {
  const userPrompt = `${content}
----------------------------------------
Please review this code and provide feedback in the following format: 
----------------------------------------
✨ **Priority Improvements**

  - [High priority improvement]
  - [Medium priority improvement]
  - [Nice-to-have improvement]

⚠️ **Potential Issues**

  - [List specific concerns or risks]

💡 **Code Suggestions**
<details>
<summary>Click to see implementation examples</summary>
\`\`\`[language]
// Instead of:
[paste problematic code here]

// Consider:
[paste improved code here]
\`\`\`
----------------------------------------
Please ensure the following:
- Provide clear, actionable suggestions with a touch of fun.
- Focus on specific tips for JS, TS, Vue 3, or Nuxt 3. Keep it short and engaging!
- Removed the placeholder brackets ([High priority improvement], etc.) so no response will include these.
- Enhanced clarity by emphasizing actionable suggestions and keeping instructions concise.
- Added <details> and <summary> tags to the Code Example section for better interaction.
- Please ignore the deleted code and provide suggestions for the remaining code.
`

  try {
    const copilotQueryBuilder: CopilotQueryBuilder = {
      copilotRequest: null,
      history: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: userPrompt
        }
      ]
    }

    const request = await generateCopilotRequest()

    copilotQueryBuilder.copilotRequest = request

    const response = await generateContent(copilotQueryBuilder, (response, done, isError) => {
      if (isError) {
        console.log('Error: ', response)
        return
      }

      if (done) {
        return response
      }
    })

    return response
  } catch (error) {
    core.warning('Error getting Copilot suggestions: ' + String(error))
    return ''
  }
}

// Assuming your function is declared as above
const extractLineNumbersFromPatch = (patch: string, status: string): number[] => {
  const lines: number[] = []
  const hunkRegex = /@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/g
  let match

  if (status === 'added') {
    return [1]
  }

  while ((match = hunkRegex.exec(patch)) !== null) {
    const newStartLine = parseInt(match[3], 10)
    const newLineCount = match[4] ? parseInt(match[4], 10) : 1

    for (let i = 0; i < newLineCount; i++) {
      lines.push(newStartLine + i)
    }
  }

  return lines
}

type File = components['schemas']['diff-entry']
const createFileComment = async (file: File) => {
  try {
    if (!file.patch) return null

    const addedLines = extractLineNumbersFromPatch(file.patch, file.status)
    if (addedLines.length === 0) {
      core.warning(`No changes in patch for file: ${file.filename}`)
      return null
    }
    const suggestions = await getReviewSuggestions(file.patch)
    const response = {
      path: file.filename,
      body: `\n${suggestions}\n`,
      line: file.status === 'added' ? file.additions : addedLines[0]
    }
    return response
  } catch (error) {
    core.warning(`Error reviewing ${file.filename}: ${error}`)
    return null
  }
}

const handleReviewComments = async ({
  pullNumber,
  validComments
}: {
  pullNumber: number
  validComments: FileComment[]
}) => {
  const owner = process.env.GITHUB_REPOSITORY_OWNER!
  const repo = process.env.GITHUB_REPOSITORY!.split('/')[1]
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  })

  const botName = 'github-actions[bot]'

  // 1. Get existing review comments
  const { data: reviewComments } = await octokit.pulls.listReviewComments({
    pull_number: pullNumber,
    owner,
    repo
  })

  const botComments = reviewComments.filter((review) => review.user?.login === botName)
  const reviewUrls = []

  if (botComments.length > 0) {
    core.info('Found existing bot review. Cleaning up old comments...')
    core.info(`Existing comments: ${reviewComments.length}`)

    const modifedComments = validComments.reduce(
      (acc, comment) => {
        const foundComment = botComments.find((botComment) => botComment.path === comment.path)
        if (foundComment) {
          acc.updatedComments.push({ ...comment, id: foundComment.id })
        } else {
          acc.newComments.push(comment)
        }
        return acc
      },
      {
        updatedComments: [] as { id: number; path: string; body: string; line: number }[],
        newComments: [] as { path: string; body: string; line: number }[]
      }
    )
    console.log({ updatedComments: JSON.stringify(modifedComments.updatedComments) })
    console.log({ newComments: JSON.stringify(modifedComments.newComments) })
    // Update existing comments
    for (const comment of modifedComments.updatedComments) {
      try {
        const response = await octokit.pulls.updateReviewComment({
          owner,
          repo,
          body: comment.body,
          comment_id: comment.id
        })
        core.info(`Updated reviews: ${response.data.html_url}`)
        reviewUrls.push(response.data.html_url)
      } catch (error) {
        core.warning(`Failed to delete comment ${comment.id}: ${error}`)
      }
    }

    // Create new comments
    if (modifedComments.newComments.length > 0) {
      const response = await octokit.pulls.createReview({
        owner,
        repo,
        pull_number: pullNumber,
        comments: modifedComments.newComments,
        event: 'COMMENT'
      })

      const reviewId = response.data.id

      const commentsResponse = await octokit.pulls.listReviewComments({
        owner,
        repo,
        pull_number: pullNumber,
        review_id: reviewId
      })

      const commentsHtmlUrls = commentsResponse.data.map((comment) => comment.html_url)
      core.info(`Create reviews: ${response.data}`)
      reviewUrls.push(...commentsHtmlUrls)
    }
  } else {
    core.info('No existing review. Creating a new review.')
    const response = await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      comments: validComments,
      event: 'COMMENT'
    })

    const reviewId = response.data.id

    const commentsResponse = await octokit.pulls.listReviewComments({
      owner,
      repo,
      pull_number: pullNumber,
      review_id: reviewId
    })

    const commentsHtmlUrls = commentsResponse.data.map((comment) => comment.html_url)
    core.info(`Created a new review with ${validComments.length} comments.`)
    reviewUrls.push(...commentsHtmlUrls)
  }
  return reviewUrls
}

export const createPrCodeReviews = async ({
  targetBranch,
  headBranch,
  pullNumber
}: {
  targetBranch: string
  headBranch: string
  pullNumber: number
}) => {
  const fileChanged = await getFileChanges({
    targetBranch,
    headBranch
  })
  if (!fileChanged) throw new Error('No file changes found')

  const filterValidFileChanged = fileChanged.filter(
    (file) => file.status !== 'removed' && file.status !== 'renamed' && file.patch?.trim()
  )

  console.log({
    filesChanged: filterValidFileChanged.map((file) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      changes: file.changes,
      deletions: file.deletions,
      patch: file.patch
    }))
  })

  const fileCommentsPromises = filterValidFileChanged.map((file) => createFileComment(file))

  const fileCommentsNested = await Promise.all(fileCommentsPromises)

  const validComments = fileCommentsNested.flat().filter((comment) => comment?.body) as FileComment[]
  if (validComments.length > 0) {
    try {
      return await handleReviewComments({ pullNumber, validComments })
    } catch (error) {
      console.log('Error when create new comments: ', error)
      core.warning(`Failed to create review comments, retrying after delay...`)
    }
  }
  return null
}
