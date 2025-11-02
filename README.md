# Slack PR Notification GitHub Action

This GitHub Action automatically sends Slack notifications for GitHub pull request events. It handles multiple PR lifecycle events including when PRs are opened, synchronized, reopened, or merged, and posts rich formatted messages to your Slack channels.

## Features

- **Automatic PR Notifications**: Posts formatted Slack messages for PR lifecycle events
- **Rich Message Formatting**: Uses Slack Block Kit for visually appealing messages with PR details
- **User Mentions**: Maps GitHub usernames to Slack users for proper @mentions
- **PR Event Handling**: Supports multiple PR event types:
  - `opened` - When a PR is first opened
  - `synchronize` - When new commits are pushed to the PR
  - `reopened` - When a closed PR is reopened
  - `merge` - When a PR is merged
- **Auto PR Title & Content Generation**: Automatically generates and updates PR titles and descriptions using AI
- **Color-Coded Status**: Different message colors for open, merged, and closed PRs

## Prerequisites

1. **Slack Bot Token**: A Slack bot with the following permissions:
   - `chat:write`
   - `chat:write.public`
   - `users:read`
   - `channels:read`
   - `groups:read`

   See [SLACK_BOT_PERMISSIONS.md](./docs/SLACK_BOT_PERMISSIONS.md) for detailed setup instructions.

2. **Slack Channel ID**: The ID of the Slack channel where notifications should be posted

3. **GitHub Token**: Automatically provided via `${{ github.token }}`

4. **Copilot Token** (optional): Required for AI-powered PR title and content generation

## Usage

### Basic Setup

Add this action to your GitHub Actions workflow file (e.g., `.github/workflows/pr-notification.yml`):

```yaml
name: PR Notification

on:
  pull_request:
    types:
      - opened
      - synchronize
      - reopened
      - merge

jobs:
  notify-slack:
    name: Notify Slack on PR Events
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Send PR Notification to Slack
        uses: [your-org]/slack-notify@main
        with:
          slack-channel-id: ${{ secrets.SLACK_CHANNEL_ID }}
          slack-bot-token: ${{ secrets.SLACK_BOT_TOKEN }}
        env:
          GITHUB_TOKEN: ${{ github.token }}
          COPILOT_TOKEN: ${{ secrets.COPILOT_TOKEN }}
```

### Required Inputs

| Input              | Description                                             | Required |
| ------------------ | ------------------------------------------------------- | -------- |
| `slack-channel-id` | The Slack channel ID where notifications will be posted | Yes      |
| `slack-bot-token`  | The Slack bot token (starts with `xoxb-`)               | Yes      |

### Environment Variables

| Variable        | Description                                 | Required |
| --------------- | ------------------------------------------- | -------- |
| `GITHUB_TOKEN`  | GitHub token for API access (auto-provided) | Yes      |
| `COPILOT_TOKEN` | GitHub Copilot token for AI features        | Optional |

### Example Workflow with All Events

```yaml
name: PR Notifications

on:
  pull_request:
    types:
      - opened      # Initial PR notification
      - synchronize # Update on new commits
      - reopened    # PR reopened after being closed
      - merge       # PR merged notification

jobs:
  notify:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: PR Notification
        uses: [your-org]/slack-notify@main
        with:
          slack-channel-id: ${{ secrets.SLACK_CHANNEL_ID }}
          slack-bot-token: ${{ secrets.SLACK_BOT_TOKEN }}
        env:
          GITHUB_TOKEN: ${{ github.token }}
          COPILOT_TOKEN: ${{ secrets.COPILOT_TOKEN }}
```

## Setting Up Secrets

### 1. Get Slack Channel ID

1. Open Slack in your browser
2. Navigate to your channel
3. The channel ID is in the URL: `https://workspace.slack.com/archives/C1234567890`
4. The ID is the part after `/archives/` (e.g., `C1234567890`)

### 2. Create Slack Bot Token

1. Go to https://api.slack.com/apps
2. Create a new app or select existing app
3. Go to **OAuth & Permissions** → **Bot Token Scopes**
4. Add these scopes:
   - `chat:write`
   - `chat:write.public`
   - `users:read`
   - `channels:read`
   - `groups:read`
5. Install the app to your workspace
6. Copy the Bot Token (starts with `xoxb-`)

### 3. Add GitHub Secrets

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:
   - `SLACK_CHANNEL_ID`: Your Slack channel ID
   - `SLACK_BOT_TOKEN`: Your Slack bot token
   - `COPILOT_TOKEN`: Your GitHub Copilot token (if using AI features)

## What Happens for Each Event

### `opened` Event

- Generates PR title and content using AI
- Updates the PR with generated content
- (Note: Slack notification is only sent on merge event)

### `synchronize` Event

- Regenerates PR title and content when new commits are pushed
- Updates the PR with new content

### `reopened` Event

- Logs the PR reopening event

### `merge` Event

- Posts a formatted Slack message with:
  - PR title and number
  - Repository name
  - Status (MERGED)
  - Creator information
  - Merge information
  - Files changed count
  - Link to view the PR

## Troubleshooting

### Bot not posting messages

- Verify the bot has `chat:write` and `chat:write.public` permissions
- Ensure the bot is added to the target channel (or has `chat:write.public`)
- Check that the `SLACK_CHANNEL_ID` is correct

### User mentions not working

- Verify the bot has `users:read` permission
- Ensure GitHub usernames match Slack usernames (case-insensitive)

### Channel member listing fails

- Verify the bot has `channels:read` (for public channels) or `groups:read` (for private channels)
