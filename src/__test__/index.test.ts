import path from 'path';
import fs from 'fs';
import http, { ServerResponse } from 'http';
import { io } from 'socket.io-client';
import { pen } from '../index';

describe('test pen', () => {
  const TMP_DIR = path.resolve('./tmp/');
  const TMP_SUB_DIR = path.resolve(TMP_DIR, './sub/');
  const md = path.resolve(TMP_DIR, './hello.md');
  const submd = path.resolve(TMP_SUB_DIR, './world.md');
  const subtxt = path.resolve(TMP_SUB_DIR, './world.txt');
  const port = 4213;
  const url = `http://localhost:${port}`;

  let server: http.Server;

  const checkClosedConnection = (res) => () => {
    server.getConnections((_e, c) => {
      expect(c).toBe(0);
      res();
    });
  };

  beforeAll(() => {
    fs.mkdirSync(TMP_DIR);
    fs.mkdirSync(TMP_SUB_DIR);
    fs.writeFileSync(md, '# md');
    fs.writeFileSync(submd, '# md');
    fs.writeFileSync(subtxt, '# md');
    server = http.createServer((_req, res: ServerResponse) => {
      fs.createReadStream(path.resolve('./dist/spa/index.html'))
        .pipe(res);
    });
  });
  beforeEach(() => new Promise<void>((res) => {
    server.listen(port, res);
  }));
  afterAll(() => {
    fs.rmdirSync(TMP_DIR, {
      recursive: true,
    });
  });
  afterEach(() => new Promise((res) => {
    server.close(res);
    pen.clear();
  }));

  it('test construct pen with default value', () => new Promise<void>((res) => {
    pen.create();
    expect(pen.namespaces.length).toBe(1);

    const nsp = pen.namespaces[0];

    expect(nsp.namespace).toBe('/');
    expect(nsp.root).toBe(path.resolve('.'));
    expect(nsp.io).toBeNull();

    pen.close(checkClosedConnection(res));
  }));

  it('serve file', () => new Promise<void>((res, rej) => {
    pen.create({
      root: md,
    }).attach(server);

    const client = io(url, {
      path: '/pensocket.io',
    });

    client.on('pencontent', (data) => {
      expect(data).toMatch(/<h1.+>md<\/h1>/);

      client.close();
      pen.close(checkClosedConnection(res));
    });
    client.on('penerror', rej);
  }));

  it('serve dir', () => new Promise<void>((res, rej) => {
    pen.create({
      root: TMP_DIR,
    }).attach(server);

    const client = io(url, {
      path: '/pensocket.io',
    });

    client.on('pencontent', (data) => {
      const arr = JSON.parse(data);

      expect(arr).toStrictEqual([
        {
          filename: path.basename(md),
          type: 'markdown',
        },
        {
          filename: 'sub',
          type: 'dir',
        },
      ]);

      client.close();
      pen.close(checkClosedConnection(res));
    });
    client.on('penerror', rej);
  }));

  it('use special namespace', () => new Promise<void>((res, rej) => {
    pen
      .create({
        root: md,
        namespace: '/special',
      })
      .create({
        root: TMP_DIR,
        namespace: '/special2',
      })
      .attach(server);

    const client = io(`${url}/special`, {
      path: '/pensocket.io',
    });
    const client2 = io(`${url}/special2`, {
      path: '/pensocket.io',
    });

    client.on('pencontent', (data) => {
      expect(data).toMatch(/<h1.+>md<\/h1>/);
      client.close();
    });
    client2.on('pencontent', (data) => {
      const arr = JSON.parse(data);

      expect(arr).toStrictEqual([
        {
          filename: path.basename(md),
          type: 'markdown',
        },
        {
          filename: 'sub',
          type: 'dir',
        },
      ]);

      client2.close();
      pen.close(checkClosedConnection(res));
    });
    client.on('penerror', rej);
    client2.on('penerror', rej);
  }));

  it('client request', () => new Promise<void>((res, rej) => {
    pen.create({
      root: TMP_DIR,
    }).attach(server);

    const client = io(url, {
      path: '/pensocket.io',
    });

    client.on('pencontent', (data) => {
      const result = JSON.parse(data);
      const file = path.basename(md);
      if (Array.isArray(result)) {
        expect(result).toStrictEqual([
          {
            filename: file,
            type: 'markdown',
          },
          {
            filename: 'sub',
            type: 'dir',
          },
        ]);

        client.emit('penfile', file);
      } else {
        expect(result).toMatch(/md/);

        client.close();
        pen.close(checkClosedConnection(res));
      }
    });
    client.on('penerror', rej);
  }));

  it('client request sub dir', () => new Promise<void>((res, rej) => {
    pen.create({
      root: TMP_DIR,
    }).attach(server);

    const client = io(url, {
      path: '/pensocket.io',
    });
    client.on('pencontent', (data) => {
      const result = JSON.parse(data);
      if (Array.isArray(result)) {
      // tmp dir
        if (result.find((item) => item.filename === 'sub' && item.type === 'dir')) {
          client.emit('penfile', 'sub');
        } else { // sub dir
          const file = path.basename(submd);

          expect(result).toStrictEqual([
            {
              filename: file,
              type: 'markdown',
            },
          ]);
          client.emit('penfile', `sub/${file}`);
        }
      } else {
        expect(result).toMatch(/md/);

        client.close();
        pen.close(checkClosedConnection(res));
      }
    });
    client.on('penerror', rej);
  }));
});
