"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCommentOnPr = void 0;
const github_1 = require("@actions/github");
const getPullRequestComments_1 = require("~/service/github/getPullRequestComments");
const utils_1 = require("~/service/slack/utils");
const deleteCommentOnPr = async ({ githubToken, issueContext }) => {
    try {
        const octokit = (0, github_1.getOctokit)(githubToken);
        const comments = await (0, getPullRequestComments_1.getPullRequestComments)({ githubToken, issueContext });
        if (!comments)
            return;
        const findMatchedComment = (0, utils_1.findFirstSlackTimestampComment)({ comments });
        if (findMatchedComment?.id) {
            const response = await octokit.rest.issues.deleteComment({
                comment_id: findMatchedComment.id,
                owner: issueContext.owner,
                repo: issueContext.repo
            });
            console.log({ deleteComment: response });
        }
        else {
            console.log('Not found Slack Timestamp comment...');
        }
    }
    catch (error) {
        console.error('Error postCommentOnPr', error);
    }
};
exports.deleteCommentOnPr = deleteCommentOnPr;
