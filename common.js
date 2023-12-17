export const main = document.getElementById('main')
export const diffElements = {
  add: {
    diff: document.getElementById('Add'),
    changes: document.getElementById('addChanges'),
    input: document.getElementById('inputAdd'),
  },
  remove: {
    diff: document.getElementById('Remove'),
    changes: document.getElementById('removeChanges'),
    input: document.getElementById('inputRemove'),
  },
}
export const toolbar = document.getElementById('toolbar')
export const compare = document.getElementById('compare')
export const changes = document.getElementById('changes')
export const reset = document.getElementById('reset')
export const rotate = document.getElementById('rotate')

export const State = {
  orientation: localStorage.getItem('orientation') ?? 'vertical',
  diff: [],
  stage: 'Prep', //Prep, Diff
  cache: { remove: '', add: '' },
}
