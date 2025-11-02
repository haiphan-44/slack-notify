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
exports.getUserEmail = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const getUserEmail = async ({ username }) => {
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN || '');
    try {
        const { data: user } = await octokit.rest.users.getByUsername({
            username
        });
        // Public email may be null if user has set it to private
        if (user.email) {
            return user.email;
        }
        try {
            const { data: authUser } = await octokit.rest.users.getAuthenticated();
            if (authUser.login === username && authUser.email) {
                return authUser.email;
            }
        }
        catch (error) {
            // Silently fail - we don't have permission or user is not authenticated
            core.debug(`Could not get authenticated user email: ${error}`);
        }
        return null;
    }
    catch (error) {
        core.warning(`Failed to fetch email for user ${username}: ${error}`);
        return null;
    }
};
exports.getUserEmail = getUserEmail;
