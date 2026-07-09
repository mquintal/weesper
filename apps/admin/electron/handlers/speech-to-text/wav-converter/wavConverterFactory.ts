import path from 'node:path'
import { RESOURCES_PATH } from '../../../config'
import { WavConverter } from './WavConverter'

const ffmpegPath = path.join(RESOURCES_PATH, 'ffmpeg/ffmpeg')

export const createWavConverter = () =>
  new WavConverter(ffmpegPath, ['-f', 'matroska', '-i', 'pipe:0', '-f', 'wav', '-ar', '16000', '-ac', '1', 'pipe:1'])
