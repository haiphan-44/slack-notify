"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePrTitle = void 0;
const github_1 = require("@actions/github");
const updatePrTitle = async ({ githubToken, issueContext, title, pullRequest }) => {
    try {
        const octokit = (0, github_1.getOctokit)(githubToken);
        await octokit.rest.pulls.update({
            owner: issueContext.owner,
            repo: issueContext.repo,
            title,
            pull_number: pullRequest.number
        });
    }
    catch (error) {
        console.error('Error updatePrTitle', error);
    }
};
exports.updatePrTitle = updatePrTitle;
