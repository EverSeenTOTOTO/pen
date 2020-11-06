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
    this.server = http.createServer(handler);

    this.ws = new MarkdownSocket(this.rootPath);
    this.ws.listenTo(this.server);
  }

  listen(port, cb) {
    this.server.listen(port, cb);
  }

  close(cb) {
    this.ws.close();
    this.server.close(cb);
  }
}

module.exports = Server;
