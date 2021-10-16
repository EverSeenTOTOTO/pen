import mdit from 'markdown-it';
import mditPlugins from './default-plugins';

export default (plugins?: any[]) => (markdown: string):string => {
  const mdrender = mdit({
    html: true,
    linkify: true,
  });

  for (const plugin of [...mditPlugins, ...(plugins ?? [])]) {
    mdrender.use(...plugin);
  }

  return mdrender.render(markdown);
};
