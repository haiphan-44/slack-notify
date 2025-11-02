import * as github from '@actions/github'
import { CommitCommentEvent } from '@octokit/webhooks-types'

import { COMMENT_ON_PR } from '~/constant'

const MAX_HEADER_LENGTH = 80

export type PullRequestEventType =
  | 'opened'
  | 'synchronize'
  | 'reopened'
  | 'closed'
  | 'edited'
  | 'ready_for_review'
  | 'auto_merge_enabled'
  | 'auto_merge_disabled'
  | 'converted_to_draft'
  | 'locked'
  | 'unlocked'
  | 'labeled'
  | 'unlabeled'
  | 'assigned'
  | 'unassigned'
  | 'merge'
  | null

/**
 * Detects the type of pull request event that triggered the action
 * @returns The pull request event type or null if not a pull_request event
 */
export const getPullRequestEventType = (): PullRequestEventType => {
  const { eventName, payload } = github.context

  // Check if this is a pull_request event
  if (eventName !== 'pull_request') {
    return null
  }

  // Extract the action from the payload
  const action = (payload as { action?: string })?.action

  // Map the action to our type
  const validActions: PullRequestEventType[] = [
    'opened',
    'synchronize',
    'reopened',
    'closed',
    'edited',
    'ready_for_review',
    'auto_merge_enabled',
    'auto_merge_disabled',
    'converted_to_draft',
    'locked',
    'unlocked',
    'labeled',
    'unlabeled',
    'assigned',
    'unassigned',
    'merge'
  ]

  if (action && validActions.includes(action as PullRequestEventType)) {
    return action as PullRequestEventType
  }

  return null
}

export const formatToBaseName = (input: string): string => {
  return input.trim().toLowerCase().replace(/-/g, '.')
}

export const findFirstSlackTimestampComment = ({ comments }: { comments: CommitCommentEvent['comment'][] }) => {
  const pattern = COMMENT_ON_PR
  const regex = new RegExp(`${pattern}\\s*(\\d+\\.\\d+)`)

  for (const comment of comments) {
    const match = comment.body.match(regex)
    if (match) {
      return comment
    }
  }

  return null
}

export const checkLimitText = (text: string) =>
  text.length <= MAX_HEADER_LENGTH ? text : `${text.slice(0, MAX_HEADER_LENGTH - 3)}...`
