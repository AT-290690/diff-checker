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
  dataset = {}

  append(...children) {
    this.children.push(...children)
  }

  replaceChildren(fragment) {
    this.children = fragment.children
  }
}

globalThis.document = {
  createDocumentFragment: () => new FakeFragment(),
  createElement: () => new FakeElement(),
}

const { additions, describeDiff, match, removals } = await import('../diff.js')

test('matching detects leading and trailing whitespace changes', () => {
  assert.notDeepEqual(match('value', ' value '), [[0, 'value']])
})

test('rendering preserves text literally instead of interpreting HTML', () => {
  const output = new FakeElement()
  additions([[1, '<img src=x onerror=alert(1)>']], '', output)

  assert.equal(output.children.length, 2)
  assert.equal(output.children[1].className, 'add')
  assert.equal(output.children[1].children[1].textContent, '<img src=x onerror=alert(1)>')
})

test('addition and removal views contain the correct sides of a diff', () => {
  const changes = [[0, 'same'], [-1, ' old'], [1, ' new']]
  const added = new FakeElement()
  const removed = new FakeElement()

  additions(changes, '', added)
  removals(changes, '', removed)

  assert.deepEqual(
    added.children.slice(1).map(({ className }) => className),
    ['stay-add', 'add']
  )
  assert.deepEqual(
    removed.children.slice(1).map(({ className }) => className),
    ['stay-remove', 'remove']
  )
})

test('diff descriptions expose source and target positions for every step', () => {
  const operations = describeDiff([
    [0, 'one\n'],
    [-1, 'old'],
    [1, 'newer'],
    [0, '\nend'],
  ])

  assert.deepEqual(operations[1], {
    type: -1,
    value: 'old',
    step: 2,
    changeNumber: 1,
    sourceStart: { offset: 4, line: 2, column: 1 },
    sourceEnd: { offset: 7, line: 2, column: 4 },
    targetStart: { offset: 4, line: 2, column: 1 },
    targetEnd: { offset: 4, line: 2, column: 1 },
  })
  assert.deepEqual(operations[2].targetEnd, {
    offset: 9,
    line: 2,
    column: 6,
  })
})

test('change cards include algorithm steps, ranges, and anchors', () => {
  const output = new FakeElement()
  additions([[0, 'same '], [1, 'new']], '', output)
  const card = output.children[2]

  assert.equal(card.dataset.step, 2)
  assert.match(card.children[0].textContent, /INSERT #1 · algorithm step 2/)
  assert.match(card.children[0].textContent, /target \[5, 8\)/)
  assert.match(card.children[0].textContent, /source anchor 5/)
})
