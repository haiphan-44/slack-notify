"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPrTitle = void 0;
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
    const response = await (0, generateContent_1.generateContent)(copilotQueryBuilder, (response, done, isError) => {
        if (isError) {
            console.log('Error: ', response);
            return;
        }
        if (done) {
            return response;
        }
    });
    return response;
};
exports.createPrTitle = createPrTitle;
