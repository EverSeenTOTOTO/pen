import path from 'path';
import fs from 'fs';
import http from 'http';
import { io } from 'socket.io-client';
import Pen from '../index';

const TMP_DIR = './tmp/';
const md = path.resolve(TMP_DIR, './hello.md');

describe('test pen', () => {
  let server: http.Server;
  beforeEach(() => {
    fs.mkdirSync(TMP_DIR);
    fs.mkdirSync(path.resolve(TMP_DIR, './sub/'));
    fs.writeFileSync(md, '# md');
    server = http.createServer();
    server.listen(4213);
  });
  afterEach(() => {
    fs.rmdirSync(TMP_DIR, {
      recursive: true,
    });
    server.close();
  });

  it('test construct pen with default value', (done) => {
    const pen = new Pen();
    expect(pen.path).toBe('.');
    expect(pen.namespace).toBe('/');
    pen.close(done);
  });

  it('serve file', (done) => {
    const pen = new Pen({
      path: md,
    });
    pen.attach(server);

    const client = io('http://localhost:4213');
    client.on('pencontent', (data) => {
      expect(data).toMatch(/<h1.+>md<\/h1>/);
      client.close();
      pen.close(done);
    });
  });

  it('serve dir', (done) => {
    const pen = new Pen({
      path: TMP_DIR,
    });
    pen.attach(server);

    const client = io('http://localhost:4213');
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
      pen.close(done);
    });
  });

  it('use special namespace', (done) => {
    const pen = new Pen({
      path: md,
      namespace: '/special',
    });
    pen.attach(server);

    const client = io('http://localhost:4213/special');
    client.on('pencontent', (data) => {
      expect(data).toMatch(/<h1.+>md<\/h1>/);
      client.close();
      pen.close(done);
    });
  });
});
