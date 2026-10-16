const dmp = new diff_match_patch()
export const match = (a, b) => dmp.diff_main(a, b, true)

export const patch = (diff = [], buffer = '') => {
  const patch = dmp.patch_make(diff)
  const [result, errors] = dmp.patch_apply(patch, buffer)
  return result
}

const render = (data, element, side) => {
  const fragment = document.createDocumentFragment()

  for (const [type, value] of data) {
    const isChange = side === 'add' ? type === 1 : type === -1
    if (type !== 0 && !isChange) continue

    const span = document.createElement('span')
    span.className = isChange ? side : `stay-${side}`
    span.textContent = value
    fragment.append(span)
  }

  element.replaceChildren(fragment)
}

export const additions = (data = [], _buffer = '', element) => {
  render(data, element, 'add')
}

export const removals = (data = [], _buffer = '', element) => {
  render(data, element, 'remove')
}
