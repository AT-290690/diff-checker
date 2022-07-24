import { match, apply, additions, removals } from './diff.js';

const main = document.getElementById('main');
const elA = document.getElementById('A');
const elB = document.getElementById('B');
const toolbar = document.getElementById('toolbar');
const compare = document.getElementById('compare');
const State = {
  orientation: localStorage.getItem('orientation') ?? 'vertical',
  diff: {},
  a: ''
};

compare.addEventListener('click', () => {
  const inpA = document.getElementById('inputA');
  if (inpA) {
    const inpB = document.getElementById('inputB');
    const temp = inpA.value;
    State.a = temp;
    const diff = (State.diff = match(inpA.value, inpB.value));
    elA.innerHTML = '';
    elB.innerHTML = '';
    additions(diff, temp, elB);
    removals(diff, temp, elA);
  }
});

const dropfile = (file, el) => {
  const reader = new FileReader();
  reader.onload = e => (el.value = e.target.result);
  reader.readAsText(file, 'UTF-8');
};

const reset = document.getElementById('reset');
reset.addEventListener('click', () => {
  elA.innerHTML = `<textarea id="inputA" spellcheck="false"></textarea>`;
  elB.innerHTML = `<textarea id="inputB" spellcheck="false"></textarea>`;
  const inpA = document.getElementById('inputA');
  const inpB = document.getElementById('inputB');
  if (State.orientation === 'horizontal') {
    inpA.style = 'height: 43vh';
    inpB.style = 'height: 43vh';
  }
  inpA.value = State.a;
  inpB.value = '';
  inpA.ondrop = e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    dropfile(file, inpA);
  };
  inpB.ondrop = e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    dropfile(file, inpB);
  };
});

const merge = document.getElementById('merge');
merge.addEventListener('click', () => {
  reset.click();
  const inpA = document.getElementById('inputA');
  const inpB = document.getElementById('inputB');
  inpB.value = '';
  inpA.value = apply(State.diff, State.a);
});

const changes = document.getElementById('changes');

changes.addEventListener('click', () => {
  const enterChangesMode = () => {
    for (const el of document.getElementsByClassName('adj')) {
      el.style.display = 'none';
    }
    elA.style.display = 'grid';
    elB.style.display = 'grid';
  };
  const exitChangesMode = () => {
    for (const el of document.getElementsByClassName('adj')) {
      el.style.display = null;
    }
    elA.style.display = 'block';
    elB.style.display = 'block';
  };
  if (elA.style.display === 'grid') {
    exitChangesMode();
  } else {
    enterChangesMode();
    onclick =
      "() => { document.getElementById('changes').click(); this.scrollIntoView(); }";
    for (const el of document.getElementsByClassName('add')) {
      const onClick = () => {
        el.removeEventListener('click', onClick);
        exitChangesMode();
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      };
      el.addEventListener('click', onClick, true);
    }

    for (const el of document.getElementsByClassName('remove')) {
      const onClick = () => {
        el.removeEventListener('click', onClick);
        exitChangesMode();
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
  const inpA = document.getElementById('inputA');
  const inpB = document.getElementById('inputB');
  if (type === 'horizontal') {
    localStorage.setItem('orientation', (State.orientation = 'horizontal'));
    main.style = 'flex-direction: column';
    elA.style = 'height: 43vh; width: auto';
    elB.style = 'height: 43vh; width: auto';
    toolbar.style = 'flex-direction: row; margin: 10px';
    if (inpA) {
      inpA.style = 'height: 43vh';
      inpB.style = 'height: 43vh';
    }
  } else if (type === 'vertical') {
    localStorage.setItem('orientation', (State.orientation = 'vertical'));
    main.style = null;
    elA.style = null;
    elB.style = null;
    if (inpA) {
      inpA.style = null;
      inpB.style = null;
    }
    toolbar.style = null;
  }
};
rotate.addEventListener('click', () =>
  rotateLayout(State.orientation === 'vertical' ? 'horizontal' : 'vertical')
);
rotateLayout(State.orientation);
reset.click();
