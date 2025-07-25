// Temporary debug script to see what App renders
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './src/App';

// Mock all the dependencies like in the test
jest.mock('./src/components/BookStructure', () => {
  return function MockedBookStructure({ activeTab }) {
    return (
      <div data-testid="book-structure">
        <div>Active Tab: {activeTab}</div>
      </div>
    );
  };
});

jest.mock('./src/components/SceneEditor', () => {
  return function MockedSceneEditor() {
    return <div data-testid="scene-editor">Scene Editor</div>;
  };
});

jest.mock('./src/components/CharacterEditor', () => {
  return function MockedCharacterEditor() {
    return <div data-testid="character-editor">Character Editor</div>;
  };
});

jest.mock('./src/components/CharacterThreadVisualization', () => {
  return function MockedCharacterThreadVisualization() {
    return <div data-testid="character-thread-visualization">Thread View</div>;
  };
});

jest.mock('./src/components/StatusBar', () => {
  return function MockedStatusBar() {
    return <div data-testid="status-bar">Status: Saved</div>;
  };
});

// Mock other components as needed
jest.mock('./src/utils/fileOperations', () => ({
  saveBook: jest.fn(),
  saveBookToFile: jest.fn(),
  loadBook: jest.fn()
}));

jest.mock('./src/utils/fontManager', () => ({
  initializeFontSystem: jest.fn()
}));

describe('Debug App Render', () => {
  test('debug what app renders', () => {
    global.window.require = jest.fn();
    
    render(<App />);
    
    // Print out all text content
    console.log('All rendered text:', screen.getByRole('main').textContent);
    
    // Try to find specific elements
    try {
      const noSceneElement = screen.getByText('No Scene Selected');
      console.log('Found No Scene Selected element:', noSceneElement);
    } catch (e) {
      console.log('No Scene Selected not found:', e.message);
    }
    
    // Check what's actually rendered
    screen.debug();
  });
});
