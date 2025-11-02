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
exports.checkLimitText = exports.findFirstSlackTimestampComment = exports.formatToBaseName = exports.getPullRequestEventType = void 0;
const github = __importStar(require("@actions/github"));
const constant_1 = require("~/constant");
const MAX_HEADER_LENGTH = 80;
/**
 * Detects the type of pull request event that triggered the action
 * @returns The pull request event type or null if not a pull_request event
 */
const getPullRequestEventType = () => {
    const { eventName, payload } = github.context;
    // Check if this is a pull_request event
    if (eventName !== 'pull_request') {
        return null;
    }
    // Extract the action from the payload
    const action = payload?.action;
    if (action === 'closed') {
        const pullRequest = payload?.pull_request;
        if (pullRequest?.merged) {
            return 'merge';
        }
        return 'closed';
    }
    // Map the action to our type
    const validActions = [
        'opened',
        'synchronize',
        'reopened',
        'closed',
        'edited',
        'ready_for_review',
        'auto_merge_enabled',
        'auto_merge_disabled',
        'converted_to_draft',
        'locked',
        'unlocked',
        'labeled',
        'unlabeled',
        'assigned',
        'unassigned',
        'merge'
    ];
    if (action && validActions.includes(action)) {
        return action;
    }
    return null;
};
exports.getPullRequestEventType = getPullRequestEventType;
const formatToBaseName = (input) => {
    return input.trim().toLowerCase().replace(/-/g, '.');
};
exports.formatToBaseName = formatToBaseName;
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
const checkLimitText = (text) => text.length <= MAX_HEADER_LENGTH ? text : `${text.slice(0, MAX_HEADER_LENGTH - 3)}...`;
exports.checkLimitText = checkLimitText;
