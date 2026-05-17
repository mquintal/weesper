/**
 * Cleans the transcription text by removing non-speech markers.
 * Whisper models often return descriptive tags in brackets or parentheses
 * like [INAUDIBLE], [Multiple voices], or (laughing).
 *
 * @param text The raw transcription text from Whisper
 * @returns The cleaned text
 */
export const cleanText = (text: string): string => {
  return (
    text
      // 1. Remove anything in brackets or parentheses (descriptive markers)
      .replace(/[[(][^\])]*[\])]/g, '')
      // 2. Clean up multiple spaces left behind by removals
      .replace(/\s\s+/g, ' ')
      // 3. Remove leading/trailing whitespace
      .trim()
  )
}
