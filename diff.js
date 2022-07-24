const dmp = new diff_match_patch();
export const match = (a, b) => {
  const diff = [];
  const diff_obj = dmp.diff_main(a, b, true);
  for (const change in diff_obj) {
    const type = diff_obj[change][0];
    if (type === 0 || type === -1)
      diff_obj[change][1] = diff_obj[change][1].length;
    diff.push([type, diff_obj[change][1]]);
  }
  return diff_obj;
};
export const apply = (data = [], buffer = '') => {
  const characters = buffer.split('');
  const result = [];
  let pointer = 0;
  data.forEach(change => {
    const type = change[0];
    const value = change[1];
    if (type === 0) {
      for (let i = pointer; i < pointer + value; i++) {
        result.push(characters[i]);
      }
      pointer += value;
    } else if (type === -1) {
      pointer += value;
    } else if (type === 1) {
      result.push(...value);
    }
  });
  return result.join('');
};

export const additions = (data = [], buffer = '', element) => {
  const characters = buffer.split('');
  let pointer = 0;
  data.forEach((change, index) => {
    const type = change[0];
    const value = change[1];
    if (type === 0) {
      let rest = '';
      for (let i = pointer; i < pointer + value; i++) {
        if (characters[i] === ' ') rest += '&nbsp;';
        else if (characters[i] === '\n') rest += '<br/>';
        else rest += characters[i];
      }
      element.innerHTML += rest;
      pointer += value;
    } else if (type === -1) {
      pointer += value;
    } else if (type === 1) {
      let res = '';
      for (let i = 0; i < value.length; i++) {
        if (value[i] === ' ') res += '&nbsp;';
        else if (value[i] === '\n') res += '<br/>';
        else res += value[i];
      }
      element.innerHTML += `<span class="add">${res}</span>`;
    }
  });
};
export const removals = (data = [], buffer = '', element) => {
  const characters = buffer.split('');
  let pointer = 0;
  data.forEach((change, index) => {
    const type = change[0];
    const value = change[1];
    if (type === 0) {
      let rest = '';
      for (let i = pointer; i < pointer + value; i++) {
        if (characters[i] === ' ') rest += '&nbsp;';
        else if (characters[i] === '\n') rest += '<br/>';
        else rest += characters[i];
      }
      element.innerHTML += rest;
      pointer += value;
    } else if (type === -1) {
      let res = '';
      for (let i = pointer; i < pointer + value; i++) {
        if (characters[i] === ' ') res += '&nbsp;';
        else if (characters[i] === '\n') res += '<br/>';
        else res += characters[i];
      }
      element.innerHTML += `<span class="remove">${res}</span>`;
      pointer += value;
    }
  });
};
