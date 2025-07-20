import * as Y from 'yjs';
import { applyAwarenessUpdate, encodeAwarenessUpdate } from 'y-protocols/awareness';
import throttle from 'lodash.throttle';

class SocketIOProvider {
  constructor(socket, roomName, doc) {
    this.socket = socket;
    this.roomName = roomName;
    this.doc = doc;
    this.awareness = doc.awareness;
    this.connected = false;

    this.socket.on('yjs-update', (update) => {
      Y.applyUpdate(this.doc, new Uint8Array(update));
    });

    this.socket.on('awareness-update', (update) => {
      applyAwarenessUpdate(this.awareness, new Uint8Array(update), this);
    });

    this.awarenessUpdateThrottled = throttle(() => {
      const update = encodeAwarenessUpdate(this.awareness, [this.awareness.clientID]);
      this.socket.emit('awareness-update', this.roomName, Array.from(update));
    }, 100);
    this.awareness.on('update', this.awarenessUpdateThrottled);

    this.yjsUpdateThrottled = throttle(() => {
      const update = Y.encodeStateAsUpdate(this.doc);
      this.socket.emit('yjs-update', this.roomName, Array.from(update));
    }, 100);
    this.doc.on('afterTransaction', (transaction) => {
      if (transaction.origin !== this) {
        this.yjsUpdateThrottled();
      }
    });

    this.connected = true;
  }

  destroy() {
    this.connected = false;
    this.socket.off('yjs-update');
    this.socket.off('awareness-update');
    this.awareness.off('update', this.awarenessUpdateThrottled);
    if (this.awarenessUpdateThrottled && this.awarenessUpdateThrottled.cancel) this.awarenessUpdateThrottled.cancel();
    if (this.yjsUpdateThrottled && this.yjsUpdateThrottled.cancel) this.yjsUpdateThrottled.cancel();
  }
}

export default SocketIOProvider; 