const dmp = new diff_match_patch();
export const match = (a, b) => dmp.diff_main(a, b, true);

export const patch = (diff = [], buffer = '') => {
  const patch = dmp.patch_make(diff);
  const [result, errors] = dmp.patch_apply(patch, buffer);
  return result;
};

const formatTextToHtml = current => {
  switch (current) {
    case '&':
      return '&amp;';
    case '<':
      return '&lt;';
    case '>':
      return '&gt;';
    case '\n':
      return '<br/>';
    case ' ':
    case '\t':
      return '&nbsp;';
    default:
      return current;
  }
};

export const additions = (data = [], buffer = '', element) => {
  const characters = buffer.split('');
  let pointer = 0;
  data.forEach(change => {
    const type = change[0];
    const value = change[1];
    if (type === 0) {
      let res = '';
      for (let i = pointer; i < pointer + value.length; i++) {
        const current = characters[i];
        res += formatTextToHtml(current);
      }
      element.innerHTML += `<span class="stay-add">${res}</span>`;
      pointer += value.length;
    } else if (type === -1) {
      pointer += value.length;
    } else if (type === 1) {
      let res = '';
      for (let i = 0; i < value.length; i++) {
        const current = value[i];
        res += formatTextToHtml(current);
      }

      element.innerHTML += `<span class="add">${res}</span>`;
    }
  });
};
export const removals = (data = [], buffer = '', element) => {
  const characters = buffer.split('');
  let pointer = 0;
  data.forEach(change => {
    const type = change[0];
    const value = change[1];
    if (type === 0) {
      let res = '';
      for (let i = pointer; i < pointer + value.length; i++) {
        const current = characters[i];
        res += formatTextToHtml(current);
      }
      element.innerHTML += `<span class="stay-remove">${res}</span>`;
      pointer += value.length;
    } else if (type === -1) {
      let res = '';
      for (let i = pointer; i < pointer + value.length; i++) {
        const current = characters[i];
        res += formatTextToHtml(current);
      }
      element.innerHTML += `<span class="remove">${res}</span>`;
      pointer += value.length;
    }
  });
};
