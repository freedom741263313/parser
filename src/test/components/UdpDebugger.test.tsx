import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UdpDebugger from '../../components/UdpDebugger';
import { ProtocolRule, PacketTemplate } from '../../types/rule';

// Mock hooks
const mockMessages = [
  { id: '1', timestamp: 1600000000000, direction: 'in', remoteAddress: '127.0.0.1', remotePort: 3000, data: '01 02' },
  { id: '2', timestamp: 1600000001000, direction: 'out', remoteAddress: '127.0.0.1', remotePort: 3000, data: 'AA BB' },
  { id: '3', timestamp: 1600000002000, direction: 'in', remoteAddress: '127.0.0.1', remotePort: 3000, data: '03 04' } // For feature matching test
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

const mockTemplates: PacketTemplate[] = [
  {
    id: 'temp1',
    name: 'Test Template',
    protocolId: 'rule1',
    values: {
      f1: '1', // 0x01
      f2: '2'  // 0x02
    }
  },
  {
    id: 'temp2',
    name: 'Feature Match Template',
    protocolId: 'rule1',
    values: {
      f1: '3', // 0x03
      f2: '4'  // 0x04
    },
    matchRanges: [
      { type: 'field', fieldId: 'f1' } // Match only based on Field1 (0x03)
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
    templates: mockTemplates,
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
    // We have multiple 'in' messages now
    expect(screen.getAllByText('接收').length).toBeGreaterThan(0);
    // There might be multiple "发送" (button and badge), so we check if at least one exists
    expect(screen.getAllByText('发送').length).toBeGreaterThan(0);
  });

  it('expands message row on click and shows parsed info (Full Match)', () => {
    render(<UdpDebugger />);
    
    // Click on the row to expand (First message matches temp1 fully)
    const row = screen.getByText('01 02').closest('tr');
    expect(row).toBeInTheDocument();
    fireEvent.click(row!);
    
    // Check for expanded content
    expect(screen.getByText('原始码流 (16字节/行)')).toBeInTheDocument();
    
    expect(screen.getByText('解析结果')).toBeInTheDocument();
    
    const resultHeader = screen.getByText('解析结果');
    const badge = resultHeader.nextElementSibling;
    expect(badge).toHaveTextContent('Test Template');

    expect(screen.getByText('Field1')).toBeInTheDocument();
    expect(screen.getByText('Field2')).toBeInTheDocument();
  });

  it('matches based on feature field (Match Ranges)', () => {
    render(<UdpDebugger />);
    
    // Third message: 03 04. Matches temp2 via matchRanges (Field1=0x03)
    const row = screen.getByText('03 04').closest('tr');
    expect(row).toBeInTheDocument();
    fireEvent.click(row!);
    
    const resultHeader = screen.getByText('解析结果');
    const badge = resultHeader.nextElementSibling;
    expect(badge).toHaveTextContent('Feature Match Template');
  });

  it('copies message data to clipboard', async () => {
    render(<UdpDebugger />);
    
    // Find copy button (hidden by default, but exists in DOM)
    const copyButtons = screen.getAllByTitle('复制码流');
    expect(copyButtons.length).toBeGreaterThan(0);
    
    fireEvent.click(copyButtons[0]);
    
    expect(mockWriteText).toHaveBeenCalledWith('01 02');
  });
});
