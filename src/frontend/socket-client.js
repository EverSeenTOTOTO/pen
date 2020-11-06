import { w3cwebsocket as WebSocket } from 'websocket';

export default class SocketClient {
  constructor() {
    const url = `ws://${location.host}${location.pathname}`;

    this.ondata = () => {};

    this.socket = new WebSocket(url);
    this.socket.onmessage = (event) => {
      this.ondata(JSON.parse(event.data));
    };
  }
}
