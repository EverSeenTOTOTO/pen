const fs = require('fs');
const http = require('http');
const path = require('path');
const MarkdownSocket = require('./markdown-socket');

const handler = (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  const indexHTMLPath = path.join(__dirname, '../dist/index.html');
  fs.createReadStream(indexHTMLPath).pipe(res);
};

class Server {
  constructor(rootPath) {
    this.rootPath = rootPath || '.';
    this._server = http.createServer(handler);

    this._ws = new MarkdownSocket(this.rootPath);
    this._ws.listenTo(this._server);
  }

  listen(port, cb) {
    this._server.listen(port, cb);
  }

  close(cb) {
    this._ws.close();
    this._server.close(cb);
  }
}

module.exports = Server;
