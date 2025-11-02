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
exports.getFileChanges = void 0;
const core = __importStar(require("@actions/core"));
const rest_1 = require("@octokit/rest");
const getFileChanges = async ({ targetBranch, headBranch }) => {
    const owner = process.env.GITHUB_REPOSITORY_OWNER;
    const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
    const githubToken = process.env.GITHUB_TOKEN;
    if (!owner || !repo || !githubToken) {
        throw new Error('Missing owner or repo or githubToken');
    }
    const octokit = new rest_1.Octokit({
        auth: githubToken
    });
    try {
        const response = await octokit.repos.compareCommits({
            owner,
            repo,
            base: targetBranch,
            head: headBranch
        });
        return response.data.files;
    }
    catch (error) {
        core.error('Error getting diff from GitHub API: ' + String(error));
        throw error;
    }
};
exports.getFileChanges = getFileChanges;
