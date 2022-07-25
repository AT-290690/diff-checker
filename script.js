import { match, apply, additions, removals } from './diff.js';

const main = document.getElementById('main');

const diffElements = {
  add: {
    diff: document.getElementById('Add'),
    changes: document.getElementById('addChanges'),
    input: document.getElementById('inputAdd')
  },
  remove: {
    diff: document.getElementById('Remove'),
    changes: document.getElementById('removeChanges'),
    input: document.getElementById('inputRemove')
  }
};

const toolbar = document.getElementById('toolbar');
const compare = document.getElementById('compare');
const changes = document.getElementById('changes');
const reset = document.getElementById('reset');
const merge = document.getElementById('merge');
const rotate = document.getElementById('rotate');

const State = {
  orientation: localStorage.getItem('orientation') ?? 'vertical',
  diff: {},
  stage: 'Prep', //Prep, Diff
  cache: ''
};

const showInputs = args => {
  args.forEach(arg => {
    diffElements[arg].input.style.display = 'block';
    diffElements[arg].changes.style.display = 'none';
  });
};

const hideInputs = args => {
  args.forEach(arg => {
    diffElements[arg].input.style.display = 'none';
    diffElements[arg].changes.style.display = 'block';
  });
};
const cleanUpChanges = args => {
  args.forEach(arg => {
    diffElements[arg].changes.innerHTML = '';
  });
};
const resetState = () => {
  showInputs(['add', 'remove']);
  cleanUpChanges(['add', 'remove']);
  State.stage = 'Prep';
  diffElements.remove.input.value = State.cache;
  diffElements.add.input.value = '';
};

compare.addEventListener('click', () => {
  State.cache = diffElements.remove.input.value;
  State.stage = 'Diff';
  const diff = (State.diff = match(
    diffElements.remove.input.value,
    diffElements.add.input.value
  ));
  cleanUpChanges(['add', 'remove']);
  hideInputs(['add', 'remove']);
  additions(diff, State.cache, diffElements.add.changes);
  removals(diff, State.cache, diffElements.remove.changes);
});

const dropfile = (file, el) => {
  const reader = new FileReader();
  reader.onload = e => (el.value = e.target.result);
  reader.readAsText(file, 'UTF-8');
};

diffElements.remove.diff.ondrop = e => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  dropfile(file, diffElements.remove.input);
};

diffElements.add.diff.ondrop = e => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  dropfile(file, diffElements.add.input);
};

reset.addEventListener('click', resetState);

merge.addEventListener('click', () => {
  resetState();
  diffElements.add.input.value = '';
  diffElements.remove.input.value = apply(State.diff, State.cache);
});
const enterChangesMode = args => {
  args.forEach(arg => {
    for (const el of document.getElementsByClassName(`adj-${arg}`)) {
      el.style.display = 'none';
    }
    diffElements[arg].changes.style.display = 'grid';
  });
};
const exitChangesMode = args => {
  args.forEach(arg => {
    for (const el of document.getElementsByClassName(`adj-${arg}`)) {
      el.style.display = null;
    }
    diffElements[arg].changes.style.display = 'block';
  });
};
changes.addEventListener('click', () => {
  if (diffElements.remove.changes.style.display === 'grid') {
    exitChangesMode(['add', 'remove']);
  } else {
    const addElements = document.getElementsByClassName('add');
    const removeElements = document.getElementsByClassName('remove');
    const onlyFor = [];

    if (addElements.length) {
      onlyFor.push('add');
      for (const el of addElements) {
        const onClick = () => {
          el.removeEventListener('click', onClick);
          exitChangesMode(['add']);
          el.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
        };
        el.addEventListener('click', onClick, true);
      }
    }
    if (removeElements.length) {
      onlyFor.push('remove');
      for (const el of removeElements) {
        const onClick = () => {
          el.removeEventListener('click', onClick);
          exitChangesMode(['remove']);
          el.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
        };
        el.addEventListener('click', onClick, true);
      }
    }

    hideInputs(onlyFor);
    enterChangesMode(onlyFor);
  }
});
const rotateLayout = type => {
  if (type === 'horizontal') {
    localStorage.setItem('orientation', (State.orientation = 'horizontal'));
    main.style = 'flex-direction: column';
    diffElements.add.diff.style = 'height: 43vh; width: auto';
    diffElements.remove.diff.style = 'height: 43vh; width: auto';
    toolbar.style = 'flex-direction: row; margin: 10px';
    diffElements.remove.input.style = 'height: 43vh';
    diffElements.add.input.style = 'height: 43vh';
  } else if (type === 'vertical') {
    localStorage.setItem('orientation', (State.orientation = 'vertical'));
    main.style = null;
    diffElements.add.diff.style = null;
    diffElements.remove.diff.style = null;
    diffElements.remove.input.style = null;
    diffElements.add.input.style = null;
    toolbar.style = null;
  }
};
rotate.addEventListener('click', () =>
  rotateLayout(State.orientation === 'vertical' ? 'horizontal' : 'vertical')
);
rotateLayout(State.orientation);
resetState();
