import { describe, expect, it } from 'vitest'
import { qualityLadder } from '../src/render/highway3d'

describe('qualityLadder', () => {
  it('steps a high-density screen down to 1, then trades bloom and resolution', () => {
    expect(qualityLadder(2)).toEqual([
      { dpr: 2, bloom: 1 },
      { dpr: 1.75, bloom: 1 },
      { dpr: 1.5, bloom: 1 },
      { dpr: 1.25, bloom: 1 },
      { dpr: 1, bloom: 1 },
      { dpr: 1, bloom: 0.5 },
      { dpr: 0.8, bloom: 0.5 },
      { dpr: 0.8, bloom: 0 },
      { dpr: 0.6, bloom: 0 },
    ])
  })

  it('lets a 1x screen go below one pixel per CSS pixel', () => {
    const ladder = qualityLadder(1)
    expect(ladder[0]).toEqual({ dpr: 1, bloom: 1 })
    expect(ladder.at(-1)).toEqual({ dpr: 0.6, bloom: 0 })
    // Cheaper at every step: never more pixels or more bloom than the step before.
    for (let i = 1; i < ladder.length; i++) {
      expect(ladder[i].dpr).toBeLessThanOrEqual(ladder[i - 1].dpr)
      expect(ladder[i].bloom).toBeLessThanOrEqual(ladder[i - 1].bloom)
    }
  })
})
