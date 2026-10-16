import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const context = vm.createContext({})
vm.runInContext(await readFile('diff_match_patch.js', 'utf8'), context)
globalThis.diff_match_patch = context.diff_match_patch

class FakeFragment {
  children = []

  append(child) {
    this.children.push(child)
  }
}

class FakeElement {
  className = ''
  textContent = ''
  children = []

  replaceChildren(fragment) {
    this.children = fragment.children
  }
}

globalThis.document = {
  createDocumentFragment: () => new FakeFragment(),
  createElement: () => new FakeElement(),
}

const { additions, match, removals } = await import('../diff.js')

test('matching detects leading and trailing whitespace changes', () => {
  assert.notDeepEqual(match('value', ' value '), [[0, 'value']])
})

test('rendering preserves text literally instead of interpreting HTML', () => {
  const output = new FakeElement()
  additions([[1, '<img src=x onerror=alert(1)>']], '', output)

  assert.equal(output.children.length, 1)
  assert.equal(output.children[0].className, 'add')
  assert.equal(output.children[0].textContent, '<img src=x onerror=alert(1)>')
})

test('addition and removal views contain the correct sides of a diff', () => {
  const changes = [[0, 'same'], [-1, ' old'], [1, ' new']]
  const added = new FakeElement()
  const removed = new FakeElement()

  additions(changes, '', added)
  removals(changes, '', removed)

  assert.deepEqual(
    added.children.map(({ className, textContent }) => [className, textContent]),
    [['stay-add', 'same'], ['add', ' new']]
  )
  assert.deepEqual(
    removed.children.map(({ className, textContent }) => [className, textContent]),
    [['stay-remove', 'same'], ['remove', ' old']]
  )
})
