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
exports.generateContent = void 0;
const https = __importStar(require("https"));
const utils_1 = require("~/service/copilot/utils");
const generateContent = async (copilotQueryBuilder, callback) => {
    const request = await (0, utils_1.generateAskRequest)(copilotQueryBuilder.history);
    const body = JSON.stringify(request);
    console.log('body: ', body);
    const options = {
        hostname: 'api.githubcopilot.com',
        path: '/chat/completions',
        method: 'POST',
        headers: {
            Authorization: `Bearer ${copilotQueryBuilder.copilotRequest.token}`,
            'vscode-sessionid': copilotQueryBuilder.copilotRequest.sessionId,
            'x-request-id': copilotQueryBuilder.copilotRequest.uuid,
            'vscode-machineid': copilotQueryBuilder.copilotRequest.machineId,
            'Content-Type': 'application/json',
            'openai-intent': 'conversation-panel',
            'openai-organization': 'github-copilot',
            'User-Agent': 'GitHubCopilotChat/0.14.2024032901',
            'Editor-Version': 'vscode/1.88.0',
            'Editor-Plugin-Version': 'copilot-chat/0.14.2024032901',
            'x-github-api-version': '2023-07-07',
            'copilot-integration-id': 'vscode-chat',
            Accept: '*/*',
            'Accept-Encoding': 'gzip,deflate,br'
        }
    };
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve((0, utils_1.parseResponse)(data, callback));
            });
        });
        req.on('error', (error) => {
            console.log('🚀 --> error:', error);
            reject(error);
        });
        req.write(body);
        req.end();
    });
};
exports.generateContent = generateContent;
