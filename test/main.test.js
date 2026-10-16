import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const vendorContext = vm.createContext({})
vm.runInContext(await readFile('diff_match_patch.js', 'utf8'), vendorContext)
vm.runInContext(await readFile('lz-string.min.js', 'utf8'), vendorContext)
globalThis.diff_match_patch = vendorContext.diff_match_patch
globalThis.LZString = vendorContext.LZString

class FakeFragment {
  children = []

  append(child) {
    this.children.push(child)
  }
}

class FakeElement {
  constructor(id = '') {
    this.id = id
    this.value = ''
    this.style = {}
    this.children = []
    this.listeners = new Map()
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener)
  }

  click() {
    this.listeners.get('click')?.({ target: this })
  }

  cloneNode() {
    const clone = new FakeElement()
    clone.className = this.className
    clone.textContent = this.textContent
    clone.parent = this.parent
    return clone
  }

  replaceChildren(fragment) {
    this.children = fragment.children
    for (const child of this.children) child.parent = this
  }

  replaceWith(replacement) {
    const index = this.parent.children.indexOf(this)
    this.parent.children[index] = replacement
    replacement.parent = this.parent
  }

  scrollIntoView() {}
}

const ids = [
  'main',
  'Add',
  'Remove',
  'addChanges',
  'removeChanges',
  'inputAdd',
  'inputRemove',
  'toolbar',
  'compare',
  'changes',
  'reset',
  'rotate',
  'swap',
]
const elements = Object.fromEntries(ids.map((id) => [id, new FakeElement(id)]))

globalThis.document = {
  getElementById: (id) => elements[id],
  createDocumentFragment: () => new FakeFragment(),
  createElement: () => new FakeElement(),
  getElementsByClassName: (className) =>
    Object.values(elements).flatMap((element) =>
      element.children.filter((child) => child.className === className)
    ),
  addEventListener() {},
}

const browserListeners = new Map()
const browserLocation = { href: 'http://example.test/index.html', search: '' }
globalThis.window = {
  location: browserLocation,
  history: {
    pushState(_state, _unused, url) {
      browserLocation.href = url.href
      browserLocation.search = url.search
    },
  },
  addEventListener(type, listener) {
    browserListeners.set(type, listener)
  },
}
globalThis.location = browserLocation
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: {},
})
globalThis.alert = () => {}

await import('../main.js')
const { State } = await import('../common.js')

test('comparison preserves whitespace and creates a restorable URL', () => {
  elements.inputRemove.value = 'value'
  elements.inputAdd.value = ' value '
  elements.compare.click()

  assert.equal(State.cache.remove, 'value')
  assert.equal(State.cache.add, ' value ')
  assert.equal(State.stage, 'Diff')
  assert.match(browserLocation.search, /^\?a=.+&b=.+$/)
  assert.ok(elements.addChanges.children.some((child) => child.className === 'add'))
})

test('swapping an active comparison recomputes both rendered sides', () => {
  elements.swap.click()

  assert.equal(State.cache.remove, ' value ')
  assert.equal(State.cache.add, 'value')
  assert.ok(elements.removeChanges.children.some((child) => child.className === 'remove'))
})

test('changes-only mode can be entered and exited with one-sided changes', () => {
  elements.inputRemove.value = 'same'
  elements.inputAdd.value = 'same plus'
  elements.compare.click()

  elements.changes.click()
  assert.equal(State.changesOnly, true)
  elements.changes.click()
  assert.equal(State.changesOnly, false)
})
