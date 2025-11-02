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
exports.getCopilotQueryBuilder = exports.generateCopilotRequest = exports.parseResponse = exports.generateAskRequest = void 0;
const core = __importStar(require("@actions/core"));
const crypto = __importStar(require("crypto"));
const https = __importStar(require("https"));
const constant_1 = require("~/service/copilot/constant");
const uuid = () => {
    return crypto.randomUUID();
};
const machineID = () => {
    return crypto.randomBytes(32).toString('hex');
};
const sessionID = () => {
    return uuid() + Date.now().toString();
};
const jsonParse = (s) => {
    try {
        return JSON.parse(s);
    }
    catch (error) {
        core.warning(`Error parsing JSON: ${error}`);
        return null;
    }
};
const removeUntilData = (s) => {
    const index = s.indexOf('data:');
    return index === -1 ? s : s.substring(index + 'data: '.length);
};
const getToken = () => {
    console.log('copilot token: ', process.env.COPILOT_TOKEN);
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: '/copilot_internal/v2/token',
            method: 'GET',
            headers: {
                Authorization: `token ${process.env.COPILOT_TOKEN}`,
                Accept: 'application/json',
                'Editor-Version': 'vscode/1.85.1',
                'Editor-Plugin-Version': 'copilot-chat/0.12.2023120701',
                'User-Agent': 'GitHubCopilotChat/0.12.2023120701'
            }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const tokenResponse = JSON.parse(data);
                resolve(tokenResponse.token);
            });
        });
        req.on('error', (error) => {
            reject(error);
        });
        req.end();
    });
};
const generateAskRequest = (history) => {
    return Promise.resolve({
        intent: true,
        model: 'gpt-4o',
        n: 1,
        stream: true,
        temperature: 0.1,
        top_p: 1,
        messages: history,
        history: history,
        max_tokens: 8192
    });
};
exports.generateAskRequest = generateAskRequest;
const parseResponse = (data, callback) => {
    console.log('📥 parseResponse - raw data length:', data.length);
    console.log('📥 parseResponse - raw data preview:', data.substring(0, 500));
    const lines = data.split('\n');
    let isError = false;
    let reply = '';
    for (const line of lines) {
        const s = line.trim();
        if (!s) {
            continue;
        }
        if (s.startsWith('{"error":')) {
            const error = JSON.parse(s);
            reply = error.error.message;
            isError = true;
            console.log('❌ parseResponse - Error detected:', reply);
            break;
        }
        if (s.includes('[DONE]')) {
            console.log('✅ parseResponse - [DONE] marker found');
            break;
        }
        if (!s.startsWith('data:')) {
            continue;
        }
        const jsonExtract = removeUntilData(s);
        const message = jsonParse(jsonExtract);
        if (!message) {
            console.warn('⚠️ parseResponse - Failed to parse JSON:', jsonExtract.substring(0, 200));
            continue;
        }
        if (!message.choices || message.choices.length === 0) {
            console.warn('⚠️ parseResponse - No choices in message');
            continue;
        }
        const delta = message.choices[0]?.delta;
        if (delta && delta.content) {
            const txt = delta.content;
            reply += txt;
            callback(reply, false, isError);
        }
    }
    console.log('📤 parseResponse - Final reply length:', reply.length);
    console.log('📤 parseResponse - Final reply:', reply.substring(0, 200));
    callback(reply, true, isError);
    return reply;
};
exports.parseResponse = parseResponse;
const generateCopilotRequest = async () => {
    const token = await getToken();
    return {
        token,
        sessionId: sessionID(),
        uuid: uuid(),
        machineId: machineID()
    };
};
exports.generateCopilotRequest = generateCopilotRequest;
const getCopilotQueryBuilder = async ({ userPrompt }) => {
    const copilotRequest = await (0, exports.generateCopilotRequest)();
    return {
        copilotRequest,
        history: [
            {
                role: 'system',
                content: constant_1.SYSTEM_PROMPT
            },
            {
                role: 'user',
                content: userPrompt
            }
        ]
    };
};
exports.getCopilotQueryBuilder = getCopilotQueryBuilder;
