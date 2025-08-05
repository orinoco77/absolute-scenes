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

  // Handle window resize for responsive width
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Analyze character presence using rule-based detection
  const analysis = useMemo(() => {
    return CharacterAnalyzer.analyzeCharacterPresence(
      chapters,
      characters,
      characterDetectionBlacklist,
      filterMentions,
      presenceThreshold
    );
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

  // Spacing constants for compact layout
  const maxSceneSpacing = 60; // Maximum spacing between scenes
  const minSceneSpacing = 25; // Minimum spacing to maintain readability
  const leftMargin = 180;
  const rightMargin = 50;
  const topMargin = 60;
  const bottomMargin = 50;

  // SVG dimensions - fit content precisely to avoid unnecessary scrollbars
  const availableWidth = Math.max(400, windowWidth - 300); // Account for sidebar and padding
  const actualScenesWidth =
    allScenes.length > 1
      ? (allScenes.length - 1) *
          Math.max(minSceneSpacing, Math.min(maxSceneSpacing, 50)) +
        leftMargin +
        rightMargin +
        20
      : leftMargin + rightMargin + 150; // Fallback width for 0-1 scenes
  const width = Math.min(actualScenesWidth, availableWidth); // Fit within available space
  const baseHeight = Math.min(
    600,
    Math.max(400, visibleCharacters.length * 30 + 120)
  );
  const height = baseHeight;

  const plotWidth = width - leftMargin - rightMargin;
  const plotHeight = height - topMargin - bottomMargin;

  // Calculate positions with compact scene spacing
  const calculatedSpacing =
    allScenes.length > 1
      ? Math.min(maxSceneSpacing, plotWidth / Math.max(allScenes.length - 1, 1))
      : plotWidth / 2;
  const sceneSpacing = Math.max(minSceneSpacing, calculatedSpacing);

  const characterSpacing =
    visibleCharacters.length > 1
      ? plotHeight / (visibleCharacters.length - 1)
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
      <div
        className="character-threads"
        style={{
          padding: '2rem',
          textAlign: 'center',
          height: '100%',
          maxHeight: '800px',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <h3>Character Thread Analysis</h3>
        <div
          style={{
            backgroundColor: '#f9fafb',
            border: '2px dashed #d1d5db',
            borderRadius: '0.5rem',
            padding: '2rem',
            maxWidth: '500px',
            margin: '0 auto'
          }}
        >
          <p
            style={{
              margin: '0 0 1rem 0',
              fontSize: '1.1em',
              color: '#374151'
            }}
          >
            No characters detected yet.
          </p>
          <div
            style={{ fontSize: '0.9em', color: '#6b7280', textAlign: 'left' }}
          >
            <p>
              <strong>To get character detection working:</strong>
            </p>
            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
              <li>
                <strong>Add characters to your character list</strong> - they'll
                appear here immediately
              </li>
              <li>
                <strong>Write character dialogue:</strong> "Hello," John said.
              </li>
              <li>
                <strong>Write character actions:</strong> Dave walked in, Sarah
                looked around
              </li>
              <li>
                <strong>Use possessive forms:</strong> Mary's house, Tom's idea
              </li>
              <li>
                <strong>Names mentioned 3+ times</strong> in a scene are
                auto-detected
              </li>
            </ul>
            <p
              style={{
                marginTop: '1rem',
                fontSize: '0.8em',
                fontStyle: 'italic'
              }}
            >
              💡 The system automatically excludes locations like "London" or
              "Castle Rock"
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="character-threads"
      style={{
        padding: '1.5rem',
        height: '100%',
        maxHeight: '800px', // Constrain height to enable scrolling
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <h3 style={{ margin: '0 0 1rem 0', flexShrink: 0 }}>
        Character Thread Analysis
      </h3>

      {/* Controls */}
      <div
        style={{
          marginBottom: '1rem',
          flexShrink: 0,
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          fontSize: '0.9em'
        }}
      >
        <button
          onClick={() => setShowOnlySelected(!showOnlySelected)}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.8rem',
            backgroundColor: showOnlySelected ? '#2563eb' : '#f3f4f6',
            color: showOnlySelected ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          {showOnlySelected ? 'Show All' : 'Show Selected Only'}
        </button>

        {selectedCharacters.size > 0 && (
          <button
            onClick={clearSelection}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.8rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Clear Selection ({selectedCharacters.size})
          </button>
        )}

        {excludedCharacters.size > 0 && (
          <button
            onClick={() => setShowExcluded(!showExcluded)}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.8rem',
              backgroundColor: showExcluded ? '#dc2626' : '#f3f4f6',
              color: showExcluded ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            {showExcluded
              ? `Hide Excluded (${excludedCharacters.size})`
              : `Show Excluded (${excludedCharacters.size})`}
          </button>
        )}

        {excludedCharacters.size > 0 && (
          <button
            onClick={clearExclusions}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.8rem',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Restore All
          </button>
        )}

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: '#6b7280'
          }}
        >
          <label
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <input
              type="checkbox"
              checked={filterMentions}
              onChange={e => setFilterMentions(e.target.checked)}
              style={{ margin: 0 }}
            />
            <span title="Filter out characters who are only mentioned vs actually present">
              Filter mentions
            </span>
          </label>
          {filterMentions && (
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <span>Threshold:</span>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.5"
                value={presenceThreshold}
                onChange={e => setPresenceThreshold(parseFloat(e.target.value))}
                style={{ width: '60px' }}
                title={`Presence threshold: ${presenceThreshold} (higher = stricter filtering)`}
              />
              <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
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
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          backgroundColor: '#fafafa'
        }}
      >
        <svg width={width} height={height} style={{ display: 'block' }}>
          {/* Background */}
          <rect width={width} height={height} fill="#fafafa" />

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
                fill={index % 2 === 0 ? '#ffffff' : '#f8f9fa'}
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
              const dotSize = Math.max(3, Math.min(8, sceneData.strength * 2));

              return (
                <circle
                  key={`${characterName}-dot-${scene.key}`}
                  cx={x}
                  cy={y}
                  r={dotSize}
                  fill={color}
                  opacity={opacity}
                  stroke={isSelected || isHovered ? '#ffffff' : color}
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
                  x={leftMargin - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill={color}
                  opacity={opacity}
                  fontWeight={
                    isSelected || isHovered
                      ? 'bold'
                      : isFromList
                        ? '600'
                        : 'normal'
                  }
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleCharacterSelection(characterName)}
                  onMouseEnter={() => setHoveredCharacter(characterName)}
                  onMouseLeave={() => setHoveredCharacter(null)}
                >
                  {isFromList ? '✓' : ''} {characterName} ({data.scenes.size})
                </text>

                {/* Exclude button */}
                <text
                  x={leftMargin - 165}
                  y={y + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#dc2626"
                  opacity={isHovered ? 1 : 0.6}
                  style={{ cursor: 'pointer' }}
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
            return (
              <g key={`scene-label-${scene.key}`}>
                {/* Chapter title (only on first scene of chapter) */}
                {(index === 0 ||
                  allScenes[index - 1].chapter !== scene.chapter) && (
                  <text
                    x={x}
                    y={topMargin - 35}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill="#374151"
                  >
                    {scene.chapterTitle}
                  </text>
                )}

                {/* Scene title */}
                <text
                  x={x}
                  y={topMargin - 25}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#9ca3af"
                  transform={`rotate(-45, ${x}, ${topMargin - 25})`}
                >
                  {scene.sceneTitle || `Scene ${scene.scene + 1}`}
                </text>

                {/* Scene separator line */}
                <line
                  x1={x}
                  y1={topMargin}
                  x2={x}
                  y2={height - bottomMargin}
                  stroke="#e5e7eb"
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
          color: '#6b7280',
          flexShrink: 0
        }}
      >
        <p style={{ margin: 0 }}>
          <strong>Usage:</strong> Click character names to select/highlight.
          Thread thickness shows appearance frequency. Hover for scene details.
          Use ✕ to permanently exclude false positives.
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
  );
}

export default CharacterThreadVisualization;
