/**
 * Enum for Slack message attachment colors
 * These colors are used to visually distinguish different PR states in Slack messages
 */
export enum SlackMessageColor {
  /** Yellow/Gold color for open PRs */
  OPEN = '#ffe066',
  /** Purple color for merged PRs */
  MERGED = '#6f42c1',
  /** Red color for closed PRs */
  CLOSED = '#FF0000',
  /** Light green color for approved PRs */
  APPROVED = '#99FF99'
}
