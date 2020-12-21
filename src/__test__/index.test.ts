import path from 'path';
import fs from 'fs';
import http, { ServerResponse } from 'http';
import { io } from 'socket.io-client';
import { Pen } from '../index';

describe('test pen', () => {
  const TMP_DIR = './tmp/';
  const md = path.resolve(TMP_DIR, './hello.md');
  const port = 4213;
  let server: http.Server;
  const checkClosedConnection = (res) => () => {
    server.getConnections((e, c) => {
      expect(c).toBe(0);
      res();
    });
  };

  beforeAll(() => {
    fs.mkdirSync(TMP_DIR);
    fs.mkdirSync(path.resolve(TMP_DIR, './sub/'));
    fs.writeFileSync(md, '# md');
    server = http.createServer((_req, res: ServerResponse) => {
      fs.createReadStream(path.resolve('./dist/spa/index.html'))
        .pipe(res);
    });
    return new Promise<void>((res) => {
      server.listen(port, res);
    });
  });
  afterAll(() => {
    fs.rmdirSync(TMP_DIR, {
      recursive: true,
    });
    return new Promise((res) => {
      server.close(res);
    });
  });

  it('test construct pen with default value', () => new Promise<void>((res) => {
    const pen = new Pen();
    expect(pen.root).toBe(path.resolve('.'));
    expect(pen.path).toBe('/pensocket.io');
    expect(pen.namespace).toBe('/');
    pen.close(checkClosedConnection(res));
  }));

  it('serve file', () => new Promise<void>((res, rej) => {
    const pen = new Pen({
      root: md,
    });
    pen.attach(server);

    const client = io({
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
    const pen = new Pen({
      root: TMP_DIR,
    });
    pen.attach(server);

    const client = io({
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
    const pen = new Pen({
      root: md,
      namespace: '/special',
    });
    pen.attach(server);

    const client = io('/special', {
      path: '/pensocket.io',
    });
    client.on('pencontent', (data) => {
      expect(data).toMatch(/<h1.+>md<\/h1>/);
      client.close();
      pen.close(checkClosedConnection(res));
    });
    client.on('penerror', rej);
  }));

  it('client request', () => new Promise<void>((res, rej) => {
    const pen = new Pen({
      root: TMP_DIR,
    });
    pen.attach(server);

    const client = io({
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
});
