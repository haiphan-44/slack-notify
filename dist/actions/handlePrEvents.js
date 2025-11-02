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
exports.handlePrEvents = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const prTitleHandle_1 = require("~/actions/prTitleHandle");
const helper_1 = require("~/helpers/helper");
const getUserEmail_1 = require("~/service/github/getUserEmail");
const slackService = __importStar(require("~/service/slack/index"));
const utils_1 = require("~/service/slack/utils");
const handlePrEvents = async () => {
    const eventType = (0, helper_1.getPullRequestEventType)();
    const { payload, issue } = github.context;
    const { pull_request: pullRequest, repository } = payload;
    switch (eventType) {
        case 'opened':
            await handlePrOpened({ pullRequest, repository, issueContext: issue });
            break;
        case 'synchronize':
            await handlePrSynchronized({ pullRequest, repository });
            break;
        case 'reopened':
            await handlePrReopened({ pullRequest, repository });
            break;
        case 'merge':
            await handlePrMerged({ pullRequest, repository });
            break;
        case 'closed':
            await handlePrClosed({ pullRequest, repository });
            break;
        case null:
            core.error('Event type is null');
            break;
        default:
            core.error(`Event type ${eventType} is not supported`);
            break;
    }
};
exports.handlePrEvents = handlePrEvents;
const handlePrOpened = async ({ pullRequest, repository, issueContext }) => {
    console.log(`PR opened by user: ${pullRequest.user.login}`);
    console.log('[DEBUG] handlePrOpened', JSON.stringify({
        pullRequest,
        repository,
        issueContext
    }, null, 2));
    // Update PR title and content
    await (0, prTitleHandle_1.prTitleHandle)();
};
const handlePrSynchronized = async ({ pullRequest, repository }) => {
    console.log(`PR synchronized by user: ${pullRequest.user.login}`);
    // Update PR title and content
    await (0, prTitleHandle_1.prTitleHandle)();
};
const handlePrReopened = async ({ pullRequest, repository }) => {
    console.log(`PR reopened by user: ${pullRequest.user.login}`);
};
const handlePrMerged = async ({ pullRequest, repository }) => {
    console.log(`PR merged by user: ${pullRequest.user.login}`);
    console.log('[DEBUG] handlePrMerged', JSON.stringify({
        pullRequest,
        repository
    }, null, 2));
    const slackChannelId = core.getInput('slack-channel-id');
    const slackBotToken = core.getInput('slack-bot-token');
    const prCreatorLogin = pullRequest.user?.login;
    if (!prCreatorLogin) {
        core.error('Failed to get PR creator username');
        return;
    }
    const prCreatorEmail = await (0, getUserEmail_1.getUserEmail)({ username: prCreatorLogin });
    const prCreatorGithubUser = prCreatorEmail || (0, helper_1.formatToBaseName)(prCreatorLogin);
    const createdPullRequestSlackUser = await (0, utils_1.convertCreatedPullRequestToSlackUser)({
        githubUser: prCreatorGithubUser,
        slackBotToken,
        slackChannelId
    });
    const mergedBySlackUserLogin = pullRequest.merged_by?.login;
    if (!mergedBySlackUserLogin) {
        core.error('Failed to get merged by username');
        return;
    }
    const mergedByEmail = await (0, getUserEmail_1.getUserEmail)({ username: mergedBySlackUserLogin });
    const mergedByGithubUser = mergedByEmail || (0, helper_1.formatToBaseName)(mergedBySlackUserLogin);
    const mergedBySlackUser = await (0, utils_1.convertCreatedPullRequestToSlackUser)({
        githubUser: mergedByGithubUser,
        slackBotToken,
        slackChannelId
    });
    core.warning(`prCreatorGithubUser: ${prCreatorGithubUser}`);
    core.warning(`mergedByGithubUser: ${mergedByGithubUser}`);
    core.warning(`createdPullRequestSlackUser: ${createdPullRequestSlackUser}`);
    core.warning(`mergedBySlackUser: ${mergedBySlackUser}`);
    // Create Slack message on merged PR
    await slackService.createSlackMessageOnMergedPr({
        channelId: slackChannelId,
        slackBotToken,
        createdPullRequestSlackUser,
        pullRequest,
        repository,
        mergedBySlackUser
    });
};
const handlePrClosed = async ({ pullRequest, repository }) => {
    console.log(`PR closed by user: ${pullRequest.user.login}`);
};
