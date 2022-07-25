const dmp = new diff_match_patch();
export const match = (a, b) => dmp.diff_main(a, b, true);

export const patch = (diff = [], buffer = '') =>
  dmp.patch_apply(dmp.patch_make(diff), buffer);

const pattern_amp = /&/g;
const pattern_lt = /</g;
const pattern_gt = />/g;
const pattern_para = /\n/g;
const pattern_space = /\s/g;

const formatTextToHtml = current =>
  current
    .replace(pattern_amp, '&amp;')
    .replace(pattern_lt, '&lt;')
    .replace(pattern_gt, '&gt;')
    .replace(pattern_para, '<br/>')
    .replace(pattern_space, '&nbsp;');

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
