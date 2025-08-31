import '@testing-library/jest-dom';

// Mock window.require for Electron-specific functionality
global.window.require = jest.fn();

// Mock IPC renderer
const mockIpcRenderer = {
  invoke: jest.fn(),
  on: jest.fn(),
  removeAllListeners: jest.fn()
};

global.window.require.mockImplementation(module => {
  if (module === 'electron') {
    return { ipcRenderer: mockIpcRenderer };
  }
  return {};
});

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Polyfill TextEncoder and TextDecoder for Node.js environment
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
