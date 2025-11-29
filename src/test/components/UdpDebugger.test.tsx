import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UdpDebugger from '../../components/UdpDebugger';
import { ProtocolRule } from '../../types/rule';

// Mock hooks
const mockMessages = [
  { id: '1', timestamp: 1600000000000, direction: 'in', remoteAddress: '127.0.0.1', remotePort: 3000, data: '01 02' },
  { id: '2', timestamp: 1600000001000, direction: 'out', remoteAddress: '127.0.0.1', remotePort: 3000, data: 'AA BB' }
];

const mockRules: ProtocolRule[] = [
  {
    id: 'rule1',
    name: 'Test Protocol',
    type: 'custom',
    fields: [
      { id: 'f1', name: 'Field1', type: 'uint8', length: 1, offset: 0, endianness: 'be', algorithm: 'default' },
      { id: 'f2', name: 'Field2', type: 'uint8', length: 1, offset: 1, endianness: 'be', algorithm: 'default' }
    ]
  }
];

vi.mock('../../hooks/useUdp', () => ({
  useUdp: () => ({
    messages: mockMessages,
    isListening: false,
    error: null,
    start: vi.fn(),
    stop: vi.fn(),
    send: vi.fn(),
    clearMessages: vi.fn()
  })
}));

vi.mock('../../hooks/useStore', () => ({
  useStore: () => ({
    rules: mockRules,
    enums: [],
    templates: [],
    replyRules: []
  })
}));

// Mock clipboard
const mockWriteText = vi.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('UdpDebugger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders messages correctly', () => {
    render(<UdpDebugger />);
    
    // Check header
    expect(screen.getByText('调试器')).toBeInTheDocument();
    
    // Check messages
    expect(screen.getByText('01 02')).toBeInTheDocument();
    expect(screen.getByText('AA BB')).toBeInTheDocument();
    expect(screen.getByText('接收')).toBeInTheDocument();
    // There might be multiple "发送" (button and badge), so we check if at least one exists
    // Or check specifically for the badge class if needed, but simply ensuring it's on screen is enough for now
    expect(screen.getAllByText('发送').length).toBeGreaterThan(0);
  });

  it('expands message row on click and shows parsed info', () => {
    render(<UdpDebugger />);
    
    // Click on the row to expand
    const row = screen.getByText('01 02').closest('tr');
    expect(row).toBeInTheDocument();
    fireEvent.click(row!);
    
    // Check for expanded content
    expect(screen.getByText('原始码流 (16字节/行)')).toBeInTheDocument();
    
    // Check parsed result (Rule1 matches 01 02 as 2 bytes)
    // Field1 = 0x01 = 1, Field2 = 0x02 = 2
    expect(screen.getByText('解析结果')).toBeInTheDocument();
    expect(screen.getByText('Test Protocol')).toBeInTheDocument();
    expect(screen.getByText('Field1')).toBeInTheDocument();
    expect(screen.getByText('Field2')).toBeInTheDocument();
  });

  it('copies message data to clipboard', async () => {
    render(<UdpDebugger />);
    
    // Find copy button (hidden by default, but exists in DOM)
    // Since opacity logic is CSS, we can still click it in JSDOM
    const copyButtons = screen.getAllByTitle('复制码流');
    expect(copyButtons.length).toBeGreaterThan(0);
    
    fireEvent.click(copyButtons[0]);
    
    expect(mockWriteText).toHaveBeenCalledWith('01 02');
  });
});
