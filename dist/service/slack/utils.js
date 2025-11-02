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
exports.findFirstSlackTimestampComment = exports.convertCreatedPullRequestToSlackUser = exports.getSlackTimestamp = void 0;
const core = __importStar(require("@actions/core"));
const constant_1 = require("~/constant");
const githubService = __importStar(require("~/service/github/index"));
const slackService = __importStar(require("~/service/slack/index"));
const getSlackTimestamp = async ({ issueContext }) => {
    try {
        const comments = await githubService.getPullRequestComments({ githubToken: process.env.GITHUB_TOKEN, issueContext });
        if (!Array.isArray(comments) || comments.length === 0)
            return null;
        const matchedComment = (0, exports.findFirstSlackTimestampComment)({ comments });
        if (!matchedComment)
            return null;
        const [_, ts] = matchedComment.body.split(constant_1.COMMENT_ON_PR);
        if (!ts)
            return null;
        return ts.trim();
    }
    catch (error) {
        core.error(`Error in getSlackTimestamp: ${error}`);
        return null;
    }
};
exports.getSlackTimestamp = getSlackTimestamp;
const convertCreatedPullRequestToSlackUser = async ({ slackChannelId, slackBotToken, githubUser }) => {
    const slackUserIds = await slackService.getUsersInSlackChannel({
        channelId: slackChannelId,
        slackBotToken
    });
    const getAllSlackMembersName = await Promise.all(
    // @ts-ignore
    slackUserIds.map(async (slackUserId) => slackService.getSlackUser({ slackBotToken, slackUserId }))).then((res) => res.filter((user) => user !== null && user !== undefined));
    const createdPullRequestSlackUser = getAllSlackMembersName.find((member) => member.name === githubUser);
    return createdPullRequestSlackUser;
};
exports.convertCreatedPullRequestToSlackUser = convertCreatedPullRequestToSlackUser;
const findFirstSlackTimestampComment = ({ comments }) => {
    const pattern = constant_1.COMMENT_ON_PR;
    const regex = new RegExp(`${pattern}\\s*(\\d+\\.\\d+)`);
    for (const comment of comments) {
        const match = comment.body.match(regex);
        if (match) {
            return comment;
        }
    }
    return null;
};
exports.findFirstSlackTimestampComment = findFirstSlackTimestampComment;
