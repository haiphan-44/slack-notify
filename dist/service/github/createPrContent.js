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
exports.createPrContent = void 0;
const core = __importStar(require("@actions/core"));
const constant_1 = require("~/service/copilot/constant");
const generateContent_1 = require("~/service/copilot/generateContent");
const utils_1 = require("~/service/copilot/utils");
const getFileChanges_js_1 = require("~/service/github/getFileChanges.js");
const getRequestGenerateContextPrompt = ({ formattedFileChanged, prevDesc }) => {
    return `${formattedFileChanged}
----------------
I made the following file changes and need a concise, user-friendly description for my pull request. Please write it based on this template and auto-check the appropriate checkboxes based on my changes:
  ${constant_1.PULL_REQUEST_TEMPLATE}
----------------
Before you overriding the description, please ensure the following:
- If the previous description is already clear and concise, keep it exactly as-is and return it as your full response. (Your response will be used **verbatim** in the pull request.)
- If the previous description is empty, generate a new description based on the template provided.
- If the description already includes a Markdown section titled '## Developer Notes', keep that section and all text under it—up to the next section or the end completely unchanged and intact, exactly as provided. Do not modify, overwrite, or remove any part of it.
- Keep the entire 'Developer Notes' exactly as I provide it, without any changes

Please ensure the following before overriding the template:
- If file names appear in the description, highlight them in Markdown format.
- Automatically check the relevant Type of change box(es) based on the changes.
- Automatically check the appropriate items in the Checklist that correspond to the work completed.
Here is the previous description: ${prevDesc}
`;
};
const getSummaryPromptFromChunks = ({ totalContent, prevDesc }) => {
    return `
${totalContent}
----------------
Based on the summarized content above (which is the result of processing all changed files in chunks), please generate a single, concise, user-friendly pull request description using the following template:
${constant_1.PULL_REQUEST_TEMPLATE}
----------------
Before you override the previous description, follow these rules carefully:

- If the previous description is already clear and concise, you may keep it as is.
- If the previous description is empty, generate a new one from scratch using the template.
- If the description contains a Markdown section titled '## Developer Notes', **retain that section exactly as it is**, including all text under it — do not modify or remove any part of it.
- When listing filenames, highlight them using backticks in Markdown.
- Automatically check the appropriate **Type of change** and **Checklist** items based on the summarized changes.

Here is the previous description: ${prevDesc}
`;
};
const formatChangedFiles = (fileChanged) => {
    return fileChanged.reduce((acc, cur) => {
        return acc + `\n filename:${cur.filename}\n changed:${cur.patch}\n\n`;
    }, '');
};
const createPrContent = async ({ targetBranch, headBranch, prevDesc }) => {
    const fileChanged = await (0, getFileChanges_js_1.getFileChanges)({
        targetBranch,
        headBranch
    });
    if (!fileChanged)
        throw new Error('No file changes found');
    try {
        const formattedFileChanged = formatChangedFiles(fileChanged);
        const generateContentPrompt = getRequestGenerateContextPrompt({ formattedFileChanged, prevDesc });
        const content = await processContent({ generateContentPrompt });
        return content;
    }
    catch (error) {
        // Timeout error
        core.error('Error creating PR content: ' + String(error));
        const fileChangedChunks = splitObjectArrayByCharLimit(fileChanged, 64000);
        let totalContent = '';
        for (const chunk of fileChangedChunks) {
            const formattedChunk = formatChangedFiles(chunk);
            const prompt = getRequestGenerateContextPrompt({ formattedFileChanged: formattedChunk, prevDesc });
            const content = await processContent({ generateContentPrompt: prompt });
            totalContent += content + '\n';
        }
        const generateContentPrompt = getSummaryPromptFromChunks({ totalContent, prevDesc });
        const content = await processContent({ generateContentPrompt });
        return content;
    }
};
exports.createPrContent = createPrContent;
const processContent = async ({ generateContentPrompt }) => {
    const copilotQueryBuilder = await (0, utils_1.getCopilotQueryBuilder)({
        userPrompt: generateContentPrompt
    });
    let hasError = false;
    const response = await (0, generateContent_1.generateContent)(copilotQueryBuilder, (response, done, isError) => {
        if (isError) {
            console.log('Error while generating content: ', response);
            hasError = true;
            return;
        }
        if (done) {
            return response;
        }
    });
    if (hasError) {
        throw new Error('Error generating content from Copilot');
    }
    return response;
};
function splitObjectArrayByCharLimit(arr, maxChars = 64000, serialize = JSON.stringify) {
    const result = [];
    let currentChunk = [];
    let currentLength = 0;
    for (const item of arr) {
        const itemString = serialize(item);
        const itemLength = itemString.length;
        if (itemLength > maxChars) {
            throw new Error(`Item exceeds character limit: ${itemString.slice(0, 100)}...`);
        }
        if (currentLength + itemLength > maxChars) {
            result.push(currentChunk);
            currentChunk = [item];
            currentLength = itemLength;
        }
        else {
            currentChunk.push(item);
            currentLength += itemLength;
        }
    }
    if (currentChunk.length > 0) {
        result.push(currentChunk);
    }
    return result;
}
