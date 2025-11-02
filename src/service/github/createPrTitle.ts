import * as core from '@actions/core'

import { SYSTEM_PROMPT } from '~/service/copilot/constant'
import { generateContent } from '~/service/copilot/generateContent'
import { CopilotQueryBuilder } from '~/service/copilot/type'
import { generateCopilotRequest } from '~/service/copilot/utils'

export const createPrTitle = async ({
  prTemplateContent,
  prevTitle
}: {
  prTemplateContent: string
  prevTitle: string
}) => {
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
  
  Return only the final result in plain text format. No explanations or markdown.`

  const copilotQueryBuilder: CopilotQueryBuilder = {
    copilotRequest: null,
    history: [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: userPrompt
      }
    ]
  }

  const request = await generateCopilotRequest()

  copilotQueryBuilder.copilotRequest = request

  let hasError = false
  const response = await generateContent(copilotQueryBuilder, (response, done, isError) => {
    if (isError) {
      console.log('Error: ', response)
      hasError = true
      return
    }

    if (done) {
      return response
    }
  })

  // If generation failed or returned empty, use previous title as fallback
  if (hasError || !response || response.trim() === '') {
    core.warning('PR title generation failed or returned empty, using previous title as fallback')
    return prevTitle || ''
  }

  return response.trim()
}
