import { match, apply, additions, removals } from './diff.js';

const main = document.getElementById('main');
const diffElements = {
  add: document.getElementById('Add'),
  remove: document.getElementById('Remove')
};
const toolbar = document.getElementById('toolbar');
const compare = document.getElementById('compare');
const State = {
  orientation: localStorage.getItem('orientation') ?? 'vertical',
  diff: {},
  a: ''
};

compare.addEventListener('click', () => {
  const inpRemove = document.getElementById('inputRemove');
  if (inpRemove) {
    const inpAdd = document.getElementById('inputAdd');
    const temp = inpRemove.value;
    State.a = temp;
    const diff = (State.diff = match(inpRemove.value, inpAdd.value));
    diffElements.add.innerHTML = '';
    diffElements.remove.innerHTML = '';
    additions(diff, temp, diffElements.add);
    removals(diff, temp, diffElements.remove);
  }
});

const dropfile = (file, el) => {
  const reader = new FileReader();
  reader.onload = e => (el.value = e.target.result);
  reader.readAsText(file, 'UTF-8');
};

const reset = document.getElementById('reset');
reset.addEventListener('click', () => {
  diffElements.remove.innerHTML = `<textarea id="inputRemove" spellcheck="false"></textarea>`;
  diffElements.add.innerHTML = `<textarea id="inputAdd" spellcheck="false"></textarea>`;
  const inpRemove = document.getElementById('inputRemove');
  const inpAdd = document.getElementById('inputAdd');
  if (State.orientation === 'horizontal') {
    inpRemove.style = 'height: 43vh';
    inpAdd.style = 'height: 43vh;';
  }
  inpRemove.value = State.a;
  inpAdd.value = '';
  inpRemove.ondrop = e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    dropfile(file, inpRemove);
  };
  inpAdd.ondrop = e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    dropfile(file, inpAdd);
  };
});

const merge = document.getElementById('merge');
merge.addEventListener('click', () => {
  reset.click();
  const inpRemove = document.getElementById('inputRemove');
  const inpAdd = document.getElementById('inputAdd');
  inpAdd.value = '';
  inpRemove.value = apply(State.diff, State.a);
});

const changes = document.getElementById('changes');

changes.addEventListener('click', () => {
  const enterChangesMode = args => {
    args.forEach(arg => {
      for (const el of document.getElementsByClassName(`adj-${arg}`)) {
        el.style.display = 'none';
      }
      diffElements[arg].style.display = 'grid';
    });
  };
  const exitChangesMode = args => {
    args.forEach(arg => {
      for (const el of document.getElementsByClassName(`adj-${arg}`)) {
        el.style.display = null;
      }
      diffElements[arg].style.display = 'block';
    });
  };
  if (diffElements.remove.style.display === 'grid') {
    exitChangesMode(['add', 'remove']);
  } else {
    enterChangesMode(['add', 'remove']);
    for (const el of document.getElementsByClassName('add')) {
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

    for (const el of document.getElementsByClassName('remove')) {
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
});
const rotate = document.getElementById('rotate');
const rotateLayout = type => {
  const inpRemove = document.getElementById('inputRemove');
  const inpAdd = document.getElementById('inputAdd');
  if (type === 'horizontal') {
    localStorage.setItem('orientation', (State.orientation = 'horizontal'));
    main.style = 'flex-direction: column';
    diffElements.add.style = 'height: 43vh; width: auto';
    diffElements.remove.style = 'height: 43vh; width: auto';
    toolbar.style = 'flex-direction: row; margin: 10px';
    if (inpRemove) {
      inpRemove.style = 'height: 43vh';
      inpAdd.style = 'height: 43vh';
    }
  } else if (type === 'vertical') {
    localStorage.setItem('orientation', (State.orientation = 'vertical'));
    main.style = null;
    diffElements.add.style = null;
    diffElements.remove.style = null;
    if (inpRemove) {
      inpRemove.style = null;
      inpAdd.style = null;
    }
    toolbar.style = null;
  }
};
rotate.addEventListener('click', () =>
  rotateLayout(State.orientation === 'vertical' ? 'horizontal' : 'vertical')
);
rotateLayout(State.orientation);
reset.click();
