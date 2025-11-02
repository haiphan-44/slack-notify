"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSlackMessageOnMergedPr = void 0;
const core = __importStar(require("@actions/core"));
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
        if (!response.ts)
            throw new Error('Something wrong with send slack message');
        return response;
    }
    catch (error) {
        core.error(`[createSlackMessageOnMergedPr] Failed to create slack message on merged PR: ${error.message}`);
        throw error;
    }
};
exports.createSlackMessageOnMergedPr = createSlackMessageOnMergedPr;
