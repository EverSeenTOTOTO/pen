/* eslint-disable no-param-reassign */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// forked from markdown-it-code-copy

function renderCode(origRule) {
  return (...args) => {
    const [tokens, idx] = args;
    const content = tokens[idx].content
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&lt;');
    const origRendered = origRule(...args);

    if (content.length === 0) { return origRendered; }

    return `
  <div class="markdown-it-copy">
    ${origRendered}
    <button class="markdown-it-copy-btn" data-clipboard-text="${content}">
      <span class="markdown-it-copy-btn-text">${tokens[idx].info || 'copy'}</span>
    </button>
  </div>
`;
  };
}

export default (md) => {
  md.renderer.rules.fence = renderCode(md.renderer.rules.fence);
  md.renderer.rules.code_block = renderCode(md.renderer.rules.code_block);
};
