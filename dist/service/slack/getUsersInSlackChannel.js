"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsersInSlackChannel = void 0;
const web_api_1 = require("@slack/web-api");
const getUsersInSlackChannel = async ({ channelId, slackBotToken }) => {
    const slackClient = new web_api_1.WebClient(slackBotToken);
    try {
        const response = await slackClient.conversations.members({
            channel: channelId
        });
        if (response.ok) {
            return response.members;
        }
        return [];
    }
    catch (error) {
        console.error('Error fetching users in channel:', error);
        return [];
    }
};
exports.getUsersInSlackChannel = getUsersInSlackChannel;
