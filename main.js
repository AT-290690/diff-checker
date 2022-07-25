import { match, patch, additions, removals } from './diff.js';
import {
  State,
  main,
  diffElements,
  toolbar,
  compare,
  reset,
  merge,
  rotate
} from './common.js';

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

const enterStage = stage => {
  State.stage = stage;
  switch (stage) {
    case 'Diff':
      cleanUpChanges(['add', 'remove']);
      hideInputs(['add', 'remove']);
      diffElements.add.diff.style.borderColor = 'var(--color-add)';
      diffElements.remove.diff.style.borderColor = 'var(--color-remove)';
      break;
    case 'Prep':
      diffElements.add.diff.style.borderColor = 'var(--color-stay)';
      diffElements.remove.diff.style.borderColor = 'var(--color-stay)';
      showInputs(['add', 'remove']);
      cleanUpChanges(['add', 'remove']);
      break;

    default:
      break;
  }
};

const diffCheck = () => {
  const source = diffElements.remove.input.value;
  const target = diffElements.add.input.value;
  State.cache.remove = source;
  State.cache.add = target;
  State.diff = match(source, target);
  enterStage('Diff');
  additions(State.diff, source, diffElements.add.changes);
  removals(State.diff, source, diffElements.remove.changes);
};

const enterChangesMode = args => {
  args.forEach(arg => {
    for (const el of document.getElementsByClassName(`stay-${arg}`)) {
      el.style.display = 'none';
    }
    diffElements[arg].changes.style.display = 'grid';
  });
};

const exitChangesMode = args => {
  args.forEach(arg => {
    for (const el of document.getElementsByClassName(`stay-${arg}`)) {
      el.style.display = null;
    }
    diffElements[arg].changes.style.display = 'block';
  });
};

const toggleChangesView = () => {
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
};

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

reset.addEventListener('click', () => {
  enterStage('Prep');
  diffElements.remove.input.value = State.cache.remove;
  diffElements.add.input.value = State.cache.add;
});
compare.addEventListener('click', diffCheck);
merge.addEventListener('click', () => {
  enterStage('Prep');
  diffElements.remove.input.value = patch(
    State.diff,
    diffElements.add.input.value
  )[0];
  diffElements.add.input.value = '';
  //apply(State.diff, State.cache);
});

changes.addEventListener('click', toggleChangesView);
rotate.addEventListener('click', () =>
  rotateLayout(State.orientation === 'vertical' ? 'horizontal' : 'vertical')
);

rotateLayout(State.orientation);
enterStage('Prep');
