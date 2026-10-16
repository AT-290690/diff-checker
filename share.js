const getCodec = () => {
  if (!globalThis.LZString) {
    throw new Error('The link compression library is unavailable')
  }
  return globalThis.LZString
}

export const encodeSharedText = (text) => getCodec().compressToBase64(text)

export const decodeSharedText = (value) => {
  const result = getCodec().decompressFromBase64(value)
  if (result === null) throw new Error('This shared diff link is invalid')
  return result
}

export const readSharedDiff = (search) => {
  const params = new URLSearchParams(search)
  const add = params.get('a')
  const remove = params.get('b')

  if (add === null && remove === null) return null

  return {
    add: add === null ? '' : decodeSharedText(add),
    remove: remove === null ? '' : decodeSharedText(remove),
  }
}
