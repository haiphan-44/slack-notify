import * as core from '@actions/core'

import { PULL_REQUEST_TEMPLATE } from '~/service/copilot/constant'
import { generateContent } from '~/service/copilot/generateContent'
import { getCopilotQueryBuilder } from '~/service/copilot/utils'
import { getFileChanges } from '~/service/github/getFileChanges.js'

const getRequestGenerateContextPrompt = ({
  formattedFileChanged,
  prevDesc
}: {
  formattedFileChanged: string
  prevDesc: string | null
}): string => {
  return `${formattedFileChanged}
----------------
I made the following file changes and need a concise, user-friendly description for my pull request. Please write it based on this template and auto-check the appropriate checkboxes based on my changes:
  ${PULL_REQUEST_TEMPLATE}
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
`
}

const getSummaryPromptFromChunks = ({
  totalContent,
  prevDesc
}: {
  totalContent: string
  prevDesc: string | null
}): string => {
  return `
${totalContent}
----------------
Based on the summarized content above (which is the result of processing all changed files in chunks), please generate a single, concise, user-friendly pull request description using the following template:
${PULL_REQUEST_TEMPLATE}
----------------
Before you override the previous description, follow these rules carefully:

- If the previous description is already clear and concise, you may keep it as is.
- If the previous description is empty, generate a new one from scratch using the template.
- If the description contains a Markdown section titled '## Developer Notes', **retain that section exactly as it is**, including all text under it — do not modify or remove any part of it.
- When listing filenames, highlight them using backticks in Markdown.
- Automatically check the appropriate **Type of change** and **Checklist** items based on the summarized changes.

Here is the previous description: ${prevDesc}
`
}

const formatChangedFiles = (fileChanged: { filename?: string; patch?: string }[]): string => {
  return fileChanged.reduce((acc, cur) => {
    return acc + `\n filename:${cur.filename}\n changed:${cur.patch}\n\n`
  }, '')
}
export const createPrContent = async ({
  targetBranch,
  headBranch,
  prevDesc
}: {
  targetBranch: string
  headBranch: string
  prevDesc: string | null
}) => {
  const fileChanged = await getFileChanges({
    targetBranch,
    headBranch
  })
  if (!fileChanged) throw new Error('No file changes found')
  try {
    const formattedFileChanged = formatChangedFiles(fileChanged)

    const generateContentPrompt = getRequestGenerateContextPrompt({ formattedFileChanged, prevDesc })

    const content = await processContent({ generateContentPrompt })
    return content
  } catch (error) {
    // Timeout error
    core.error('Error creating PR content: ' + String(error))

    const fileChangedChunks = splitObjectArrayByCharLimit(fileChanged, 64000)
    let totalContent = ''
    for (const chunk of fileChangedChunks) {
      const formattedChunk = formatChangedFiles(chunk)
      const prompt = getRequestGenerateContextPrompt({ formattedFileChanged: formattedChunk, prevDesc })
      const content = await processContent({ generateContentPrompt: prompt })
      totalContent += content + '\n'
    }

    const generateContentPrompt = getSummaryPromptFromChunks({ totalContent, prevDesc })
    const content = await processContent({ generateContentPrompt })
    return content
  }
}

const processContent = async ({ generateContentPrompt }: { generateContentPrompt: string }): Promise<string> => {
  const copilotQueryBuilder = await getCopilotQueryBuilder({
    userPrompt: generateContentPrompt
  })
  let hasError = false
  const response = await generateContent(copilotQueryBuilder, (response, done, isError) => {
    if (isError) {
      console.log('Error while generating content: ', response)
      hasError = true
      return
    }

    if (done) {
      return response
    }
  })
  if (hasError) {
    throw new Error('Error generating content from Copilot')
  }
  return response
}

function splitObjectArrayByCharLimit<T>(
  arr: T[],
  maxChars = 64000,
  serialize: (item: T) => string = JSON.stringify
): T[][] {
  const result: T[][] = []
  let currentChunk: T[] = []
  let currentLength = 0

  for (const item of arr) {
    const itemString = serialize(item)
    const itemLength = itemString.length

    if (itemLength > maxChars) {
      throw new Error(`Item exceeds character limit: ${itemString.slice(0, 100)}...`)
    }

    if (currentLength + itemLength > maxChars) {
      result.push(currentChunk)
      currentChunk = [item]
      currentLength = itemLength
    } else {
      currentChunk.push(item)
      currentLength += itemLength
    }
  }

  if (currentChunk.length > 0) {
    result.push(currentChunk)
  }

  return result
}
