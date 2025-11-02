"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateThreadMessageOnGeneratePrContent = void 0;
const web_api_1 = require("@slack/web-api");
const updateThreadMessageOnGeneratePrContent = async ({ channelId, slackBotToken, slackTimestamp, createdPullRequestSlackUser, pullRequest, codeReviewUrls }) => {
    const slackClient = new web_api_1.WebClient(slackBotToken);
    const slackUserId = createdPullRequestSlackUser?.id;
    const prOpenedBy = slackUserId ? `<@${slackUserId}>` : pullRequest.user.login;
    const relatedUrl = pullRequest.html_url;
    const messageParts = [`Hi, ${prOpenedBy}! :wave:`, `PR metadata updated at <${relatedUrl}|here> :blob-bot:`];
    if (codeReviewUrls && codeReviewUrls.length > 0) {
        const suggestions = codeReviewUrls.map((url, index) => `- <${url}|Suggestion ${index + 1}>`).join('\n');
        messageParts.push(`Here are some suggestions for code quality improvements :troc-hehe::\n${suggestions}`);
    }
    messageParts.push('Please take a look! :pepe-hmm:');
    const message = messageParts.join('\n\n');
    try {
        // Post a Slack message for comments
        const response = await slackClient.chat.postMessage({
            channel: channelId,
            thread_ts: slackTimestamp,
            text: message
        });
        console.log('Post a thread Slack message: ', response);
    }
    catch (error) {
        console.error('Error posting to Slack:', error);
    }
};
exports.updateThreadMessageOnGeneratePrContent = updateThreadMessageOnGeneratePrContent;
