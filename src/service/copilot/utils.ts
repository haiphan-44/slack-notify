import * as core from '@actions/core'
import * as crypto from 'crypto'
import * as https from 'https'

import { SYSTEM_PROMPT } from '~/service/copilot/constant'
import {
  CopilotQueryBuilder,
  CopilotRequest,
  ErrorResponse,
  HistoryMessage,
  Message,
  TokenResponse
} from '~/service/copilot/type'

const uuid = (): string => {
  return crypto.randomUUID()
}

const machineID = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

const sessionID = (): string => {
  return uuid() + Date.now().toString()
}

const jsonParse = (s: string): any => {
  try {
    return JSON.parse(s)
  } catch (error) {
    core.warning(`Error parsing JSON: ${error}`)
    return null
  }
}

const removeUntilData = (s: string): string => {
  const index = s.indexOf('data:')
  return index === -1 ? s : s.substring(index + 'data: '.length)
}

const getToken = (): Promise<string> => {
  console.log('copilot token: ', process.env.COPILOT_TOKEN)
  return new Promise<string>((resolve, reject) => {
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
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        const tokenResponse: TokenResponse = JSON.parse(data)
        resolve(tokenResponse.token)
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.end()
  })
}

export const generateAskRequest = (history: HistoryMessage[]): Promise<any> => {
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
  })
}

export const parseResponse = (
  data: string,
  callback: (response: string, done: boolean, isError: boolean) => void
): string => {
  console.log('📥 parseResponse - raw data length:', data.length)
  console.log('📥 parseResponse - raw data preview:', data.substring(0, 500))

  const lines = data.split('\n')
  let isError = false
  let reply = ''

  for (const line of lines) {
    const s = line.trim()

    if (!s) {
      continue
    }

    if (s.startsWith('{"error":')) {
      const error: ErrorResponse = JSON.parse(s)
      reply = error.error.message
      isError = true
      console.log('❌ parseResponse - Error detected:', reply)
      break
    }

    if (s.includes('[DONE]')) {
      console.log('✅ parseResponse - [DONE] marker found')
      break
    }

    if (!s.startsWith('data:')) {
      continue
    }

    const jsonExtract = removeUntilData(s)
    const message: Message | null = jsonParse(jsonExtract)

    if (!message) {
      console.warn('⚠️ parseResponse - Failed to parse JSON:', jsonExtract.substring(0, 200))
      continue
    }

    if (!message.choices || message.choices.length === 0) {
      console.warn('⚠️ parseResponse - No choices in message')
      continue
    }

    const delta = message.choices[0]?.delta
    if (delta && delta.content) {
      const txt = delta.content as string
      reply += txt
      callback(reply, false, isError)
    }
  }

  console.log('📤 parseResponse - Final reply length:', reply.length)
  console.log('📤 parseResponse - Final reply:', reply.substring(0, 200))
  callback(reply, true, isError)
  return reply
}

export const generateCopilotRequest = async (): Promise<CopilotRequest> => {
  const token = await getToken()
  return {
    token,
    sessionId: sessionID(),
    uuid: uuid(),
    machineId: machineID()
  }
}

export const getCopilotQueryBuilder = async ({ userPrompt }: { userPrompt: string }): Promise<CopilotQueryBuilder> => {
  const copilotRequest = await generateCopilotRequest()
  return {
    copilotRequest,
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
}
