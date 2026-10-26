const dmp = new diff_match_patch()
export const match = (a, b) => dmp.diff_main(a, b, true)

export const patch = (diff = [], buffer = '') => {
  const patch = dmp.patch_make(diff)
  const [result, errors] = dmp.patch_apply(patch, buffer)
  return result
}

const position = () => ({ offset: 0, line: 1, column: 1 })

const advance = (current, value) => {
  let lineBreaks = 0
  let lastBreak = -1
  let index = value.indexOf('\n')

  while (index !== -1) {
    lineBreaks++
    lastBreak = index
    index = value.indexOf('\n', index + 1)
  }

  current.offset += value.length
  if (lineBreaks === 0) {
    current.column += value.length
  } else {
    current.line += lineBreaks
    current.column = value.length - lastBreak
  }
}

const copyPosition = ({ offset, line, column }) => ({ offset, line, column })

export const describeDiff = (data = []) => {
  const source = position()
  const target = position()
  let changeNumber = 0

  return data.map(([type, value], step) => {
    const sourceStart = copyPosition(source)
    const targetStart = copyPosition(target)
    if (type !== 1) advance(source, value)
    if (type !== -1) advance(target, value)

    return {
      type,
      value,
      step: step + 1,
      changeNumber: type === 0 ? null : ++changeNumber,
      sourceStart,
      sourceEnd: copyPosition(source),
      targetStart,
      targetEnd: copyPosition(target),
    }
  })
}

const range = (start, end) =>
  `[${start.offset}, ${end.offset}) · L${start.line}:C${start.column} → L${end.line}:C${end.column}`

const createChange = (operation, side) => {
  const span = document.createElement('span')
  span.className = side
  span.dataset.step = operation.step
  span.dataset.sourceStart = operation.sourceStart.offset
  span.dataset.sourceEnd = operation.sourceEnd.offset
  span.dataset.targetStart = operation.targetStart.offset
  span.dataset.targetEnd = operation.targetEnd.offset

  const meta = document.createElement('span')
  meta.className = 'change-meta'
  const action = side === 'add' ? 'INSERT' : 'DELETE'
  const activeRange =
    side === 'add'
      ? range(operation.targetStart, operation.targetEnd)
      : range(operation.sourceStart, operation.sourceEnd)
  const anchor =
    side === 'add'
      ? `source anchor ${operation.sourceStart.offset}`
      : `target anchor ${operation.targetStart.offset}`
  meta.textContent = `${action} #${operation.changeNumber} · algorithm step ${operation.step}\n${side === 'add' ? 'target' : 'source'} ${activeRange} · ${anchor} · ${operation.value.length} code units`

  const content = document.createElement('span')
  content.className = 'change-content'
  content.textContent = operation.value
  span.append(meta, content)
  return span
}

const createSummary = (data, metrics = {}) => {
  let inserted = 0
  let deleted = 0
  let unchanged = 0
  let changes = 0

  for (const [type, value] of data) {
    if (type === 1) inserted += value.length
    else if (type === -1) deleted += value.length
    else unchanged += value.length
    if (type !== 0) changes++
  }

  const summary = document.createElement('section')
  summary.className = 'diff-summary'
  const elapsed = Number.isFinite(metrics.elapsedMs)
    ? `${Math.round(metrics.elapsedMs)} ms`
    : 'time unavailable'
  const distance = Number.isFinite(metrics.editDistance)
    ? metrics.editDistance
    : Math.max(inserted, deleted)
  summary.textContent =
    `DIFF ALGORITHM · ${data.length} steps · ${changes} changes · ${elapsed}\n` +
    `+${inserted} inserted · −${deleted} deleted · ${unchanged} unchanged · edit distance ${distance}\n` +
    'Character ranges are zero-based [start, end); line and column positions are one-based.' +
    (metrics.timedOut ? '\nTime budget reached: the result is correct but may use coarser change groups.' : '')
  return summary
}

const render = (operations, rawData, element, side, metrics) => {
  const fragment = document.createDocumentFragment()
  fragment.append(createSummary(rawData, metrics))

  for (const operation of operations) {
    const isChange = side === 'add' ? operation.type === 1 : operation.type === -1
    if (operation.type !== 0 && !isChange) continue

    const span = isChange ? createChange(operation, side) : document.createElement('span')
    if (!isChange) {
      span.className = `stay-${side}`
      span.textContent = operation.value
    }
    fragment.append(span)
  }

  element.replaceChildren(fragment)
}

export const additions = (data = [], _buffer = '', element) => {
  render(describeDiff(data), data, element, 'add')
}

export const removals = (data = [], _buffer = '', element) => {
  render(describeDiff(data), data, element, 'remove')
}

export const renderDiff = (data = [], addElement, removeElement, metrics = {}) => {
  const operations = describeDiff(data)
  render(operations, data, addElement, 'add', metrics)
  render(operations, data, removeElement, 'remove', metrics)
}
