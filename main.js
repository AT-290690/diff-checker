import { match, additions, removals } from './diff.js'
import { encodeSharedText, readSharedDiff } from './share.js'
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
} from './common.js'

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
const updateSharedUrl = (source, target) => {
  const url = new URL(window.location.href)
  url.searchParams.set('a', encodeSharedText(target))
  url.searchParams.set('b', encodeSharedText(source))
  window.history.pushState(null, '', url)
}

const diffCheck = ({ updateHistory = true } = {}) => {
  const source = diffElements.remove.input.value
  const target = diffElements.add.input.value
  State.cache.remove = source
  State.cache.add = target
  State.diff = match(source, target)
  enterStage('Diff')
  additions(State.diff, source, diffElements.add.changes)
  removals(State.diff, source, diffElements.remove.changes)
  if (updateHistory) updateSharedUrl(source, target)
  switchDisplay(compare, reset)
}

const enterChangesMode = (args) => {
  args.forEach((arg) => {
    for (const el of document.getElementsByClassName(`stay-${arg}`)) {
      el.style.display = 'none'
    }
    diffElements[arg].changes.style.display = 'grid'
  })
}

const exitChangesMode = (args) => {
  args.forEach((arg) => {
    for (const el of document.getElementsByClassName(`stay-${arg}`)) {
      el.style.display = null
    }
    diffElements[arg].changes.style.display = 'block'
  })
}

const toggleChangesView = () => {
  if (State.stage !== 'Diff') diffCheck()
  if (State.changesOnly) {
    exitChangesMode(['add', 'remove'])
    State.changesOnly = false
  } else {
    const addElements = Array.from(document.getElementsByClassName('add'))
    const removeElements = Array.from(document.getElementsByClassName('remove'))
    const onlyFor = []
    if (addElements.length) {
      onlyFor.push('add')
      for (const el of addElements) {
        const onClick = (e) => {
          exitChangesMode(['add'])
          e.target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
          })
        }
        const clone = el.cloneNode(true)
        el.replaceWith(clone)
        clone.addEventListener('click', onClick, true)
      }
    }
    if (removeElements.length) {
      onlyFor.push('remove')
      for (const el of removeElements) {
        const onClick = (e) => {
          exitChangesMode(['remove'])
          e.target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
          })
        }
        const clone = el.cloneNode(true)
        el.replaceWith(clone)
        clone.addEventListener('click', onClick, true)
      }
    }

    hideInputs(onlyFor)
    enterChangesMode(onlyFor)
    State.changesOnly = true
  }
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
    if (State.stage === 'Diff') cancelDiff()
    dropfile(event.dataTransfer?.files[0], diffElements[side].input)
  }
}

compare.addEventListener('click', diffCheck)
reset.addEventListener('click', cancelDiff)
changes.addEventListener('click', toggleChangesView)
rotate.addEventListener('click', () =>
  rotateLayout(State.orientation === 'vertical' ? 'horizontal' : 'vertical')
)
swap.addEventListener('click', () => {
  const value = diffElements.add.input.value
  diffElements.add.input.value = diffElements.remove.input.value
  diffElements.remove.input.value = value
  if (State.stage === 'Diff') diffCheck()
})
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && State.stage === 'Diff') {
    e.preventDefault()
    e.stopPropagation()
    cancelDiff()
  }
})
enterStage('Prep')

const loadSharedDiff = () => {
  try {
    const shared = readSharedDiff(location.search)
    if (!shared) return false
    diffElements.add.input.value = shared.add
    diffElements.remove.input.value = shared.remove
    diffCheck({ updateHistory: false })
    return true
  } catch (e) {
    alert(e instanceof Error ? e.message : e)
    return false
  }
}

loadSharedDiff()

window.addEventListener('popstate', () => {
  if (!loadSharedDiff()) {
    diffElements.add.input.value = ''
    diffElements.remove.input.value = ''
    State.cache.add = ''
    State.cache.remove = ''
    enterStage('Prep')
    switchDisplay(reset, compare)
  }
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'))
}
