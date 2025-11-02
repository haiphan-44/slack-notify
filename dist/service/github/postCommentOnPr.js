"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postCommentOnPr = void 0;
const axios_1 = __importDefault(require("axios"));
const postCommentOnPr = async ({ pullRequest, body }) => {
    try {
        const githubToken = process.env.GITHUB_TOKEN;
        if (!githubToken)
            throw new Error('GITHUB_TOKEN is not defined');
        const response = await axios_1.default.post(pullRequest.comments_url, {
            body
        }, {
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
            }
        });
        return response.data;
    }
    catch (error) {
        console.error('Error postCommentOnPr', error);
    }
};
exports.postCommentOnPr = postCommentOnPr;
