import { renderDiff } from './diff.js'
import { DiffEngine } from './diff-engine.js'
import {
  MAX_SHARE_BYTES,
  encodeSharedText,
  isShareable,
  readSharedDiff,
} from './share.js'
import {
  State,
  main,
  diffElements,
  toolbar,
  compare,
  rotate,
  reset,
  swap,
  changes,
  status,
} from './common.js'

const diffEngine = new DiffEngine()
let comparisonVersion = 0

const showInputs = (args) => {
  args.forEach((arg) => {
    diffElements[arg].input.style.display = 'block'
    diffElements[arg].changes.style.display = 'none'
  })
}

const hideInputs = (args) => {
  args.forEach((arg) => {
    diffElements[arg].input.style.display = 'none'
    diffElements[arg].changes.style.display = 'block'
  })
}

const cleanUpChanges = (args) => {
  args.forEach((arg) => {
    diffElements[arg].changes.innerHTML = ''
  })
}

const enterStage = (stage) => {
  State.changesOnly = false
  switch (stage) {
    case 'Diff':
      State.stage = stage
      cleanUpChanges(['add', 'remove'])
      hideInputs(['add', 'remove'])
      diffElements.add.diff.style.borderColor = 'var(--color-add)'
      diffElements.remove.diff.style.borderColor = 'var(--color-remove)'
      break
    case 'Prep':
      State.stage = stage
      diffElements.add.diff.style.borderColor = 'var(--color-stay)'
      diffElements.remove.diff.style.borderColor = 'var(--color-stay)'
      showInputs(['add', 'remove'])
      cleanUpChanges(['add', 'remove'])
      break

    default:
      break
  }
}
const switchDisplay = (elementA, elementB) => {
  elementA.style.display = 'none'
  elementB.style.display = 'block'
}

const formatSize = (bytes) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`

const setBusy = (busy) => {
  for (const control of [compare, changes, rotate, swap, reset]) {
    control.disabled = busy
  }
  diffElements.add.input.readOnly = busy
  diffElements.remove.input.readOnly = busy
}

const clearSharedUrl = () => {
  const url = new URL(window.location.href)
  url.searchParams.delete('a')
  url.searchParams.delete('b')
  window.history.replaceState(null, '', url)
}

const updateSharedUrl = (source, target) => {
  if (!isShareable(source, target)) {
    clearSharedUrl()
    return false
  }

  const url = new URL(window.location.href)
  url.searchParams.set('a', encodeSharedText(target))
  url.searchParams.set('b', encodeSharedText(source))
  window.history.pushState(null, '', url)
  return true
}

const nextFrame = () =>
  new Promise((resolve) =>
    window.requestAnimationFrame
      ? window.requestAnimationFrame(resolve)
      : setTimeout(resolve, 0)
  )

const diffCheck = async ({ updateHistory = true } = {}) => {
  const source = diffElements.remove.input.value
  const target = diffElements.add.input.value
  const version = ++comparisonVersion
  const localOnly = !isShareable(source, target)

  setBusy(true)
  status.textContent = `Comparing ${formatSize(new Blob([source, target]).size)}…`

  try {
    const { diff, metrics } = await diffEngine.compute(source, target)
    if (version !== comparisonVersion) return false

    State.cache.remove = source
    State.cache.add = target
    State.diff = diff
    enterStage('Diff')
    await nextFrame()
    renderDiff(
      diff,
      diffElements.add.changes,
      diffElements.remove.changes,
      metrics
    )
    State.diff = []

    const shared = updateHistory ? updateSharedUrl(source, target) : !localOnly
    status.textContent = shared
      ? 'Comparison complete · shareable link ready'
      : `Comparison complete · local only above ${formatSize(MAX_SHARE_BYTES)}`
    switchDisplay(compare, reset)
    return true
  } catch (error) {
    if (error?.name === 'AbortError') return false
    status.textContent = 'Comparison failed'
    alert(error instanceof Error ? error.message : error)
    return false
  } finally {
    if (version === comparisonVersion) setBusy(false)
  }
}

const enterChangesMode = (args) => {
  args.forEach((arg) => {
    diffElements[arg].changes.classList.add('changes-only')
    diffElements[arg].changes.style.display = 'grid'
  })
}

const exitChangesMode = (args) => {
  args.forEach((arg) => {
    diffElements[arg].changes.classList.remove('changes-only')
    diffElements[arg].changes.style.display = 'block'
  })
}

const toggleChangesView = async () => {
  if (State.stage !== 'Diff' && !(await diffCheck())) return
  if (State.changesOnly) {
    exitChangesMode(['add', 'remove'])
    State.changesOnly = false
  } else {
    const onlyFor = []
    if (document.getElementsByClassName('add').length) {
      onlyFor.push('add')
    }
    if (document.getElementsByClassName('remove').length) {
      onlyFor.push('remove')
    }

    hideInputs(onlyFor)
    enterChangesMode(onlyFor)
    State.changesOnly = true
  }
}

for (const side of ['add', 'remove']) {
  diffElements[side].changes.addEventListener('click', (event) => {
    const change = event.target.closest?.(`.${side}`)
    if (!State.changesOnly || !change) return

    exitChangesMode([side])
    change.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    })
  })
}

const rotateLayout = (type) => {
  if (type === 'horizontal') {
    State.orientation = 'horizontal'
    main.style = 'flex-direction: column'
    diffElements.add.diff.style = 'height: 43vh; width: auto'
    diffElements.remove.diff.style = 'height: 43vh; width: auto'
    toolbar.style = 'flex-direction: row; margin: 10px'
    diffElements.remove.input.style = 'height: 43vh'
    diffElements.add.input.style = 'height: 43vh'
  } else if (type === 'vertical') {
    State.orientation = 'vertical'
    main.style = null
    diffElements.add.diff.style = null
    diffElements.remove.diff.style = null
    diffElements.remove.input.style = null
    diffElements.add.input.style = null
    toolbar.style = null
  }

  diffElements.add.diff.style.borderColor = 'var(--color-stay)'
  diffElements.remove.diff.style.borderColor = 'var(--color-stay)'
  if (State.stage === 'Diff') cancelDiff()
}

const dropfile = (file, el) => {
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => (el.value = e.target.result)
  reader.readAsText(file, 'UTF-8')
}

for (const side of ['add', 'remove']) {
  diffElements[side].diff.ondragover = (event) => event.preventDefault()
}

const cancelDiff = () => {
  enterStage('Prep')
  diffElements.remove.input.value = State.cache.remove
  diffElements.add.input.value = State.cache.add
  switchDisplay(reset, compare)
}

for (const side of ['add', 'remove']) {
  diffElements[side].diff.ondrop = (event) => {
    event.preventDefault()
    if (compare.disabled) return
    if (State.stage === 'Diff') cancelDiff()
    dropfile(event.dataTransfer?.files?.[0], diffElements[side].input)
  }
}

compare.addEventListener('click', diffCheck)
reset.addEventListener('click', cancelDiff)
changes.addEventListener('click', toggleChangesView)
rotate.addEventListener('click', () =>
  rotateLayout(State.orientation === 'vertical' ? 'horizontal' : 'vertical')
)
swap.addEventListener('click', async () => {
  const value = diffElements.add.input.value
  diffElements.add.input.value = diffElements.remove.input.value
  diffElements.remove.input.value = value
  if (State.stage === 'Diff') await diffCheck()
})
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && State.stage === 'Diff') {
    e.preventDefault()
    e.stopPropagation()
    cancelDiff()
  }
})
enterStage('Prep')

const loadSharedDiff = async () => {
  try {
    const shared = readSharedDiff(location.search)
    if (!shared) return false
    diffElements.add.input.value = shared.add
    diffElements.remove.input.value = shared.remove
    return await diffCheck({ updateHistory: false })
  } catch (e) {
    alert(e instanceof Error ? e.message : e)
    return false
  }
}

loadSharedDiff()

window.addEventListener('popstate', async () => {
  if (!(await loadSharedDiff())) {
    diffElements.add.input.value = ''
    diffElements.remove.input.value = ''
    State.cache.add = ''
    State.cache.remove = ''
    status.textContent = ''
    enterStage('Prep')
    switchDisplay(reset, compare)
  }
})

if ('serviceWorker' in navigator) {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
  )
}
