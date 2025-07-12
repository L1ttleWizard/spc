const React = require('react');
require('@testing-library/jest-dom');

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // Convert boolean attributes to strings to avoid React warnings
    const processedProps = { ...props };
    if (processedProps.priority !== undefined) {
      processedProps.priority = processedProps.priority.toString();
    }
    if (processedProps.loading !== undefined) {
      processedProps.loading = processedProps.loading.toString();
    }
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', { ...processedProps, alt: processedProps.alt || '' });
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => {
    return React.createElement('a', { href, ...props }, children);
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Suppress console errors for known issues
const originalError = console.error;
console.error = (...args) => {
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Warning: ReactDOM.render is no longer supported') ||
     message.includes('Warning: useLayoutEffect does nothing on the server') ||
     message.includes('Warning: An invalid form control with name') ||
     message.includes('Received `true` for a non-boolean attribute'))
  ) {
    return;
  }
  originalError.call(console, ...args);
}; 