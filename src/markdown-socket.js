const path = require('path');
const WebSocketServer = require('websocket').server;
const Watcher = require('./watcher');

class MarkdownSocket {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.server = null;
    this.pathname = null;
  }

  listenTo(httpServer) {
    this.server = new WebSocketServer();
    this.server.mount({ httpServer });
    this.server.on('request', this.onRequest.bind(this));
    this.server.on('connect', this.onConnect.bind(this));
  }

  onRequest(request) {
    this.pathname = request.resource;
    /*     if (extname !== '.md' && extname !== '.markdown') {
      request.reject();
      return;
    }
 */
    request.accept(null, request.origin);
  }

  onConnect(connection) {
    const decodedPath = decodeURIComponent(this.pathname);
    const watcher = new Watcher(path.join(this.rootPath, decodedPath));
    // 使用websocket主动发送渲染后的html
    watcher.ondata = (data) => {
      connection.send(JSON.stringify(data));
    };
    watcher.onerror = (err) => {
      connection.send(err.message);
    };
    watcher.start();
    watcher.trigger();

    connection.on('close', () => {
      watcher.stop();
    });
  }

  close() {
    this.server.closeAllConnections();
  }
}

module.exports = MarkdownSocket;
