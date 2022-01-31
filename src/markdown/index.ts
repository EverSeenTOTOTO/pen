import mdit from 'markdown-it';
import mditPlugins from './default-plugins';

export default (plugins?: any[]) => (markdown: string):string => {
  const mdrender = mdit({
    html: true,
    linkify: true,
    typographer: true,
    breaks: false,
    quotes: '“”‘’',
  });

  for (const plugin of [...mditPlugins, ...(plugins ?? [])]) {
    mdrender.use(...plugin);
  }

  return mdrender.render(markdown);
};
