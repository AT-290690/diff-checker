import { match, patch, additions, removals } from './diff.js'
import {
  State,
  main,
  diffElements,
  toolbar,
  compare,
  rotate,
  reset,
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
const diffCheck = () => {
  const source = diffElements.remove.input.value.trim()
  const target = diffElements.add.input.value.trim()
  State.cache.remove = source
  State.cache.add = target
  State.diff = match(source, target)
  enterStage('Diff')
  additions(State.diff, source, diffElements.add.changes)
  removals(State.diff, source, diffElements.remove.changes)
  const newurl =
    window.location.protocol +
    '//' +
    window.location.host +
    window.location.pathname +
    `?a=${encodeURIComponent(
      LZString.compressToBase64(target)
    )}&b=${encodeURIComponent(LZString.compressToBase64(source))}`
  window.history.pushState({ path: newurl }, '', newurl)
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
  if (diffElements.remove.changes.style.display === 'grid') {
    exitChangesMode(['add', 'remove'])
  } else {
    const addElements = document.getElementsByClassName('add')
    const removeElements = document.getElementsByClassName('remove')
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
  const reader = new FileReader()
  reader.onload = (e) => (el.value = e.target.result)
  reader.readAsText(file, 'UTF-8')
}

diffElements.remove.changes.ondragover = (e) => {
  e.preventDefault()
}

diffElements.add.changes.ondragover = (e) => {
  e.preventDefault()
}

const cancelDiff = () => {
  enterStage('Prep')
  diffElements.remove.input.value = State.cache.remove
  diffElements.add.input.value = State.cache.add
  switchDisplay(reset, compare)
}

diffElements.remove.changes.ondrop = (e) => {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  cancelDiff()
  dropfile(file, diffElements.remove.input)
}

diffElements.add.changes.ondrop = (e) => {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  cancelDiff()
  dropfile(file, diffElements.add.input)
}
diffElements.remove.diff.ondrop = (e) => {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  dropfile(file, diffElements.remove.input)
}

diffElements.add.diff.ondrop = (e) => {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  dropfile(file, diffElements.add.input)
}

compare.addEventListener('click', diffCheck)
reset.addEventListener('click', cancelDiff)
changes.addEventListener('click', toggleChangesView)
rotate.addEventListener('click', () =>
  rotateLayout(State.orientation === 'vertical' ? 'horizontal' : 'vertical')
)

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && State.stage === 'Diff') {
    e.preventDefault()
    e.stopPropagation()
    cancelDiff()
  }
})
enterStage('Prep')

const A = new URLSearchParams(location.search).get('a') ?? ''
const B = new URLSearchParams(location.search).get('b') ?? ''

if (A && B) {
  try {
    diffElements.add.input.value = decodeURIComponent(
      LZString.decompressFromBase64(A)
    )
    diffElements.remove.input.value = decodeURIComponent(
      LZString.decompressFromBase64(B)
    )
  } catch (e) {
    alert(e instanceof Error ? e.message : e)
  }
}
