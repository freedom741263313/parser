import dgram from 'dgram';
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { UdpMessage } from '../common/udp';

// Simple hex helpers duplicating frontend utils to avoid module resolution issues in Electron for now
// Ideally we should share this via a shared package or careful tsconfig path mapping
function cleanHex(input: string): string {
  return input.replace(/0x/gi, '').replace(/[^0-9a-fA-F]/g, '');
}

function hexToBuffer(input: string): Buffer {
  const cleaned = cleanHex(input);
  if (cleaned.length % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }
  return Buffer.from(cleaned, 'hex');
}

function bufferToHex(buffer: Buffer): string {
  return buffer.toString('hex').match(/../g)?.join(' ') || '';
}

export class UdpService extends EventEmitter {
  private socket: dgram.Socket | null = null;

  constructor() {
    super();
  }

  async start(port: number): Promise<void> {
    if (this.socket) {
      await this.stop();
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = dgram.createSocket('udp4');

        this.socket.on('error', (err) => {
          this.emit('error', err);
          // this.socket?.close(); // Don't auto close on error, let user decide or retry
        });

        this.socket.on('message', (msg, rinfo) => {
          const udpMsg: UdpMessage = {
            id: randomUUID(),
            timestamp: Date.now(),
            direction: 'in',
            remoteAddress: rinfo.address,
            remotePort: rinfo.port,
            data: bufferToHex(msg),
          };
          this.emit('message', udpMsg);
        });

        this.socket.bind(port, () => {
          resolve();
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve();
        return;
      }
      this.socket.close(() => {
        this.socket = null;
        resolve();
      });
    });
  }

  async send(ip: string, port: number, hexData: string): Promise<void> {
    if (!this.socket) {
      throw new Error('Socket not started');
    }

    const buffer = hexToBuffer(hexData);

    return new Promise((resolve, reject) => {
      this.socket!.send(buffer, 0, buffer.length, port, ip, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
