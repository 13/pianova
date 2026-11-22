import { preloadHighway3D } from '../render/highway'

/**
 * Lets a screen stop redrawing its highway while nothing on it moves (a paused song, a
 * lesson page waiting for a key, a jam with the band stopped). Drawing a still picture
 * sixty times a second costs as much as drawing a moving one.
 *
 * The gate stays awake for a while after anything that changes the picture: a key going
 * down or up, the stage changing size (a resized WebGL canvas is blank until drawn), the
 * 3D renderer arriving, or a screen's own `wake()`. That while covers the flashes, sparks
 * and glides that follow, which all settle within a couple of seconds.
 */
export class IdleGate {
  private until = 0
  private heldKey = ''
  private observer: ResizeObserver
  private dead = false

  constructor(
    stage: Element,
    private holdMs = 2500,
  ) {
    this.wake()
    this.observer = new ResizeObserver(() => this.wake())
    this.observer.observe(stage)
    // The 3D renderer may land after the screen opened: it needs frames to show itself.
    void preloadHighway3D().then(() => {
      if (!this.dead) this.wake()
    })
  }

  wake(now = performance.now()): void {
    this.until = Math.max(this.until, now + this.holdMs)
  }

  /** Whether to draw this frame; `held` (the keys down now) wakes the gate when it changes. */
  awake(held: Iterable<number>, now = performance.now()): boolean {
    let key = ''
    for (const p of held) key += `${p},`
    if (key !== this.heldKey) {
      this.heldKey = key
      this.wake(now)
    }
    return now < this.until
  }

  destroy(): void {
    this.dead = true
    this.observer.disconnect()
  }
}
