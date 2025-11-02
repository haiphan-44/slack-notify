"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPullRequestComments = void 0;
const github_1 = require("@actions/github");
const getPullRequestComments = async ({ githubToken, issueContext }) => {
    const octokit = (0, github_1.getOctokit)(githubToken);
    const { owner, repo, number } = issueContext;
    try {
        const { data } = await octokit.rest.issues.listComments({
            owner,
            repo,
            issue_number: number
        });
        return data;
    }
    catch (error) {
        console.error('Error fetching PR comments:', error);
    }
};
exports.getPullRequestComments = getPullRequestComments;
