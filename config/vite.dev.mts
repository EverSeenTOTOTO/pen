import path from 'path';
import fs from 'fs';
import { defineConfig, ViteDevServer } from 'vite';
import base, { paths } from './vite.common.mts';
import { createTheme } from '../src/server/theme';
import { readUnknown } from '../src/server/reader';
import { bindSocket } from '../src/server/socket';
import { logger } from '../src/server/logger';
import { RemarkRehype } from '../src/server/rehype';

const devSSR = () => ({
  name: 'dev-ssr',
  // Dev-mode transitional state: @mui v5 CJS cannot interop with vite 8's
  // module runner (no __esModule handling), so dev SSR of the MUI app fails
  // and requests fall through to the client-only SPA below. Inject the
  // markdown/hljs/katex css so the CSR fallback is still styled. Removed
  // when Phase 2 of the modernization plan deletes MUI.
  transformIndexHtml(html: string) {
    return html.replace('<!-- inject -->', [
      '<link rel="stylesheet" href="/src/assets/github-markdown-light.css">',
      '<link rel="stylesheet" href="/src/assets/highlightjs-github-light.css">',
      '<link rel="stylesheet" href="/src/assets/katex.min.css">',
    ].join('\n'));
  },
  async configureServer(vite: ViteDevServer) {
    const namespace = '/';
    const ignores = [/^\/\./];
    const socketPath = '/pensocket.io';
    const dist = path.join(process.cwd(), 'src');
    const root = path.join(process.cwd(), '../..');
    const theme = await createTheme('dark', dist);
    const templateHtml = fs.readFileSync(paths.template, 'utf-8');
    const transports: ['websocket'] = ['websocket'];
    const remark = new RemarkRehype({ logger, plugins: [] })

    bindSocket(vite.httpServer!, {
      root,
      ignores,
      dist,
      logger,
      remark,
      namespace,
      socketPath,
      transports,
      connectTimeout: 5000,
    });

    // 缺点是不能调试完整服务端代码，只能调试服务端同构应用的部分
    return () => vite.middlewares.use(async (req, res, next) => {
      try {
        const current = await readUnknown({
          remark,
          root,
          ignores,
          relative: '/',
        });
        const { render } = await vite.ssrLoadModule(paths.serverEntry);
        const template = await vite.transformIndexHtml(req.originalUrl!, templateHtml);

        const { html } = await render({
          req,
          res,
          theme,
          template,
          prefetch: {
            theme,
            home: { data: current },
            socket: { socketPath, transports, namespace },
          },
        });

        res.end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        console.error(e.stack ?? e.message);
        next();
      }
    });
  },
});

export default defineConfig((c) => ({
  ...base(c),
  server: {
    host: true,
    watch: {
      ignored: ['coverage/*'],
    },
  },
  plugins: [
    ...base(c).plugins,
    devSSR(),
  ],
  ssr: {
    // @mui v5 has no exports map: externals fail node ESM dir-import and raw
    // bundling hits `require is not defined` in vite 8's module runner. Route
    // it through the ssr dep optimizer instead, which converts CJS to ESM.
    // Transitional only — MUI is removed entirely in Phase 2 of the plan.
    optimizeDeps: {
      include: [
        '@mui/material/Breadcrumbs',
        '@mui/material/Container',
        '@mui/material/CssBaseline',
        '@mui/material/Divider',
        '@mui/material/Drawer',
        '@mui/material/IconButton',
        '@mui/material/Link',
        '@mui/material/List',
        '@mui/material/ListItemButton',
        '@mui/material/ListItemIcon',
        '@mui/material/ListItemText',
        '@mui/material/NoSsr',
        '@mui/material/Paper',
        '@mui/material/Skeleton',
        '@mui/material/Snackbar',
        '@mui/material/styles',
        '@mui/material/Switch',
        '@mui/material/Typography',
        '@mui/lab/Alert',
        '@mui/x-tree-view/TreeItem',
        '@mui/x-tree-view/TreeView',
        '@mui/icons-material/ChevronLeft',
        '@mui/icons-material/ChevronRight',
        '@mui/icons-material/Description',
        '@mui/icons-material/ExpandLessTwoTone',
        '@mui/icons-material/ExpandMore',
        '@mui/icons-material/Folder',
        '@mui/icons-material/Home',
      ],
    },
    noExternal: [
      /^(unified|(remark|rehype|hast|unist)[\w-.]+)/,
    ],
  },
}));
