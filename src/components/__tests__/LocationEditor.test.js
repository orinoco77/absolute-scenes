/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-wait-for-side-effects */
/* eslint-disable testing-library/no-wait-for-multiple-assertions */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LocationEditor from '../LocationEditor';

const mockLocation = {
  id: 'location-1',
  name: 'Mystic Library',
  description: 'A vast library filled with ancient tomes and magical scrolls.',
  type: 'Fantasy Location',
  icon: '📚',
  geography: 'Mountain valley',
  climate: 'Cool and misty',
  features: 'Floating books, enchanted shelves',
  significance: 'Repository of ancient knowledge',
  notes: 'Important for the research subplot.',
  created: '2024-01-01T00:00:00.000Z',
  modified: '2024-01-01T12:00:00.000Z'
};

const mockTemplate = {
  fontFamily: 'Georgia',
  fontSize: 14,
  lineHeight: 1.8
};

const mockFunctions = {
  onLocationUpdate: jest.fn()
};

const renderComponent = (props = {}) =>
  render(
    <LocationEditor
      location={mockLocation}
      template={mockTemplate}
      {...mockFunctions}
      {...props}
    />
  );

describe('LocationEditor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with location data', () => {
    renderComponent();

    expect(screen.getByDisplayValue('Mystic Library')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        'A vast library filled with ancient tomes and magical scrolls.'
      )
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('Fantasy Location')).toBeInTheDocument();
    expect(screen.getByText('📚')).toBeInTheDocument();
  });

  test('displays correct word count', () => {
    renderComponent();

    // "A vast library filled with ancient tomes and magical scrolls." = 10 words
    expect(screen.getByText('10 words')).toBeInTheDocument();
  });

  test('updates location name when user types', () => {
    renderComponent();

    const nameInput = screen.getByDisplayValue('Mystic Library');
    fireEvent.change(nameInput, { target: { value: 'Ancient Archive' } });

    expect(mockFunctions.onLocationUpdate).toHaveBeenCalledWith('location-1', {
      name: 'Ancient Archive'
    });
  });

  test('updates location type when user selects', () => {
    renderComponent();

    const typeSelect = screen.getByDisplayValue('Fantasy Location');
    fireEvent.change(typeSelect, { target: { value: 'Building' } });

    expect(mockFunctions.onLocationUpdate).toHaveBeenCalledWith('location-1', {
      type: 'Building'
    });
  });

  test('updates description when user types', () => {
    renderComponent();

    const descriptionTextarea = screen.getByDisplayValue(
      'A vast library filled with ancient tomes and magical scrolls.'
    );
    fireEvent.change(descriptionTextarea, {
      target: { value: 'Updated description with more details.' }
    });

    expect(mockFunctions.onLocationUpdate).toHaveBeenCalledWith('location-1', {
      description: 'Updated description with more details.'
    });
  });

  test('updates geography field', () => {
    renderComponent();

    const geographyInput = screen.getByDisplayValue('Mountain valley');
    fireEvent.change(geographyInput, { target: { value: 'Coastal region' } });

    expect(mockFunctions.onLocationUpdate).toHaveBeenCalledWith('location-1', {
      geography: 'Coastal region'
    });
  });

  test('updates climate field', () => {
    renderComponent();

    const climateInput = screen.getByDisplayValue('Cool and misty');
    fireEvent.change(climateInput, { target: { value: 'Warm and sunny' } });

    expect(mockFunctions.onLocationUpdate).toHaveBeenCalledWith('location-1', {
      climate: 'Warm and sunny'
    });
  });

  test('updates features field', () => {
    renderComponent();

    const featuresInput = screen.getByDisplayValue(
      'Floating books, enchanted shelves'
    );
    fireEvent.change(featuresInput, {
      target: { value: 'Stone walls, hidden passages' }
    });

    expect(mockFunctions.onLocationUpdate).toHaveBeenCalledWith('location-1', {
      features: 'Stone walls, hidden passages'
    });
  });

  test('updates significance field', () => {
    renderComponent();

    const significanceInput = screen.getByDisplayValue(
      'Repository of ancient knowledge'
    );
    fireEvent.change(significanceInput, {
      target: { value: 'Meeting place for heroes' }
    });

    expect(mockFunctions.onLocationUpdate).toHaveBeenCalledWith('location-1', {
      significance: 'Meeting place for heroes'
    });
  });

  test('updates notes field', () => {
    renderComponent();

    const notesTextarea = screen.getByDisplayValue(
      'Important for the research subplot.'
    );
    fireEvent.change(notesTextarea, {
      target: { value: 'Updated notes here.' }
    });

    expect(mockFunctions.onLocationUpdate).toHaveBeenCalledWith('location-1', {
      notes: 'Updated notes here.'
    });
  });

  test('main description textarea uses consistent CSS styling (no inline fonts)', () => {
    renderComponent();

    const descriptionTextarea = screen.getByDisplayValue(
      'A vast library filled with ancient tomes and magical scrolls.'
    );

    // Should NOT have inline font styles (for consistency with other editors)
    expect(descriptionTextarea).not.toHaveStyle({
      fontFamily: 'Georgia'
    });

    // Should use the scene-editor-textarea class for font consistency
    expect(
      descriptionTextarea.closest('.scene-editor-textarea')
    ).toBeInTheDocument();
  });

  test('shows icon dropdown when current icon is clicked', async () => {
    renderComponent();

    const currentIcon = screen.getByText('📚');
    fireEvent.click(currentIcon);

    // Should show the icon dropdown
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '📍' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '🏠' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '🏰' })).toBeInTheDocument();
    });
  });

  test('updates icon when new icon is selected', async () => {
    renderComponent();

    const currentIcon = screen.getByText('📚');
    fireEvent.click(currentIcon);

    await waitFor(() => {
      const castleIcon = screen.getByRole('button', { name: '🏰' });
      fireEvent.click(castleIcon);

      expect(mockFunctions.onLocationUpdate).toHaveBeenCalledWith(
        'location-1',
        {
          icon: '🏰'
        }
      );
    });
  });

  test('closes icon dropdown after selecting icon', async () => {
    renderComponent();

    const currentIcon = screen.getByText('📚');
    fireEvent.click(currentIcon);

    await waitFor(() => {
      const castleIcon = screen.getByRole('button', { name: '🏰' });
      fireEvent.click(castleIcon);

      // Dropdown should be closed
      expect(
        screen.queryByRole('button', { name: '📍' })
      ).not.toBeInTheDocument();
    });
  });

  test('renders all location type options', () => {
    renderComponent();

    const __typeSelect = screen.getByDisplayValue('Fantasy Location');

    // Check that various options are available
    expect(screen.getByRole('option', { name: 'General' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'City/Town' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Building' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Fantasy Location' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Historical Site' })
    ).toBeInTheDocument();
  });

  test('shows helpful placeholder text for description', () => {
    const emptyLocation = {
      ...mockLocation,
      description: ''
    };

    renderComponent({ location: emptyLocation });

    const descriptionTextarea = screen.getByPlaceholderText(
      /Describe this location in detail/
    );
    expect(descriptionTextarea).toBeInTheDocument();
    expect(descriptionTextarea.placeholder).toContain(
      'What does it look like?'
    );
    expect(descriptionTextarea.placeholder).toContain("What's the atmosphere?");
  });

  test('shows helpful placeholder text for detail fields', () => {
    const emptyLocation = {
      ...mockLocation,
      geography: '',
      climate: '',
      features: '',
      significance: ''
    };

    renderComponent({ location: emptyLocation });

    expect(
      screen.getByPlaceholderText(/Urban downtown, Rural countryside/)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Temperate, Hot and humid/)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Stone walls, Large windows/)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Meeting place, Character's home/)
    ).toBeInTheDocument();
  });

  test('shows helpful placeholder text for notes', () => {
    const emptyLocation = {
      ...mockLocation,
      notes: ''
    };

    renderComponent({ location: emptyLocation });

    expect(
      screen.getByPlaceholderText(/Additional notes, research, or ideas/)
    ).toBeInTheDocument();
  });

  test('renders section labels correctly', () => {
    renderComponent();

    expect(screen.getByText('📝 Description')).toBeInTheDocument();
    expect(screen.getByText('Geography & Setting')).toBeInTheDocument();
    expect(screen.getByText('Climate & Weather')).toBeInTheDocument();
    expect(screen.getByText('Key Features')).toBeInTheDocument();
    expect(screen.getByText('Significance to Story')).toBeInTheDocument();
    expect(screen.getByText('Additional Notes')).toBeInTheDocument();
  });

  test('calculates word count correctly for empty description', () => {
    const emptyLocation = {
      ...mockLocation,
      description: ''
    };

    renderComponent({ location: emptyLocation });

    expect(screen.getByText('0 words')).toBeInTheDocument();
  });

  test('handles missing optional fields gracefully', () => {
    const minimalLocation = {
      id: 'location-1',
      name: 'Simple Place',
      created: '2024-01-01T00:00:00.000Z',
      modified: '2024-01-01T12:00:00.000Z'
    };

    renderComponent({ location: minimalLocation });

    expect(screen.getByDisplayValue('Simple Place')).toBeInTheDocument();
    expect(screen.getByText('📍')).toBeInTheDocument(); // Default icon
    expect(screen.getByDisplayValue('General')).toBeInTheDocument(); // Default type
  });

  test('template parameter is marked as unused (no inline styling)', () => {
    // This test verifies that the template parameter is not used for inline styling
    // and that the component relies on CSS classes instead
    renderComponent();

    const descriptionTextarea = screen.getByDisplayValue(
      'A vast library filled with ancient tomes and magical scrolls.'
    );

    // Should use CSS class, not inline styles
    expect(
      descriptionTextarea.closest('.scene-editor-textarea')
    ).toBeInTheDocument();

    // Should not have template-based inline styles
    const __computedStyle = window.getComputedStyle(descriptionTextarea);
    expect(descriptionTextarea.style.fontFamily).toBe('');
    expect(descriptionTextarea.style.fontSize).toBe('');
    expect(descriptionTextarea.style.lineHeight).toBe('');
  });
});
