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
exports.prTitleHandle = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const createPrContent_1 = require("~/service/github/createPrContent");
const githubService = __importStar(require("~/service/github/index"));
const prTitleHandle = async () => {
    try {
        const { payload, issue } = github.context;
        const { pull_request: pullRequest, repository } = payload;
        const targetBranch = pullRequest.base.ref;
        const prevTitle = await githubService.getPreviousTitle({
            issueContext: issue,
            pullRequestNumber: pullRequest.number
        });
        // Generate PR content
        const prTemplateContent = await (0, createPrContent_1.createPrContent)({
            targetBranch,
            headBranch: pullRequest.head.ref,
            prevDesc: pullRequest.body
        });
        // Generate PR title
        const prTitle = await githubService.createPrTitle({ prTemplateContent, prevTitle });
        // Validate before updating
        if (!prTitle || prTitle.trim() === '') {
            core.warning('Generated PR title is empty, skipping title update');
        }
        else {
            // Update PR title
            await githubService.updatePrTitle({
                githubToken: process.env.GITHUB_TOKEN,
                issueContext: issue,
                title: prTitle,
                pullRequest
            });
        }
        // Update PR content (if not empty)
        if (!prTemplateContent || prTemplateContent.trim() === '') {
            core.warning('Generated PR content is empty, skipping content update');
        }
        else {
            await githubService.updatePrContent({
                githubToken: process.env.GITHUB_TOKEN,
                issueContext: issue,
                body: prTemplateContent,
                pullRequest
            });
        }
        // Generate PR code reviews
        // if (isReviewCode) {
        //   core.warning('Starting to generate PR code reviews')
        //   await githubService.createPrCodeReviews({
        //     targetBranch,
        //     headBranch: pullRequest.head.ref,
        //     pullNumber: pullRequest.number
        //   })
        // } else {
        //   core.warning('Skipping code review steps.')
        // }
        return prTitle;
    }
    catch (error) {
        core.error(`Error in prTitleHandle: ${error}`);
        return '';
    }
};
exports.prTitleHandle = prTitleHandle;
