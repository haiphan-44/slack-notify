import * as https from 'https'

import { generateAskRequest, parseResponse } from '~/service/copilot/utils'

export const generateContent = async (
  copilotQueryBuilder: any,
  callback: (response: string, done: boolean, isError: boolean) => void
): Promise<string> => {
  const request = await generateAskRequest(copilotQueryBuilder.history)
  const body = JSON.stringify(request)
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
  }

  return new Promise<string>((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log('📡 generateContent - Status:', res.statusCode)
      console.log('📡 generateContent - Headers:', res.headers)

      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        console.log('📡 generateContent - Response received, length:', data.length)
        if (res.statusCode && res.statusCode >= 400) {
          console.error('❌ generateContent - HTTP Error:', res.statusCode, data.substring(0, 500))
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`))
          return
        }
        resolve(parseResponse(data, callback))
      })
    })

    req.on('error', (error) => {
      console.log('🚀 --> error:', error)
      reject(error)
    })

    req.write(body)
    req.end()
  })
}
