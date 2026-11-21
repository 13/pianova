import { afterEach, describe, expect, it } from 'vitest'
import { noteName, pct, resolveLang, setLang, t, tr } from '../src/i18n'
import { KEYBOARDS } from '../src/input/instruments'
import { pianoKeys } from '../src/ui/nav'

describe('i18n', () => {
  afterEach(() => setLang('en'))
  it('follows the browser unless a language is chosen', () => {
    expect(resolveLang('auto', 'de-AT')).toBe('de')
    expect(resolveLang('auto', 'en-GB')).toBe('en')
    expect(resolveLang('auto', 'fr')).toBe('en')
    expect(resolveLang('en', 'de-DE')).toBe('en')
    expect(resolveLang('de', 'en-US')).toBe('de')
  })
  it('picks the current language', () => {
    expect(t('Lessons', 'Lektionen')).toBe('Lessons')
    setLang('de')
    expect(t('Lessons', 'Lektionen')).toBe('Lektionen')
    expect(tr({ en: 'Scales', de: 'Tonleitern' })).toBe('Tonleitern')
    expect(tr('Jingle Bells')).toBe('Jingle Bells')
    expect(pct(0.85)).toBe('85 %')
  })
  it('names notes the German way: H for B, Fis for F sharp', () => {
    expect(noteName(59)).toBe('B3')
    setLang('de')
    expect(noteName(59)).toBe('H3')
    expect(noteName(66)).toBe('Fis4')
    expect(noteName(58)).toBe('B3')
  })
})

describe('piano navigation keys', () => {
  it('uses the four lowest white keys of the instrument', () => {
    const np32 = KEYBOARDS.find((k) => k.id === 'np32')!
    expect(pianoKeys(np32)).toEqual({ back: 28, prev: 29, choose: 31, next: 33 })
    const full = KEYBOARDS.find((k) => k.hi - k.lo + 1 === 88)!
    expect(pianoKeys(full)).toEqual({ back: 21, prev: 23, choose: 24, next: 26 })
  })
})
