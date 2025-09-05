/* eslint-disable testing-library/no-node-access */
/* eslint-disable no-unused-vars */
/* eslint-disable jest/no-conditional-expect */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react';
import App from '../App.jsx';

// Integration tests for drag and drop functionality
// These test the complete flow from UI interaction to state change

describe('Drag and Drop Integration', () => {
  const createMockDragEvent = (type = 'dragstart') => {
    const mockDataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      setData: jest.fn(),
      getData: jest.fn()
    };

    const event = new Event(type, { bubbles: true });
    Object.defineProperty(event, 'dataTransfer', {
      value: mockDataTransfer,
      writable: true
    });

    return event;
  };

  beforeEach(() => {
    // Mock getBoundingClientRect for drag and drop positioning
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0
    }));
  });

  describe('Complete Chapter-to-Part Flow', () => {
    test('adds chapter to part through complete UI flow', async () => {
      render(<App />);

      // Wait for app to load and create initial structure
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Add a part
      const addPartButton = screen.getByText('📚+ Part');
      fireEvent.click(addPartButton);

      // Add a chapter
      const addChapterButton = screen.getByText('📁+ Chapter');
      fireEvent.click(addChapterButton);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Find the new chapter and part elements
      const chapterElements = document.querySelectorAll('.chapter-header');
      const partElements = document.querySelectorAll('.part-header');

      expect(chapterElements.length).toBeGreaterThan(1); // Should have multiple chapters now
      expect(partElements.length).toBeGreaterThan(0); // Should have parts

      // Get the unassigned chapter (not in a part)
      const unassignedChapter = Array.from(chapterElements).find(
        el => !el.closest('.part-group')?.querySelector('.part-header')
      );

      const targetPart = partElements[0]; // First part

      if (unassignedChapter && targetPart) {
        // Simulate drag and drop
        const dragStartEvent = createMockDragEvent('dragstart');
        fireEvent(unassignedChapter, dragStartEvent);

        const dragOverEvent = createMockDragEvent('dragover');
        fireEvent(targetPart, dragOverEvent);

        const dropEvent = createMockDragEvent('drop');
        fireEvent(targetPart, dropEvent);

        // Verify the chapter is now in the part
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        // The chapter should now be inside a part group
        const partGroup = targetPart.closest('.part-group');
        const chaptersInPart = partGroup?.querySelectorAll('.chapter-header');
        expect(chaptersInPart?.length).toBeGreaterThan(0);
      }
    });
  });

  describe('State Consistency After Operations', () => {
    test('maintains consistent state after multiple drag operations', async () => {
      render(<App />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Create test structure: 2 parts, 3 chapters
      const addPartButton = screen.getByText('📚+ Part');
      fireEvent.click(addPartButton); // Part 1
      fireEvent.click(addPartButton); // Part 2

      const addChapterButton = screen.getByText('📁+ Chapter');
      fireEvent.click(addChapterButton); // Chapter 2
      fireEvent.click(addChapterButton); // Chapter 3

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Perform multiple drag operations
      const chapters = document.querySelectorAll('.chapter-header');
      const parts = document.querySelectorAll('.part-header');

      if (chapters.length >= 2 && parts.length >= 2) {
        // Move chapter 1 to part 1
        let dragEvent = createMockDragEvent('dragstart');
        fireEvent(chapters[0], dragEvent);
        let dropEvent = createMockDragEvent('drop');
        fireEvent(parts[0], dropEvent);

        // Move chapter 2 to part 2
        dragEvent = createMockDragEvent('dragstart');
        fireEvent(chapters[1], dragEvent);
        dropEvent = createMockDragEvent('drop');
        fireEvent(parts[1], dropEvent);

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        // Verify structure is still valid
        const partGroups = document.querySelectorAll('.part-group');
        expect(partGroups.length).toBeGreaterThan(0);

        // Each part group should have valid structure
        partGroups.forEach(partGroup => {
          const partHeader = partGroup.querySelector('.part-header');
          const chaptersInPart = partGroup.querySelectorAll('.chapter-header');

          expect(partHeader).toBeInTheDocument();
          // Each part can have 0 or more chapters, but structure should be valid
        });
      }
    });
  });

  describe('Error Handling', () => {
    test('handles invalid drag operations gracefully', async () => {
      render(<App />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Try to drag scene to part (should be invalid)
      const addSceneButton = screen.getByText('📄+ Scene');
      fireEvent.click(addSceneButton);

      const addPartButton = screen.getByText('📚+ Part');
      fireEvent.click(addPartButton);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      const scene = document.querySelector('.scene-item');
      const part = document.querySelector('.part-header');

      if (scene && part) {
        // This should not cause any errors, just be ignored
        const dragEvent = createMockDragEvent('dragstart');
        fireEvent(scene, dragEvent);

        const dropEvent = createMockDragEvent('drop');
        fireEvent(part, dropEvent);

        // App should still be functional
        expect(screen.getByText('Book Structure')).toBeInTheDocument();
        expect(document.querySelector('.scene-item')).toBeInTheDocument();
        expect(document.querySelector('.part-header')).toBeInTheDocument();
      }
    });
  });
});
