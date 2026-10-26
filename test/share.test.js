import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const context = vm.createContext({})
vm.runInContext(await readFile('lz-string.min.js', 'utf8'), context)
globalThis.LZString = context.LZString

const { decodeSharedText, encodeSharedText, isShareable, readSharedDiff } =
  await import('../share.js')

test('shared text round-trips percent sequences, whitespace, and Unicode', () => {
  const input = '  100% legit %20 <tag> 🦉\n'
  assert.equal(decodeSharedText(encodeSharedText(input)), input)
})

test('shared diffs preserve an empty side', () => {
  const params = new URLSearchParams()
  params.set('a', encodeSharedText(''))
  params.set('b', encodeSharedText('source'))

  assert.deepEqual(readSharedDiff(params), { add: '', remove: 'source' })
})

test('a missing query side is treated as empty', () => {
  const params = new URLSearchParams()
  params.set('a', encodeSharedText('target'))

  assert.deepEqual(readSharedDiff(params), { add: 'target', remove: '' })
})

test('an unrelated query is not treated as a shared diff', () => {
  assert.equal(readSharedDiff('?example=true'), null)
})

test('shareability uses the combined UTF-8 byte size', () => {
  assert.equal(isShareable('123', '456', 6), true)
  assert.equal(isShareable('123', '4567', 6), false)
  assert.equal(isShareable('🦉', '', 3), false)
  assert.equal(isShareable('🦉', '', 4), true)
})
