import { describe, expect, it } from 'vitest'
import { cleanText } from './clean-text'

describe('cleanText', () => {
  it('removes bracketed markers', () => {
    expect(cleanText('Hello [INAUDIBLE] world')).toBe('Hello world')
    expect(cleanText('Hello [Multiple voices speaking] world')).toBe('Hello world')
  })

  it('removes parenthetical markers', () => {
    expect(cleanText('Hello (laughing) world')).toBe('Hello world')
    expect(cleanText('Hello (sighs) world')).toBe('Hello world')
  })

  it('handles multiple markers', () => {
    expect(cleanText('Hello [INAUDIBLE] world (laughing)')).toBe('Hello world')
  })

  it('collapses multiple spaces', () => {
    expect(cleanText('Hello    world')).toBe('Hello world')
  })

  it('trims whitespace', () => {
    expect(cleanText('   Hello world   ')).toBe('Hello world')
  })

  it('returns empty string for marker-only input', () => {
    expect(cleanText('[BLANK_AUDIO]')).toBe('')
    expect(cleanText('(noise)')).toBe('')
  })

  it('leaves normal text untouched', () => {
    expect(cleanText('This is a normal sentence.')).toBe('This is a normal sentence.')
  })

  it('handles complex bracket content', () => {
    expect(cleanText('Hello [Music - "Example Song"] world')).toBe('Hello world')
  })
})
