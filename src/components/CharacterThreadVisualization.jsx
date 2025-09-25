import { useState, useEffect, useMemo } from 'react';
import CharacterAnalyzer from '../utils/characterAnalyzer';

// CHARACTER DETECTION SYSTEM:
// - Rule-based detection: Optimized for story characters, handles dialogue, actions, possessives
// - Enhanced place filtering: Excludes locations like "London", "Castle Rock", "The Forest", etc.
// - Comprehensive blacklists and smart deduplication

function CharacterThreadVisualization({
  chapters,
  characters,
  characterDetectionBlacklist = [],
  onUpdateCharacterDetectionBlacklist
}) {
  const [selectedCharacters, setSelectedCharacters] = useState(new Set());
  const [hoveredCharacter, setHoveredCharacter] = useState(null);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [excludedCharacters, setExcludedCharacters] = useState(
    new Set(characterDetectionBlacklist)
  );
  const [showExcluded, setShowExcluded] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [filterMentions, setFilterMentions] = useState(true); // New: toggle for presence filtering
  const [presenceThreshold, setPresenceThreshold] = useState(2.0); // New: adjustable threshold
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Handle window resize for responsive width
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Analyze character presence using rule-based detection
  const analysis = useMemo(() => {
    setIsAnalyzing(true);
    try {
      const result = CharacterAnalyzer.analyzeCharacterPresence(
        chapters,
        characters,
        characterDetectionBlacklist,
        filterMentions,
        presenceThreshold
      );
      setIsAnalyzing(false);
      return result;
    } catch (error) {
      setIsAnalyzing(false);
      console.error('Character analysis failed:', error);
      return { characterPresence: new Map(), allDetectedCharacters: [] };
    }
  }, [
    chapters,
    characters,
    characterDetectionBlacklist,
    filterMentions,
    presenceThreshold
  ]);

  const { characterPresence, _allDetectedCharacters } = analysis;

  // Get all scenes in order
  const allScenes = useMemo(() => {
    const scenes = [];
    chapters.forEach((chapter, chapterIndex) => {
      chapter.scenes.forEach((scene, sceneIndex) => {
        scenes.push({
          key: `${chapterIndex}-${sceneIndex}`,
          chapter: chapterIndex,
          scene: sceneIndex,
          chapterTitle: chapter.title,
          sceneTitle: scene.title,
          index: scenes.length
        });
      });
    });
    return scenes;
  }, [chapters]);

  // Filter characters based on selection and exclusions
  const visibleCharacters = useMemo(() => {
    const chars = Array.from(characterPresence.entries())
      .filter(([name, data]) => {
        // Don't show excluded characters (unless we're showing excluded ones)
        if (!showExcluded && excludedCharacters.has(name)) {
          return false;
        }
        if (showExcluded && !excludedCharacters.has(name)) {
          return false;
        }

        if (showOnlySelected && selectedCharacters.size > 0) {
          return selectedCharacters.has(name);
        }
        // Show characters that appear in scenes OR are from the formal character list
        return data.scenes.size > 0 || data.isFromCharacterList;
      })
      .sort(([_nameA, dataA], [_nameB, dataB]) => {
        // Sort by: formal characters first, then by frequency of appearances
        if (dataA.isFromCharacterList && !dataB.isFromCharacterList) return -1;
        if (!dataA.isFromCharacterList && dataB.isFromCharacterList) return 1;
        return dataB.scenes.size - dataA.scenes.size;
      });

    return chars;
  }, [
    characterPresence,
    selectedCharacters,
    showOnlySelected,
    excludedCharacters,
    showExcluded
  ]);

  // Generate colors for characters
  const characterColors = useMemo(() => {
    const colors = [
      '#2563eb',
      '#dc2626',
      '#059669',
      '#7c3aed',
      '#ea580c',
      '#0891b2',
      '#c2410c',
      '#9333ea',
      '#0d9488',
      '#b91c1c',
      '#4338ca',
      '#16a34a',
      '#ca8a04',
      '#be185d',
      '#0369a1'
    ];

    const colorMap = new Map();
    visibleCharacters.forEach(([name], index) => {
      colorMap.set(name, colors[index % colors.length]);
    });

    return colorMap;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCharacters, windowWidth]); // Include windowWidth for responsive recalculation

  // Calculate chapter title widths to determine minimum spacing needed
  const estimateTextWidth = (text, fontSize) => {
    // Rough estimation: average character width * font size * text length
    const avgCharWidth = fontSize * 0.6; // Approximation for most fonts
    return text.length * avgCharWidth;
  };

  const chapterTitles = chapters.map(chapter => chapter.title);
  const longestChapterTitle = chapterTitles.reduce(
    (longest, current) => (current.length > longest.length ? current : longest),
    ''
  );

  // Calculate minimum spacing needed for chapter titles
  const chapterTitleFontSize = 11;
  const longestTitleWidth = estimateTextWidth(
    longestChapterTitle,
    chapterTitleFontSize
  );
  const chapterTitlePadding = 20; // Extra padding around titles
  const minSpacingForChapters = longestTitleWidth + chapterTitlePadding;

  // Dynamic spacing constants that scale with content
  const minSceneSpacing = Math.max(40, minSpacingForChapters); // Increased minimum spacing to prevent overlap
  const leftMargin = 200; // Increased for longer character names
  const rightMargin = 50;
  const topMargin = 80; // Increased for chapter titles
  const bottomMargin = 50;

  // Calculate minimum character spacing to prevent text overlap
  const minCharacterSpacing = 25; // Minimum space between character names

  // SVG dimensions - ensure all content fits without overlap
  const availableWidth = Math.max(600, windowWidth - 200); // Increased minimum width
  const requiredSceneWidth =
    allScenes.length > 1
      ? (allScenes.length - 1) * minSceneSpacing
      : minSceneSpacing;
  const actualScenesWidth = leftMargin + requiredSceneWidth + rightMargin;
  const width = Math.max(actualScenesWidth, availableWidth);

  // Height should accommodate all characters without cramping
  const requiredCharacterHeight = Math.max(
    visibleCharacters.length * minCharacterSpacing,
    300
  );
  const height = topMargin + requiredCharacterHeight + bottomMargin;

  const plotWidth = width - leftMargin - rightMargin;
  const plotHeight = height - topMargin - bottomMargin;

  // Calculate scene spacing - prioritize readability over compactness and accommodate chapter titles
  const calculatedSpacing =
    allScenes.length > 1
      ? Math.max(minSceneSpacing, plotWidth / Math.max(allScenes.length - 1, 1))
      : plotWidth / 2;
  const sceneSpacing = Math.max(minSceneSpacing, calculatedSpacing);

  // Character spacing - ensure adequate space for text
  const characterSpacing =
    visibleCharacters.length > 1
      ? Math.max(
          minCharacterSpacing,
          plotHeight / (visibleCharacters.length - 1)
        )
      : plotHeight / 2;

  const toggleCharacterSelection = characterName => {
    const newSelection = new Set(selectedCharacters);
    if (newSelection.has(characterName)) {
      newSelection.delete(characterName);
    } else {
      newSelection.add(characterName);
    }
    setSelectedCharacters(newSelection);
  };

  const clearSelection = () => {
    setSelectedCharacters(new Set());
  };

  const toggleCharacterExclusion = characterName => {
    const newExcluded = new Set(excludedCharacters);
    if (newExcluded.has(characterName)) {
      newExcluded.delete(characterName);
    } else {
      newExcluded.add(characterName);
      // Also remove from selection if excluded
      const newSelection = new Set(selectedCharacters);
      newSelection.delete(characterName);
      setSelectedCharacters(newSelection);
    }
    setExcludedCharacters(newExcluded);

    // Persist to parent component and book data
    if (onUpdateCharacterDetectionBlacklist) {
      onUpdateCharacterDetectionBlacklist(Array.from(newExcluded));
    }
  };

  const clearExclusions = () => {
    setExcludedCharacters(new Set());
    // Persist to parent component and book data
    if (onUpdateCharacterDetectionBlacklist) {
      onUpdateCharacterDetectionBlacklist([]);
    }
  };

  if (visibleCharacters.length === 0) {
    return (
      <div className="threads-editor">
        <div className="no-content-selected">
          <h3>No Characters Detected</h3>
          <p>
            Write scenes with characters or add characters to your character list to start tracking their story threads and visualize how they appear throughout your story.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="threads-editor">
      <div className="threads-header">
        <div className="threads-title-section">
          <h2>Character Thread Analysis</h2>
          <p className="threads-description">
            Visualize character presence and interactions across scenes. Track when characters appear, disappear, and how their story threads weave together.
          </p>
        </div>
      </div>
      <div className="threads-content">
        {/* Controls */}
        <div className="threads-controls">
          <button
            onClick={() => setShowOnlySelected(!showOnlySelected)}
            className={`threads-btn ${showOnlySelected ? 'primary' : ''}`}
          >
            {showOnlySelected ? 'Show All' : 'Show Selected Only'}
          </button>

          {selectedCharacters.size > 0 && (
            <button
              onClick={clearSelection}
              className="threads-btn danger"
            >
              Clear Selection ({selectedCharacters.size})
            </button>
          )}

          {excludedCharacters.size > 0 && (
            <button
              onClick={() => setShowExcluded(!showExcluded)}
              className={`threads-btn ${showExcluded ? 'danger' : ''}`}
            >
              {showExcluded
                ? `Hide Excluded (${excludedCharacters.size})`
                : `Show Excluded (${excludedCharacters.size})`}
            </button>
          )}

          {excludedCharacters.size > 0 && (
            <button
              onClick={clearExclusions}
              className="threads-btn success"
            >
              Restore All
            </button>
          )}

          <div className="threads-filters">
            <label className="threads-filter-label">
              <input
                type="checkbox"
                checked={filterMentions}
                onChange={e => setFilterMentions(e.target.checked)}
                className="threads-filter-input"
              />
              <span title="Filter out characters who are only mentioned vs actually present">
                Filter mentions
              </span>
            </label>
            {filterMentions && (
              <div className="threads-threshold-control">
                <span>Threshold:</span>
                <input
                  type="range"
                  min="1.0"
                  max="5.0"
                  step="0.5"
                  value={presenceThreshold}
                  onChange={e =>
                    setPresenceThreshold(parseFloat(e.target.value))
                  }
                  style={{ width: '60px' }}
                  title={`Presence threshold: ${presenceThreshold} (higher = stricter filtering)`}
                />
                <span className="threads-threshold-value">
                  {presenceThreshold}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable visualization area */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            border: '1px solid var(--color-border, #e5e7eb)',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--color-surface-alt, #fafafa)',
            minHeight: '400px',
            position: 'relative'
          }}
        >
          {isAnalyzing && (
            <div className="loading-overlay">
              <div className="loading-content">
                <div className="loading-spinner large" />
                <span>Analyzing character presence...</span>
              </div>
            </div>
          )}
          <svg
            width={width}
            height={height}
            style={{
              display: 'block',
              minWidth: '600px' // Ensure minimum width for readability
            }}
          >
            {/* Background */}
            <rect
              width={width}
              height={height}
              fill="var(--color-surface-alt, #fafafa)"
            />

            {/* Scene columns background */}
            {allScenes.map((scene, index) => {
              const x = leftMargin + index * sceneSpacing;
              return (
                <rect
                  key={scene.key}
                  x={x - 15}
                  y={topMargin}
                  width={30}
                  height={plotHeight}
                  fill={
                    index % 2 === 0
                      ? 'var(--color-surface, #ffffff)'
                      : 'var(--color-surface-alt, #f8f9fa)'
                  }
                  opacity={0.7}
                />
              );
            })}

            {/* Character thread lines */}
            {visibleCharacters.map(([characterName, data], charIndex) => {
              const y = topMargin + charIndex * characterSpacing;
              const color = characterColors.get(characterName);
              const isSelected = selectedCharacters.has(characterName);
              const isHovered = hoveredCharacter === characterName;
              const opacity =
                selectedCharacters.size === 0 || isSelected ? 1 : 0.3;
              const strokeWidth =
                isSelected || isHovered
                  ? 3
                  : Math.max(1, Math.min(4, data.scenes.size));

              // Get scene positions for this character
              const scenePositions = [];
              allScenes.forEach((scene, sceneIndex) => {
                if (data.scenes.has(scene.key)) {
                  scenePositions.push({
                    x: leftMargin + sceneIndex * sceneSpacing,
                    sceneKey: scene.key,
                    strength: data.scenes.get(scene.key).strength
                  });
                }
              });

              // Draw connecting lines between appearances
              const lines = [];
              for (let i = 0; i < scenePositions.length - 1; i++) {
                const x1 = scenePositions[i].x;
                const x2 = scenePositions[i + 1].x;

                lines.push(
                  <line
                    key={`${characterName}-line-${i}`}
                    x1={x1}
                    y1={y}
                    x2={x2}
                    y2={y}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    strokeLinecap="round"
                  />
                );
              }

              return lines;
            })}

            {/* Character appearance dots */}
            {visibleCharacters.map(([characterName, data], charIndex) => {
              const y = topMargin + charIndex * characterSpacing;
              const color = characterColors.get(characterName);
              const isSelected = selectedCharacters.has(characterName);
              const isHovered = hoveredCharacter === characterName;
              const opacity =
                selectedCharacters.size === 0 || isSelected ? 1 : 0.3;

              return allScenes.map((scene, sceneIndex) => {
                if (!data.scenes.has(scene.key)) return null;

                const x = leftMargin + sceneIndex * sceneSpacing;
                const sceneData = data.scenes.get(scene.key);
                const dotSize = Math.max(
                  3,
                  Math.min(8, sceneData.strength * 2)
                );

                return (
                  <circle
                    key={`${characterName}-dot-${scene.key}`}
                    cx={x}
                    cy={y}
                    r={dotSize}
                    fill={color}
                    opacity={opacity}
                    stroke={
                      isSelected || isHovered
                        ? 'var(--color-text-inverse)'
                        : color
                    }
                    strokeWidth={isSelected || isHovered ? 2 : 1}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredCharacter(characterName)}
                    onMouseLeave={() => setHoveredCharacter(null)}
                  >
                    <title>{`${characterName} in ${scene.chapterTitle} - ${scene.sceneTitle}\nStrength: ${sceneData.strength}`}</title>
                  </circle>
                );
              });
            })}

            {/* Character labels */}
            {visibleCharacters.map(([characterName, data], charIndex) => {
              const y = topMargin + charIndex * characterSpacing;
              const color = characterColors.get(characterName);
              const isSelected = selectedCharacters.has(characterName);
              const isHovered = hoveredCharacter === characterName;
              const isFromList = data.isFromCharacterList;
              const opacity =
                selectedCharacters.size === 0 || isSelected ? 1 : 0.6;

              return (
                <g key={`${characterName}-label`}>
                  <text
                    x={leftMargin - 15}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="13"
                    fill={color}
                    opacity={opacity}
                    fontWeight={
                      isSelected || isHovered
                        ? 'bold'
                        : isFromList
                          ? '600'
                          : 'normal'
                    }
                    style={{
                      cursor: 'pointer',
                      maxWidth: `${leftMargin - 30}px`,
                      userSelect: 'none'
                    }}
                    onClick={() => toggleCharacterSelection(characterName)}
                    onMouseEnter={() => setHoveredCharacter(characterName)}
                    onMouseLeave={() => setHoveredCharacter(null)}
                  >
                    {isFromList ? '✓' : ''} {characterName} ({data.scenes.size})
                  </text>

                  {/* Exclude button */}
                  <text
                    x={leftMargin - 180}
                    y={y + 4}
                    textAnchor="middle"
                    fontSize="12"
                    fill="var(--color-error)"
                    opacity={isHovered ? 1 : 0.6}
                    style={{
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                    onClick={() => toggleCharacterExclusion(characterName)}
                    onMouseEnter={() => setHoveredCharacter(characterName)}
                    onMouseLeave={() => setHoveredCharacter(null)}
                  >
                    ✕
                  </text>
                </g>
              );
            })}

            {/* Scene labels */}
            {allScenes.map((scene, index) => {
              const x = leftMargin + index * sceneSpacing;

              // Helper function to truncate text if too long
              const truncateText = (text, maxLength) => {
                if (text.length <= maxLength) return text;
                return text.substring(0, maxLength - 3) + '...';
              };

              // Calculate max characters that can fit in the available space
              const maxCharsForTitle = Math.floor(
                sceneSpacing / (chapterTitleFontSize * 0.6)
              );
              const displayTitle = truncateText(
                scene.chapterTitle,
                maxCharsForTitle
              );

              return (
                <g key={`scene-label-${scene.key}`}>
                  {/* Chapter title (only on first scene of chapter) */}
                  {(index === 0 ||
                    allScenes[index - 1].chapterTitle !==
                      scene.chapterTitle) && (
                    <text
                      x={x}
                      y={topMargin - 45}
                      textAnchor="middle"
                      fontSize={chapterTitleFontSize}
                      fontWeight="bold"
                      fill="var(--color-text)"
                      style={{ userSelect: 'none' }}
                    >
                      <title>{scene.chapterTitle}</title>
                      {displayTitle}
                    </text>
                  )}

                  {/* Scene separator line */}
                  <line
                    x1={x}
                    y1={topMargin}
                    x2={x}
                    y2={height - bottomMargin}
                    stroke="var(--color-border, #e5e7eb)"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Footer info */}
        <div
          style={{
            marginTop: '1rem',
            fontSize: '0.9em',
            color: 'var(--color-text-secondary)',
            flexShrink: 0
          }}
        >
          <p style={{ margin: 0 }}>
            <strong>Usage:</strong> Click character names to select/highlight.
            Thread thickness shows appearance frequency. Hover for scene
            details. Use ✕ to permanently exclude false positives.
            {filterMentions &&
              ' Filtering enabled to show only active scene participants.'}
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8em' }}>
            <strong>Stats:</strong> {visibleCharacters.length} characters,{' '}
            {allScenes.length} scenes
            {allScenes.length > 10 &&
              ' • Compact layout optimized for long books'}
            {filterMentions && ` • Presence threshold: ${presenceThreshold}`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CharacterThreadVisualization;
