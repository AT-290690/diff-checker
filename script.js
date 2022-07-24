import { match, apply, additions, removals } from './diff.js';

const elA = document.getElementById('A');
const elB = document.getElementById('B');
const compare = document.getElementById('compare');
const State = { diff: {}, a: '' };
compare.addEventListener('click', () => {
  const inpA = document.getElementById('inputA');
  const inpB = document.getElementById('inputB');
  const temp = inpA.value;
  State.a = temp;
  const diff = (State.diff = match(inpA.value, inpB.value));
  elA.innerHTML = '';
  elB.innerHTML = '';
  additions(diff, temp, elB);
  removals(diff, temp, elA);
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
  inpA.value = inpB.value = apply(State.diff, State.a);
});

reset.click();
