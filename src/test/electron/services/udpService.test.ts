import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UdpService } from '../../../../electron/services/udpService';
import dgram from 'dgram';
import { EventEmitter } from 'events';

// Mock dgram
vi.mock('dgram');

describe('UdpService', () => {
  let service: UdpService;
  let mockSocket: any;

  beforeEach(() => {
    // Setup mock socket
    mockSocket = new EventEmitter();
    mockSocket.bind = vi.fn((port, cb) => cb && cb());
    mockSocket.close = vi.fn((cb) => cb && cb());
    mockSocket.send = vi.fn((msg, offset, length, port, address, cb) => cb && cb(null));
    mockSocket.address = vi.fn(() => ({ address: '127.0.0.1', port: 12345 }));

    // @ts-ignore
    dgram.createSocket.mockReturnValue(mockSocket);

    service = new UdpService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create socket on start', async () => {
    await service.start(12345);
    expect(dgram.createSocket).toHaveBeenCalledWith('udp4');
    expect(mockSocket.bind).toHaveBeenCalledWith(12345, expect.any(Function));
  });

  it('should close socket on stop', async () => {
    await service.start(12345);
    await service.stop();
    expect(mockSocket.close).toHaveBeenCalled();
  });

  it('should send data', async () => {
    await service.start(12345);
    const hexData = '01 02 03';
    await service.send('127.0.0.1', 5555, hexData);
    
    expect(mockSocket.send).toHaveBeenCalled();
    const args = mockSocket.send.mock.calls[0];
    // Buffer is a subclass of Uint8Array, but jest/vitest toBeInstanceOf check might be strict or jsdom environment diff
    // Let's check it is a Buffer which is what dgram uses
    expect(Buffer.isBuffer(args[0])).toBe(true);
    expect(args[0]).toHaveLength(3); // 01 02 03
    expect(args[3]).toBe(5555);
    expect(args[4]).toBe('127.0.0.1');
  });

  it('should emit message event on receiving data', () => new Promise<void>((resolve) => {
    service.start(12345);
    
    service.on('message', (msg) => {
      expect(msg.remoteAddress).toBe('192.168.1.100');
      expect(msg.remotePort).toBe(5555);
      expect(msg.data).toBe('0a 0b'); // Lowercase hex
      resolve();
    });

    // Simulate incoming message
    const msg = Buffer.from([0x0A, 0x0B]);
    const rinfo = { address: '192.168.1.100', port: 5555, family: 'IPv4', size: 2 };
    mockSocket.emit('message', msg, rinfo);
  }));

  it('should emit error event', () => new Promise<void>((resolve) => {
    service.start(12345);
    
    service.on('error', (err) => {
      expect(err.message).toBe('Socket Error');
      resolve();
    });

    mockSocket.emit('error', new Error('Socket Error'));
  }));
});
