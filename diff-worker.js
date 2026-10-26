importScripts('./diff_match_patch.js')

const dmp = new diff_match_patch()
dmp.Diff_Timeout = 3

self.addEventListener('message', ({ data }) => {
  try {
    const diff = dmp.diff_main(data.source, data.target, true)
    self.postMessage({ diff })
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) })
  }
})
