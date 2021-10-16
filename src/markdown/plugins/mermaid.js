// forked from markdown-it-mermaid
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-param-reassign */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import mermaid from 'mermaid/dist/mermaid';

const mermaidChart = (code) => {
  try {
    mermaid.parse(code);
    return `<div class="mermaid">${code}</div>`;
  } catch ({ str }) {
    return `<pre>${str}</pre>`;
  }
};

const MermaidPlugin = (md) => {
  const temp = md.renderer.rules.fence.bind(md.renderer.rules);
  md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
    const token = tokens[idx];
    const code = token.content.trim();
    if (token.info === 'mermaid') {
      return mermaidChart(code);
    }
    const firstLine = code.split(/\n/)[0].trim();
    if (firstLine === 'gantt' || firstLine === 'sequenceDiagram' || firstLine.match(/^graph (?:TB|BT|RL|LR|TD);?$/)) {
      return mermaidChart(code);
    }
    return temp(tokens, idx, options, env, slf);
  };
};

export default MermaidPlugin;
