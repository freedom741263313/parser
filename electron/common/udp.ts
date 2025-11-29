export interface UdpMessage {
  id: string;
  timestamp: number;
  direction: 'in' | 'out';
  remoteAddress: string;
  remotePort: number;
  data: string; // Hex string
}

export interface UdpConfig {
  localPort: number;
  remoteIp?: string;
  remotePort?: number;
}

// IPC Channel Names
export const IPC_CHANNELS = {
  UDP_START: 'udp:start',
  UDP_STOP: 'udp:stop',
  UDP_SEND: 'udp:send',
  UDP_MESSAGE: 'udp:message', // From Main to Renderer
  UDP_ERROR: 'udp:error',     // From Main to Renderer
  UDP_STATUS: 'udp:status',   // From Main to Renderer (e.g. listening)
};

export interface UdpStartPayload {
  port: number;
}

export interface UdpSendPayload {
  ip: string;
  port: number;
  data: string; // Hex string
}
