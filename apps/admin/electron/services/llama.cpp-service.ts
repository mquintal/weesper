import fs from 'node:fs'
import path from 'node:path'
import { getSelectedLlm } from '@open-bisbis/config'
import * as v from 'valibot'
import { llms, RESOURCES_PATH } from '../config'
import { getOptimalThreadCount } from './cpu'
import { createManagedService } from './server'

const LLAMA_SERVER_PORT = Number(process.env.LLAMA_SERVER_PORT || 8765)
const llamaServerPath = path.join(RESOURCES_PATH, 'llama.cpp/llama-server')

interface LlamaRequest {
  text: string
  prompt: string
}

const service = createManagedService<LlamaRequest, string>({
  name: 'llama',
  executable: llamaServerPath,
  port: LLAMA_SERVER_PORT,
  healthCheckTimeout: 15000,
  resolveModel: () => {
    const selectedLlm = getSelectedLlm()
    const llm = llms.find((l) => l.id === selectedLlm)
    if (llm && fs.existsSync(llm.path)) {
      return {
        path: llm.path,
        args: ['-m', llm.path, '--host', '127.0.0.1', '-t', String(getOptimalThreadCount()), '--no-ui', '--offline'],
      }
    }
    return null
  },
  execute: async (port, { text, prompt }) => {
    const response = await fetch(`http://127.0.0.1:${port}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `
            YOUR TASKS:
             - take the text between <input> and </input> as the input text;
             - take the text between <prompt> and </prompt> as the prompt;
             - rewrite the input text based on the prompt provided;
             - return just the rewrote text and nothing else.
            `,
          },
          {
            role: 'user',
            content: `<prompt>${prompt}</prompt>\n<input>${text}</input>`,
          },
        ],
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`llama-server error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const validbot = v.safeParse(LlamaResponseSchema, data)
    if (!validbot.success) {
      throw new Error('llama-server returned an empty or malformed response')
    }
    const enhanced = validbot.output.choices[0].message.content.trim()

    if (!enhanced) {
      throw new Error('llama-server returned an empty or malformed response')
    }

    return enhanced
  },
})

export const init = service.init
export const stop = service.stop
export const request = (text: string, prompt: string) => service.request({ text, prompt })

const LlamaResponseSchema = v.object({
  choices: v.pipe(
    v.array(
      v.object({
        message: v.object({
          content: v.string(),
        }),
      }),
    ),
    v.minLength(1),
  ),
})
