"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSlackMessageOnMergedPr = void 0;
const web_api_1 = require("@slack/web-api");
const constants_1 = require("~/service/slack/constants");
const createSlackMessageOnMergedPr = async ({ channelId, slackBotToken, pullRequest, createdPullRequestSlackUser, mergedBySlackUser, repository }) => {
    const slackClient = new web_api_1.WebClient(slackBotToken);
    const createdAtTime = Math.round(new Date(pullRequest.created_at).getTime() / 1000);
    const updatedAtTime = Math.round(new Date(pullRequest.updated_at).getTime() / 1000);
    const openedById = createdPullRequestSlackUser?.id;
    const mergedById = mergedBySlackUser?.id;
    const prOpenedBy = openedById ? `<@${openedById}>` : pullRequest.user.login;
    const mergedBy = mergedById ? `<@${mergedById}>` : pullRequest.merged_by?.login;
    const text = `Hi ${prOpenedBy}, your PR <${pullRequest.html_url}|has been merged successfully> :white_check_mark:`;
    try {
        const messagePayload = {
            channel: channelId,
            as_user: true,
            text,
            attachments: [
                {
                    color: constants_1.SlackMessageColor.MERGED,
                    blocks: [
                        {
                            type: 'header',
                            text: {
                                type: 'plain_text',
                                text: `:employmenthero: [${repository.name}] - :pr-closed: ${pullRequest.title} - #${pullRequest.number}`,
                                emoji: true
                            }
                        },
                        {
                            type: 'section',
                            fields: [
                                {
                                    type: 'mrkdwn',
                                    text: `*Status:*\nMERGED`
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
                            type: 'section',
                            fields: [
                                {
                                    type: 'mrkdwn',
                                    text: `*Updated:*\n<!date^${updatedAtTime}^{date_short} at {time}|Fallback Text>`
                                },
                                {
                                    type: 'mrkdwn',
                                    text: `*Merged by:*\n${mergedBy}`
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
        const response = await slackClient.chat.postMessage(messagePayload);
        console.log({ response });
        if (!response.ts)
            throw new Error('Something wrong with send slack message');
        return response;
    }
    catch (error) {
        console.log('error:', error);
        throw new Error(error.message);
    }
};
exports.createSlackMessageOnMergedPr = createSlackMessageOnMergedPr;
