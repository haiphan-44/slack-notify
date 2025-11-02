"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSlackUser = void 0;
const web_api_1 = require("@slack/web-api");
const getSlackUser = async ({ slackBotToken, slackUserId }) => {
    const slackClient = new web_api_1.WebClient(slackBotToken);
    try {
        const response = await slackClient.users.info({ user: slackUserId });
        if (response.ok) {
            return response.user;
        }
        return null;
    }
    catch (error) {
        console.error('Error fetching users in channel:', error);
        return null;
    }
};
exports.getSlackUser = getSlackUser;
