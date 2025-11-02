"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateThreadMessageOnClosePR = void 0;
const web_api_1 = require("@slack/web-api");
const updateThreadMessageOnClosePR = async ({ channelId, slackBotToken, slackTimestamp, createdPullRequestSlackUser, mergedPullRequestSlackUser, pullRequest }) => {
    const slackClient = new web_api_1.WebClient(slackBotToken);
    const slackUserId = createdPullRequestSlackUser?.id;
    const prOpenedBy = slackUserId ? `<@${slackUserId}>` : pullRequest.user.login;
    const prMergedBy = mergedPullRequestSlackUser?.id ? `<@${mergedPullRequestSlackUser.id}>` : slackUserId;
    const hasMergedState = Boolean(mergedPullRequestSlackUser);
    const relatedUrl = pullRequest.html_url;
    try {
        if (hasMergedState) {
            const message = `Hi, ${prOpenedBy}, <${relatedUrl}|your PR> has been merged by ${prMergedBy} 🎉.`;
            // Post a Slack message for comments
            const response = await slackClient.chat.postMessage({
                channel: channelId,
                thread_ts: slackTimestamp,
                text: message
            });
            console.log('Post a thread Slack message: ', response);
        }
        else {
            console.log('Not merge event: ', {
                mergedPullRequestSlackUser,
                pullRequest
            });
        }
    }
    catch (error) {
        console.error('Error posting to Slack:', error);
    }
};
exports.updateThreadMessageOnClosePR = updateThreadMessageOnClosePR;
