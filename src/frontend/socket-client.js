import { w3cwebsocket as WebSocket } from 'websocket';

export default class SocketClient {
  constructor(location) {
    this.host = location.host;
    this.pathname = location.pathname;

    const url = `ws://${this.host}${this.pathname}`;

    this.ondata = () => {};

    this.socket = new WebSocket(url);
    this.socket.onmessage = (event) => {
      this.ondata(JSON.parse(event.data));
    };
  }
}
