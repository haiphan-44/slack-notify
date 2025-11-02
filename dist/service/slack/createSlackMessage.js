"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSlackMessage = void 0;
const web_api_1 = require("@slack/web-api");
const constants_1 = require("~/service/slack/constants");
const createSlackMessage = async ({ channelId, slackBotToken, pullRequest, createdPullRequestSlackUser, repository, prDetail }) => {
    const slackClient = new web_api_1.WebClient(slackBotToken);
    const timeTs = Math.round(new Date(pullRequest.created_at).getTime() / 1000);
    const slackUserId = createdPullRequestSlackUser?.id;
    const prOpenedBy = slackUserId ? `<@${slackUserId}>` : pullRequest.user.login;
    try {
        const messagePayload = {
            channel: channelId,
            as_user: true,
            text: `${prOpenedBy} has opened a new PR. Please help to review it! :5628_pepe_saber:`,
            attachments: [
                {
                    color: constants_1.SlackMessageColor.OPEN,
                    blocks: [
                        {
                            type: 'header',
                            text: {
                                type: 'plain_text',
                                text: `:ncp: [${repository.name}] - :pull-request: ${pullRequest.title} - #${pullRequest.number}`,
                                emoji: true
                            }
                        },
                        {
                            type: 'section',
                            fields: [
                                {
                                    type: 'mrkdwn',
                                    text: `*Status:*\nOPEN`
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
                                    text: `*When:*\n<!date^${timeTs}^{date_short} at {time}|Fallback Text>`
                                },
                                {
                                    type: 'mrkdwn',
                                    text: `${prDetail}`
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
                    ]
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
exports.createSlackMessage = createSlackMessage;
