import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'

export const __dirname = import.meta?.dirname || path.resolve()

// Use app.getAppPath() to get the root of the application
// In dev, it's the project root. In prod, it's the app.asar root.
export const APP_ROOT = app.getAppPath()

export const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'resources')
  : path.join(APP_ROOT, 'resources')

export const getResourcePath = (filename: string, type: 'models' | 'llms' | 'db') => {
  if (!app.isPackaged) {
    return path.join(RESOURCES_PATH, type, filename)
  }

  const userDataPath = path.join(app.getPath('userData'), type, filename)
  if (fs.existsSync(userDataPath)) {
    return userDataPath
  }

  const bundledPath = path.join(RESOURCES_PATH, type, filename)
  if (fs.existsSync(bundledPath)) {
    return bundledPath
  }

  return userDataPath
}

export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
export const RENDERER_DIST = path.join(APP_ROOT, 'dist')
export const MAIN_DIST = path.join(APP_ROOT, 'dist-electron')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(APP_ROOT, 'public') : RENDERER_DIST

export const models = [
  {
    id: 'whisper-ggml-large-v3-turbo-q5_0',
    type: 'whisper',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q5_0.bin',
    name: 'Whisper Turbo',
    size: 574041195,
    accuracy: 9,
    speed: 8,
    path: getResourcePath('whisper-large-v3-turbo.bin', 'models'),
    hash: '394221709cd5ad1f40c46e6031ca61bce88931e6e088c188294c6d5a55ffa7e2',
  },
  {
    id: 'whisper-ggml-large-v2-q5_0',
    type: 'whisper',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v2-q5_0.bin',
    name: 'Whisper Large',
    size: 1080732091,
    accuracy: 10,
    speed: 3,
    path: getResourcePath('whisper-large-v2.bin', 'models'),
    hash: '3a214837221e4530dbc1fe8d734f302af393eb30bd0ed046042ebf4baf70f6f2',
  },
  {
    id: 'whisper-ggml-medium.en-q5_0',
    type: 'whisper',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en-q5_0.bin',
    name: 'Whisper Medium',
    size: 539225533,
    accuracy: 8,
    speed: 6,
    path: getResourcePath('whisper-medium.bin', 'models'),
    hash: '76733e26ad8fe1c7a5bf7531a9d41917b2adc0f20f2e4f5531688a8c6cd88eb0',
  },
  {
    id: 'whisper-ggml-small-q8_0',
    type: 'whisper',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small-q8_0.bin',
    name: 'Whisper Small',
    size: 264464607,
    accuracy: 6,
    speed: 9,
    path: getResourcePath('whisper-small.bin', 'models'),
    hash: '49c8fb02b65e6049d5fa6c04f81f53b867b5ec9540406812c643f177317f779f',
  },
  {
    id: 'whisper-ggml-tiny',
    type: 'whisper',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
    name: 'Whisper Tiny',
    size: 77691713,
    accuracy: 3,
    speed: 10,
    path: getResourcePath('whisper-tiny.bin', 'models'),
    hash: 'be07e048e1e599ad46341c8d2a135645097a538221678b7acdd1b1919c6e1b21',
  },
]

export const llms = [
  {
    id: 'gemma-2-2b-it.q8_0',
    type: 'llm',
    url: 'https://huggingface.co/unsloth/gemma-2-it-GGUF/resolve/main/gemma-2-2b-it.q8_0.gguf',
    name: 'Gemma 2',
    size: 2784495168,
    accuracy: 3,
    speed: 10,
    path: getResourcePath('gemma-2-2b-it.q8_0.gguf', 'llms'),
    hash: 'd844a72d6956f5c2444ad9808ec0b813ef558650b9613eac7ed177e3fb929dca',
  },
]
