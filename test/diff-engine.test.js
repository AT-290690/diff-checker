import assert from 'node:assert/strict'
import test from 'node:test'

import { DiffEngine } from '../diff-engine.js'

class ControlledWorker {
  listeners = new Map()
  terminated = false

  addEventListener(type, listener) {
    this.listeners.set(type, listener)
  }

  postMessage(data) {
    this.data = data
  }

  terminate() {
    this.terminated = true
  }

  respond(data) {
    this.listeners.get('message')({ data })
  }
}

test('the diff engine returns worker results and terminates the worker', async () => {
  const worker = new ControlledWorker()
  const engine = new DiffEngine(() => worker)
  const result = engine.compute('old', 'new')

  assert.deepEqual(worker.data, { source: 'old', target: 'new' })
  worker.respond({
    diff: [[-1, 'old'], [1, 'new']],
    metrics: { editDistance: 3, elapsedMs: 1 },
  })

  assert.deepEqual(await result, {
    diff: [[-1, 'old'], [1, 'new']],
    metrics: { editDistance: 3, elapsedMs: 1 },
  })
  assert.equal(worker.terminated, true)
})

test('starting a new comparison cancels the previous worker', async () => {
  const workers = []
  const engine = new DiffEngine(() => {
    const worker = new ControlledWorker()
    workers.push(worker)
    return worker
  })
  const first = engine.compute('first', 'target')
  const second = engine.compute('second', 'target')

  await assert.rejects(first, { name: 'AbortError' })
  assert.equal(workers[0].terminated, true)

  workers[1].respond({ diff: [[0, 'done']], metrics: {} })
  assert.deepEqual(await second, { diff: [[0, 'done']], metrics: {} })
})
