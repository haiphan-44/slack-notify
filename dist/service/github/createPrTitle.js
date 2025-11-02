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
exports.createPrTitle = void 0;
const core = __importStar(require("@actions/core"));
const constant_1 = require("~/service/copilot/constant");
const generateContent_1 = require("~/service/copilot/generateContent");
const utils_1 = require("~/service/copilot/utils");
const createPrTitle = async ({ prTemplateContent, prevTitle }) => {
    const userPrompt = `${prTemplateContent}
  ----------------
  Your task is to generate a short, easy-to-understand pull request **title** that summarizes the main changes (e.g., style updates, text modifications).
  
  Please follow these rules:
  
  - Return only the final title, in plain text (not Markdown or quotes).
  - Here is the previous title: '${prevTitle}'
  - Read and analyze the previous title before generating the new one.
  
  **Prefix handling:**
  - If the previous title starts with a prefix in square brackets (e.g., \`[Feature]\`, \`[Fix]\`), you must:
    - **Keep** the prefix exactly as-is.
    - **Replace only** the text after the prefix with a new concise title.
  - If no prefix exists, generate **only** the new title content — do **not** add a prefix.
  
  **Additional requirements:**
  - Always generate a new title, even if the previous one is already clear and concise.
  - The new title must accurately summarize the main change.
  - Avoid using vague words like "stuff", "things", or overly generic titles.
  
  Return only the final result in plain text format. No explanations or markdown.`;
    const copilotQueryBuilder = {
        copilotRequest: null,
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
    const request = await (0, utils_1.generateCopilotRequest)();
    copilotQueryBuilder.copilotRequest = request;
    let hasError = false;
    const response = await (0, generateContent_1.generateContent)(copilotQueryBuilder, (response, done, isError) => {
        console.log('🚀 --> response:', response);
        if (isError) {
            console.log('Error: ', response);
            hasError = true;
            return;
        }
        if (done) {
            return response;
        }
    });
    // If generation failed or returned empty, use previous title as fallback
    if (hasError || !response || response.trim() === '') {
        core.warning('PR title generation failed or returned empty, using previous title as fallback');
        return prevTitle || '';
    }
    return response.trim();
};
exports.createPrTitle = createPrTitle;
