import * as core from '@actions/core'
import * as github from '@actions/github'
import { PullRequest, Repository } from '@octokit/webhooks-types'

import { createPrContent } from '~/service/github/createPrContent'
import * as githubService from '~/service/github/index'

export const prTitleHandle = async () => {
  try {
    const { payload, issue } = github.context
    const { pull_request: pullRequest, repository } = payload as { pull_request: PullRequest; repository: Repository }

    const targetBranch = pullRequest.base.ref

    const prevTitle = await githubService.getPreviousTitle({
      issueContext: issue,
      pullRequestNumber: pullRequest.number
    })

    // Generate PR content
    const prTemplateContent = await createPrContent({
      targetBranch,
      headBranch: pullRequest.head.ref,
      prevDesc: pullRequest.body
    })

    // Generate PR title
    const prTitle = await githubService.createPrTitle({ prTemplateContent, prevTitle })

    // Validate before updating
    if (!prTitle || prTitle.trim() === '') {
      core.warning('Generated PR title is empty, skipping title update')
    } else {
      // Update PR title
      await githubService.updatePrTitle({
        githubToken: process.env.GITHUB_TOKEN!,
        issueContext: issue,
        title: prTitle,
        pullRequest
      })
    }

    // Update PR content (if not empty)
    if (!prTemplateContent || prTemplateContent.trim() === '') {
      core.warning('Generated PR content is empty, skipping content update')
    } else {
      await githubService.updatePrContent({
        githubToken: process.env.GITHUB_TOKEN!,
        issueContext: issue,
        body: prTemplateContent,
        pullRequest
      })
    }

    // Generate PR code reviews
    // if (isReviewCode) {
    //   core.warning('Starting to generate PR code reviews')
    //   await githubService.createPrCodeReviews({
    //     targetBranch,
    //     headBranch: pullRequest.head.ref,
    //     pullNumber: pullRequest.number
    //   })
    // } else {
    //   core.warning('Skipping code review steps.')
    // }

    return prTitle
  } catch (error) {
    core.error(`Error in prTitleHandle: ${error}`)
    return ''
  }
}
