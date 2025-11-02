"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSlackMessageOnPrTitleChange = void 0;
const web_api_1 = require("@slack/web-api");
const helper_1 = require("~/helpers/helper");
const constants_1 = require("~/service/slack/constants");
const updateSlackMessageOnPrTitleChange = async ({ channelId, pullRequest, repository, slackBotToken, slackTimestamp, createdPullRequestSlackUser, generatedPrTitle }) => {
    const slackClient = new web_api_1.WebClient(slackBotToken);
    const state = pullRequest.state === 'closed' ? (pullRequest.merged ? 'MERGED' : 'CLOSED') : pullRequest.state;
    const color = state === 'MERGED'
        ? constants_1.SlackMessageColor.MERGED
        : state === 'CLOSED'
            ? constants_1.SlackMessageColor.CLOSED
            : constants_1.SlackMessageColor.OPEN;
    const createdAtTime = Math.round(new Date(pullRequest.created_at).getTime() / 1000);
    const slackUserId = createdPullRequestSlackUser?.id;
    const prOpenedBy = slackUserId ? `<@${slackUserId}>` : pullRequest.user.login;
    const text = `${prOpenedBy} has opened a new PR. Please help to review it! <!channel> :pepe_hands:`;
    console.log({
        generatedPrTitle,
        formattedPrTitle: `:ncp: [${repository.name}] - :pull-request: ${(0, helper_1.checkLimitText)(generatedPrTitle)} - #${pullRequest.number}`,
        lengthOfText: `:ncp: [${repository.name}] - :pull-request: ${(0, helper_1.checkLimitText)(generatedPrTitle)} - #${pullRequest.number}`.length
    });
    const messagePayload = {
        channel: channelId,
        as_user: true,
        ts: slackTimestamp,
        text,
        attachments: [
            {
                color,
                // @ts-ignore
                blocks: [
                    {
                        type: 'header',
                        text: {
                            type: 'plain_text',
                            text: `:ncp: [${repository.name}] - :pull-request: ${(0, helper_1.checkLimitText)(generatedPrTitle)} - #${pullRequest.number}`,
                            emoji: true
                        }
                    },
                    {
                        type: 'section',
                        fields: [
                            {
                                type: 'mrkdwn',
                                text: `*Status:*\n${state.toUpperCase()}`
                            },
                            {
                                type: 'mrkdwn',
                                text: `*Opened by:*\n${prOpenedBy}`
                            }
                        ]
                    },
                    {
                        type: 'section',
                        fields: [
                            {
                                type: 'mrkdwn',
                                text: `*When:*\n<!date^${createdAtTime}^{date_short} at {time}|Fallback Text>`
                            },
                            {
                                type: 'mrkdwn',
                                text: `*Files Changed:*\n${pullRequest.changed_files}`
                            }
                        ]
                    },
                    {
                        type: 'actions',
                        elements: [
                            {
                                type: 'button',
                                text: {
                                    type: 'plain_text',
                                    emoji: true,
                                    text: 'View PR'
                                },
                                style: 'primary',
                                url: pullRequest.html_url
                            }
                        ]
                    }
                ].filter(Boolean)
            }
        ]
    };
    try {
        const updateResponse = await slackClient.chat.update(messagePayload);
        if (updateResponse.ok) {
            console.log('Slack message updated successfully');
        }
        else {
            console.error('Failed to update Slack message:', updateResponse.error);
        }
    }
    catch (error) {
        console.error('Error updating Slack message:', error);
    }
};
exports.updateSlackMessageOnPrTitleChange = updateSlackMessageOnPrTitleChange;
