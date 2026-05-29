import { checkForUpdates, downloadUpdate, initAutoUpdater, installUpdate } from './auto-updater'
import { request as enhanceText, init as initLlamaServer, stop as stopLlamaServer } from './llama.cpp-service'
import { init as initWhisperServer, stop as stopWhisperServer, request as transcribe } from './whisper.cpp-service'

export const services = {
  llama: {
    start: () => initLlamaServer(),
    request: (text: string, prompt: string) => enhanceText(text, prompt),
    stop: () => stopLlamaServer(),
  },
  whisper: {
    start: () => initWhisperServer(),
    stop: () => stopWhisperServer(),
    request: (wav: Buffer) => transcribe(wav),
  },
  updater: {
    init: initAutoUpdater,
    check: checkForUpdates,
    download: downloadUpdate,
    install: installUpdate,
  },
}
