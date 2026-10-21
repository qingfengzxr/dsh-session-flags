import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import {
  emptyFlagsDocument,
  normalizeColorName,
  sanitizeFlagsDocument,
  type FlagColorId,
  type FlagsDocument,
} from '../shared/palette'

/**
 * Host-side persistence for the flag document.
 *
 * Why the Host owns the data: the Desktop application boots the Harness with
 * `--port 0`, so every launch serves the GUI from a different loopback origin
 * and browser `localStorage` would be per-launch. A JSON file under the DSH
 * home is stable across launches, windows, and the Web build.
 *
 * Writes are serialized, computed against the latest committed snapshot, and
 * committed to memory only after the atomic file replace succeeds — a failed
 * write therefore leaves both the file and the served snapshot untouched.
 */
export class FlagsStore {
  #state: FlagsDocument = emptyFlagsDocument()
  #loadPromise: Promise<void> | null = null
  #writeTail: Promise<void> = Promise.resolve()

  /** @param file - absolute path of the JSON document to own. */
  constructor(readonly file: string) {}

  /** Load the document once; concurrent and later callers share the result. */
  ensureLoaded(): Promise<void> {
    this.#loadPromise ??= this.#load()
    return this.#loadPromise
  }

  /** A detached copy of the committed document, safe to serialize or return. */
  snapshot(): FlagsDocument {
    return structuredClone(this.#state)
  }

  /** Assign one palette color to a session, or clear it with `null`. */
  async setFlag(sessionId: string, colorId: FlagColorId | null): Promise<FlagsDocument> {
    return this.#enqueue(async () => {
      const next = this.snapshot()
      if (colorId === null) delete next.flags[sessionId]
      else next.flags[sessionId] = colorId
      return this.#commit(next)
    })
  }

  /**
   * Merge color name overrides. `null`/blank values remove the override so the
   * localized default name applies again; unknown color ids are ignored.
   */
  async setColorNames(names: Partial<Record<FlagColorId, string | null>>): Promise<FlagsDocument> {
    return this.#enqueue(async () => {
      const next = this.snapshot()
      for (const [colorId, raw] of Object.entries(names) as [FlagColorId, string | null | undefined][]) {
        const normalized = normalizeColorName(raw)
        if (normalized === null) delete next.colorNames[colorId]
        else next.colorNames[colorId] = normalized
      }
      return this.#commit(next)
    })
  }

  async #commit(next: FlagsDocument): Promise<FlagsDocument> {
    await this.#persist(next)
    this.#state = next
    return structuredClone(next)
  }

  async #persist(next: FlagsDocument): Promise<void> {
    const directory = dirname(this.file)
    await mkdir(directory, { recursive: true })
    const temporary = `${this.file}.${process.pid}.${Date.now()}.tmp`
    await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
    await rename(temporary, this.file)
  }

  async #load(): Promise<void> {
    try {
      const raw = await readFile(this.file, 'utf8')
      this.#state = sanitizeFlagsDocument(JSON.parse(raw))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn(`dsh-session-flags: could not read ${this.file}; starting from an empty document`, error)
      }
      this.#state = emptyFlagsDocument()
    }
  }

  /** Run one mutation after every previously queued one settled. */
  #enqueue<T>(run: () => Promise<T>): Promise<T> {
    const result = this.#writeTail.then(run, run)
    this.#writeTail = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }
}
