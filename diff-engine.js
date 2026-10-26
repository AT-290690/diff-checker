export class DiffEngine {
  constructor(
    workerFactory = () => new Worker(new URL('./diff-worker.js', import.meta.url))
  ) {
    this.workerFactory = workerFactory
    this.worker = null
    this.rejectPending = null
  }

  compute(source, target) {
    this.cancel()

    return new Promise((resolve, reject) => {
      const worker = this.workerFactory()
      this.worker = worker
      this.rejectPending = reject

      worker.addEventListener('message', ({ data }) => {
        if (worker !== this.worker) return
        this.finish()
        if (data.error) reject(new Error(data.error))
        else resolve(data.diff)
      })

      worker.addEventListener('error', (event) => {
        if (worker !== this.worker) return
        this.finish()
        reject(new Error(event.message || 'The diff worker failed'))
      })

      worker.postMessage({ source, target })
    })
  }

  finish() {
    this.worker?.terminate()
    this.worker = null
    this.rejectPending = null
  }

  cancel() {
    if (!this.worker) return
    const reject = this.rejectPending
    this.finish()
    reject?.(new DOMException('Comparison superseded', 'AbortError'))
  }
}
