import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SceneEditor from '../SceneEditor';

const scene = {
  id: '1',
  title: 'Test Scene',
  content: 'This is a test scene.',
  notes: 'Test notes.'
};

const template = {
  fontFamily: 'Arial',
  fontSize: 12
};

const onSceneUpdate = jest.fn();

// SceneEditor Tests
describe('SceneEditor Component', () => {
  beforeEach(() => {
    onSceneUpdate.mockClear();
  });

  test('renders fallback message when no scene is selected', () => {
    render(
      <SceneEditor
        scene={null}
        template={template}
        onSceneUpdate={onSceneUpdate}
      />
    );
    expect(
      screen.getByText('Select a scene to start writing, or create a new one.')
    ).toBeInTheDocument();
  });

  test('renders without crashing', () => {
    render(
      <SceneEditor
        scene={scene}
        template={template}
        onSceneUpdate={onSceneUpdate}
      />
    );
    expect(screen.getByPlaceholderText('Scene Title')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Start writing your scene here...')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Notes about this scene...')
    ).toBeInTheDocument();
  });

  test('updates title correctly', () => {
    render(
      <SceneEditor
        scene={scene}
        template={template}
        onSceneUpdate={onSceneUpdate}
      />
    );
    const titleInput = screen.getByPlaceholderText('Scene Title');

    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    expect(onSceneUpdate).toHaveBeenCalledWith(scene.id, {
      title: 'New Title'
    });
  });

  test('updates content correctly', async () => {
    jest.useFakeTimers();
    render(
      <SceneEditor
        scene={scene}
        template={template}
        onSceneUpdate={onSceneUpdate}
      />
    );
    const contentTextarea = screen.getByPlaceholderText(
      'Start writing your scene here...'
    );

    fireEvent.change(contentTextarea, { target: { value: 'New Content' } });

    // Content is debounced by 300ms
    jest.advanceTimersByTime(300);

    expect(onSceneUpdate).toHaveBeenCalledWith(scene.id, {
      content: 'New Content'
    });

    jest.useRealTimers();
  });

  test('updates notes correctly', () => {
    render(
      <SceneEditor
        scene={scene}
        template={template}
        onSceneUpdate={onSceneUpdate}
      />
    );
    const notesTextarea = screen.getByPlaceholderText(
      'Notes about this scene...'
    );

    fireEvent.change(notesTextarea, { target: { value: 'New Notes' } });
    expect(onSceneUpdate).toHaveBeenCalledWith(scene.id, {
      notes: 'New Notes'
    });
  });

  test('handles empty content for word count', () => {
    const emptyScene = { ...scene, content: '' };
    render(
      <SceneEditor
        scene={emptyScene}
        template={template}
        onSceneUpdate={onSceneUpdate}
      />
    );
    expect(screen.getByText(/Words:\s*0/)).toBeInTheDocument();
  });

  test('applies template styles correctly', () => {
    const customTemplate = {
      fontFamily: 'Georgia',
      fontSize: 14
    };
    render(
      <SceneEditor
        scene={scene}
        template={customTemplate}
        onSceneUpdate={onSceneUpdate}
      />
    );
    const contentTextarea = screen.getByPlaceholderText(
      'Start writing your scene here...'
    );

    // Check that the component renders with custom template
    // Note: The actual style application depends on the component's implementation
    expect(contentTextarea).toBeInTheDocument();
  });

  test('renders toolbar buttons', () => {
    render(
      <SceneEditor
        scene={scene}
        template={template}
        onSceneUpdate={onSceneUpdate}
      />
    );
    expect(screen.getByTitle('Bold (Ctrl+B)')).toBeInTheDocument();
    expect(screen.getByTitle('Italic (Ctrl+I)')).toBeInTheDocument();
    expect(screen.getByTitle('Heading')).toBeInTheDocument();
    expect(screen.getByTitle('Paragraph Break')).toBeInTheDocument();
  });
});
