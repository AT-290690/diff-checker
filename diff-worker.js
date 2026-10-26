importScripts('./diff_match_patch.js')

const dmp = new diff_match_patch()
dmp.Diff_Timeout = 3

self.addEventListener('message', ({ data }) => {
  try {
    const startedAt = performance.now()
    const diff = dmp.diff_main(data.source, data.target, true)
    const elapsedMs = performance.now() - startedAt
    self.postMessage({
      diff,
      metrics: {
        editDistance: dmp.diff_levenshtein(diff),
        elapsedMs,
        timedOut: elapsedMs >= dmp.Diff_Timeout * 1000 - 50,
      },
    })
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) })
  }
})
