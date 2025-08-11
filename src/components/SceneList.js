import React, { useState } from 'react';

function SceneList({
  parts,
  chapters,
  currentSceneId,
  currentChapterId,
  currentPartId,
  onSceneSelect,
  onChapterSelect,
  onPartSelect,
  onSceneAdd,
  onChapterAdd,
  onPartAdd,
  onSceneDelete,
  onChapterDelete,
  onPartDelete,
  onChapterUpdate,
  onPartUpdate,
  onReorderChapters,
  onReorderParts,
  onReorderChaptersInPart,
  onReorderScenesInChapter,
  onMoveSceneBetweenChapters,
  onMoveChapterToPart,
  onAddChapterToPart,
  onRemoveChapterFromPart,
  recycleBin,
  showRecycleBin,
  onToggleRecycleBin,
  onRestoreFromRecycleBin,
  onPermanentlyDelete,
  onEmptyRecycleBin
}) {
  const [expandedChapters, setExpandedChapters] = useState(
    new Set(chapters.map(ch => ch.id))
  );
  const [expandedParts, setExpandedParts] = useState(
    new Set(parts.map(part => part.id))
  );
  const [editingChapter, setEditingChapter] = useState(null);
  const [editingPart, setEditingPart] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);
  const [dragInvalidTarget, setDragInvalidTarget] = useState(null);
  const [showMoveMenu, setShowMoveMenu] = useState(null);
  const [showChapterMoveMenu, setShowChapterMoveMenu] = useState(null);

  // Update expanded chapters when chapters change
  React.useEffect(() => {
    setExpandedChapters(prev => {
      const newExpanded = new Set(prev);
      chapters.forEach(chapter => {
        if (!newExpanded.has(chapter.id)) {
          newExpanded.add(chapter.id); // Auto-expand new chapters
        }
      });
      return newExpanded;
    });
  }, [chapters]);

  // Update expanded parts when parts change
  React.useEffect(() => {
    setExpandedParts(prev => {
      const newExpanded = new Set(prev);
      parts.forEach(part => {
        if (!newExpanded.has(part.id)) {
          newExpanded.add(part.id); // Auto-expand new parts
        }
      });
      return newExpanded;
    });
  }, [parts]);

  // Close move menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = event => {
      if (
        showMoveMenu &&
        !event.target.closest('.move-menu') &&
        !event.target.closest('.move-scene-btn')
      ) {
        setShowMoveMenu(null);
      }
      if (
        showChapterMoveMenu &&
        !event.target.closest('.chapter-move-menu') &&
        !event.target.closest('.move-chapter-btn')
      ) {
        setShowChapterMoveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoveMenu, showChapterMoveMenu]);

  const toggleChapter = chapterId => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);

    // Also select the chapter when toggling
    onChapterSelect(chapterId);
  };

  const togglePart = partId => {
    const newExpanded = new Set(expandedParts);
    if (newExpanded.has(partId)) {
      newExpanded.delete(partId);
    } else {
      newExpanded.add(partId);
    }
    setExpandedParts(newExpanded);

    // Also select the part when toggling
    onPartSelect(partId);
  };

  const handleChapterTitleChange = (chapterId, newTitle) => {
    onChapterUpdate(chapterId, { title: newTitle });
    setEditingChapter(null);
  };

  const handlePartTitleChange = (partId, newTitle) => {
    onPartUpdate(partId, { title: newTitle });
    setEditingPart(null);
  };

  const handleChapterClick = chapterId => {
    onChapterSelect(chapterId);
    // Ensure the chapter is expanded when selected
    if (!expandedChapters.has(chapterId)) {
      toggleChapter(chapterId);
    }
  };

  const handlePartClick = partId => {
    onPartSelect(partId);
    // Ensure the part is expanded when selected
    if (!expandedParts.has(partId)) {
      togglePart(partId);
    }
  };

  const getTotalWords = scenes => {
    return scenes.reduce((total, scene) => {
      return (
        total +
        scene.content.split(/\s+/).filter(word => word.length > 0).length
      );
    }, 0);
  };

  // Helper function to determine if we're using parts
  const usingParts = parts && parts.length > 0;

  // Helper function to get chapters for a specific part
  const getChaptersInPart = partId => {
    const part = parts.find(p => p.id === partId);
    if (!part) return [];
    return part.chapterIds
      .map(chapterId => chapters.find(ch => ch.id === chapterId))
      .filter(Boolean);
  };

  // Helper function to get unassigned chapters (not in any part)
  const getUnassignedChapters = () => {
    if (!usingParts) return chapters;

    const assignedChapterIds = new Set();
    parts.forEach(part => {
      part.chapterIds.forEach(chapterId => {
        assignedChapterIds.add(chapterId);
      });
    });

    return chapters.filter(ch => !assignedChapterIds.has(ch.id));
  };

  // Helper function to find which part a chapter belongs to
  const getPartForChapter = chapterId => {
    return parts.find(part => part.chapterIds.includes(chapterId));
  };

  // Drag and drop handlers
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, target) => {
    e.preventDefault();

    // Only allow valid drop targets
    if (!draggedItem || !target) return;

    // Allow part-to-part drops
    if (draggedItem.type === 'part' && target.type === 'part') {
      setDragOverTarget(target);
      setDragInvalidTarget(null);
    }
    // Allow chapter-to-chapter drops within the same part (or both unassigned)
    else if (draggedItem.type === 'chapter' && target.type === 'chapter') {
      const draggedPartId = draggedItem.partId;
      const targetPartId = target.partId;

      // Allow if both are in same part or both are unassigned
      if (draggedPartId === targetPartId) {
        setDragOverTarget(target);
        setDragInvalidTarget(null);
      } else {
        setDragOverTarget(null);
        setDragInvalidTarget(target);
      }
    }
    // Only allow scene-to-scene drops within the same chapter
    else if (
      draggedItem.type === 'scene' &&
      target.type === 'scene' &&
      draggedItem.chapterId === target.chapterId
    ) {
      setDragOverTarget(target);
      setDragInvalidTarget(null);
    }
    // Show invalid drop target for cross-chapter scene operations
    else if (
      draggedItem.type === 'scene' &&
      (target.type === 'chapter' ||
        (target.type === 'scene' && draggedItem.chapterId !== target.chapterId))
    ) {
      setDragOverTarget(null);
      setDragInvalidTarget(target);
    }
    // Allow chapter-to-part drops (for adding chapters to parts)
    else if (draggedItem.type === 'chapter' && target.type === 'part') {
      setDragOverTarget(target);
      setDragInvalidTarget(null);
    }
    // Don't allow any other combinations
    else {
      setDragOverTarget(null);
      setDragInvalidTarget(null);
    }
  };

  const handleDragLeave = e => {
    // Only clear drag over target if we're leaving the drop zone completely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverTarget(null);
      setDragInvalidTarget(null);
    }
  };

  const handleDrop = (e, target) => {
    e.preventDefault();
    setDragOverTarget(null);
    setDragInvalidTarget(null);

    if (!draggedItem || !target) return;

    if (draggedItem.type === 'part' && target.type === 'part') {
      // Reorder parts
      const fromIndex = parts.findIndex(p => p.id === draggedItem.id);
      const toIndex = parts.findIndex(p => p.id === target.id);
      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        onReorderParts(fromIndex, toIndex);
      }
    } else if (draggedItem.type === 'chapter' && target.type === 'chapter') {
      const draggedPartId = draggedItem.partId;
      const targetPartId = target.partId;

      // Only allow reordering within same part or both unassigned
      if (draggedPartId === targetPartId) {
        if (usingParts && draggedPartId) {
          // Reorder chapters within a part
          const part = parts.find(p => p.id === draggedPartId);
          if (part) {
            const fromIndex = part.chapterIds.findIndex(
              id => id === draggedItem.id
            );
            const toIndex = part.chapterIds.findIndex(id => id === target.id);
            if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
              onReorderChaptersInPart(draggedPartId, fromIndex, toIndex);
            }
          }
        } else {
          // Reorder chapters globally (when not using parts or both unassigned)
          const fromIndex = chapters.findIndex(ch => ch.id === draggedItem.id);
          const toIndex = chapters.findIndex(ch => ch.id === target.id);
          if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
            onReorderChapters(fromIndex, toIndex);
          }
        }
      }
    } else if (draggedItem.type === 'chapter' && target.type === 'part') {
      // Add chapter to part
      const currentPart = getPartForChapter(draggedItem.id);
      if (currentPart && currentPart.id !== target.id) {
        // Move from one part to another
        onMoveChapterToPart(draggedItem.id, currentPart.id, target.id);
      } else if (!currentPart) {
        // Add unassigned chapter to part
        onAddChapterToPart(draggedItem.id, target.id);
      }
    } else if (draggedItem.type === 'scene' && target.type === 'scene') {
      // Only allow reordering scenes within the same chapter
      if (draggedItem.chapterId === target.chapterId) {
        const chapter = chapters.find(ch => ch.id === draggedItem.chapterId);
        if (chapter) {
          const fromIndex = chapter.scenes.findIndex(
            s => s.id === draggedItem.id
          );
          const toIndex = chapter.scenes.findIndex(s => s.id === target.id);
          if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
            onReorderScenesInChapter(draggedItem.chapterId, fromIndex, toIndex);
          }
        }
      }
      // Cross-chapter scene dragging is disabled - use the move button instead
    } else if (draggedItem.type === 'scene' && target.type === 'chapter') {
      // Prevent dropping scenes on chapters - use the move button instead
      // This prevents the duplication bug
    }

    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverTarget(null);
    setDragInvalidTarget(null);
  };

  const handleMoveSceneToChapter = (sceneId, fromChapterId, toChapterId) => {
    onMoveSceneBetweenChapters(sceneId, fromChapterId, toChapterId);
    setShowMoveMenu(null);
  };

  const handleMoveChapterToPart = (chapterId, toPartId) => {
    const currentPart = getPartForChapter(chapterId);
    if (currentPart) {
      onMoveChapterToPart(chapterId, currentPart.id, toPartId);
    } else {
      onAddChapterToPart(chapterId, toPartId);
    }
    setShowChapterMoveMenu(null);
  };

  const handleRemoveChapterFromPart = chapterId => {
    const currentPart = getPartForChapter(chapterId);
    if (currentPart) {
      onRemoveChapterFromPart(chapterId, currentPart.id);
    }
    setShowChapterMoveMenu(null);
  };

  const handleShowMoveMenu = (sceneId, event) => {
    setShowMoveMenu(showMoveMenu === sceneId ? null : sceneId);

    // Add smart positioning logic only when opening the menu
    if (showMoveMenu !== sceneId) {
      // Use a longer timeout to ensure React has finished rendering
      setTimeout(() => {
        try {
          const button = event.currentTarget;
          if (!button) return;

          // Find the scene item container (which contains both the button and the menu)
          const sceneItem = button.closest('.scene-item');
          if (!sceneItem) return;

          // Find the menu within the scene item
          const menu = sceneItem.querySelector('.move-menu');
          if (!menu) return;

          const buttonRect = button.getBoundingClientRect();
          const containerRect = button
            .closest('.chapters-container')
            ?.getBoundingClientRect();

          if (!containerRect) return;

          const spaceBelow = containerRect.bottom - buttonRect.bottom;
          const menuHeight = 200; // Approximate max height

          if (
            spaceBelow < menuHeight &&
            buttonRect.top - containerRect.top > menuHeight
          ) {
            menu.classList.add('show-above');
          } else {
            menu.classList.remove('show-above');
          }
        } catch (error) {
          console.warn('Error positioning move menu:', error);
        }
      }, 100); // Longer timeout to ensure DOM is ready
    }
  };

  const handleShowChapterMoveMenu = (chapterId, __event) => {
    setShowChapterMoveMenu(
      showChapterMoveMenu === chapterId ? null : chapterId
    );
  };

  // Render a chapter with all its scenes
  const renderChapter = (chapter, chapterIndex, partId = null) => {
    const isExpanded = expandedChapters.has(chapter.id);
    const isCurrentChapter = chapter.id === currentChapterId;
    const chapterWordCount = getTotalWords(chapter.scenes);
    const isDraggedOver =
      dragOverTarget?.type === 'chapter' && dragOverTarget.id === chapter.id;
    const isDraggedInvalid =
      dragInvalidTarget?.type === 'chapter' &&
      dragInvalidTarget.id === chapter.id;

    return (
      <div
        key={chapter.id}
        className={`chapter-group ${
          isDraggedOver ? 'drag-over' : isDraggedInvalid ? 'drag-invalid' : ''
        }`}
        onDragOver={handleDragOver}
        onDragEnter={e =>
          handleDragEnter(e, { type: 'chapter', id: chapter.id, partId })
        }
        onDragLeave={handleDragLeave}
        onDrop={e => handleDrop(e, { type: 'chapter', id: chapter.id, partId })}
      >
        <div
          className={`chapter-header ${isCurrentChapter ? 'active-chapter' : ''}`}
          onClick={() => handleChapterClick(chapter.id)}
          draggable
          onDragStart={e =>
            handleDragStart(e, { type: 'chapter', id: chapter.id, partId })
          }
          onDragEnd={handleDragEnd}
        >
          <div className="chapter-header-content">
            <span className="drag-handle" title="Drag to reorder">
              ⋮⋮
            </span>

            <button
              className="chapter-toggle"
              onClick={e => {
                e.stopPropagation();
                toggleChapter(chapter.id);
              }}
              title={isExpanded ? 'Collapse chapter' : 'Expand chapter'}
            >
              {isExpanded ? '📂' : '📁'}
            </button>

            {editingChapter === chapter.id ? (
              <input
                type="text"
                defaultValue={chapter.title}
                className="chapter-title-edit"
                autoFocus
                onBlur={e =>
                  handleChapterTitleChange(chapter.id, e.target.value)
                }
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleChapterTitleChange(chapter.id, e.target.value);
                  } else if (e.key === 'Escape') {
                    setEditingChapter(null);
                  }
                }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span
                className="chapter-title"
                onDoubleClick={e => {
                  e.stopPropagation();
                  setEditingChapter(chapter.id);
                }}
              >
                {chapter.title}
              </span>
            )}

            <div className="chapter-meta">
              <span className="scene-count">
                {chapter.scenes.length} scenes
              </span>
              <span className="word-count">{chapterWordCount} words</span>
            </div>

            {usingParts && (
              <button
                className="move-chapter-btn"
                onClick={e => {
                  e.stopPropagation();
                  handleShowChapterMoveMenu(chapter.id, e);
                }}
                title="Move chapter to different part"
              >
                ↗️
              </button>
            )}

            <button
              className="chapter-delete"
              onClick={e => {
                e.stopPropagation();
                onChapterDelete(chapter.id);
              }}
              title="Delete Chapter"
            >
              🗑️
            </button>
          </div>

          {showChapterMoveMenu === chapter.id && (
            <div className="chapter-move-menu">
              <div className="move-menu-title">Move to:</div>
              {parts
                .filter(p => p.id !== partId)
                .map(targetPart => (
                  <button
                    key={targetPart.id}
                    className="move-menu-item"
                    onClick={e => {
                      e.stopPropagation();
                      handleMoveChapterToPart(chapter.id, targetPart.id);
                    }}
                  >
                    {targetPart.title}
                  </button>
                ))}
              {partId && (
                <button
                  className="move-menu-item remove-from-part"
                  onClick={e => {
                    e.stopPropagation();
                    handleRemoveChapterFromPart(chapter.id);
                  }}
                >
                  Remove from Part
                </button>
              )}
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="scenes-in-chapter">
            {chapter.scenes.length === 0 ? (
              <div className="empty-chapter">
                <span>No scenes yet. Click "📄+ Scene" to add one.</span>
              </div>
            ) : (
              chapter.scenes.map((scene, sceneIndex) => {
                const isSceneDraggedOver =
                  dragOverTarget?.type === 'scene' &&
                  dragOverTarget.id === scene.id;
                const isSceneDraggedInvalid =
                  dragInvalidTarget?.type === 'scene' &&
                  dragInvalidTarget.id === scene.id;

                return (
                  <div
                    key={scene.id}
                    className={`scene-item ${
                      scene.id === currentSceneId ? 'active' : ''
                    } ${
                      isSceneDraggedOver
                        ? 'drag-over'
                        : isSceneDraggedInvalid
                          ? 'drag-invalid'
                          : ''
                    }`}
                    onClick={() => onSceneSelect(scene.id)}
                    draggable
                    onDragStart={e =>
                      handleDragStart(e, {
                        type: 'scene',
                        id: scene.id,
                        chapterId: chapter.id
                      })
                    }
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragEnter={e =>
                      handleDragEnter(e, {
                        type: 'scene',
                        id: scene.id,
                        chapterId: chapter.id
                      })
                    }
                    onDragLeave={handleDragLeave}
                    onDrop={e =>
                      handleDrop(e, {
                        type: 'scene',
                        id: scene.id,
                        chapterId: chapter.id
                      })
                    }
                  >
                    <div className="scene-controls">
                      <span className="drag-handle" title="Drag to reorder">
                        ⋮⋮
                      </span>
                      <div className="scene-number">
                        {chapterIndex + 1}.{sceneIndex + 1}
                      </div>
                    </div>

                    <div className="scene-content">
                      <div className="scene-title">{scene.title}</div>
                      <div className="scene-meta">
                        <span className="scene-date">
                          {new Date(scene.modified).toLocaleDateString()}
                        </span>
                        <span className="scene-word-count">
                          {
                            scene.content
                              .split(/\s+/)
                              .filter(word => word.length > 0).length
                          }{' '}
                          words
                        </span>
                      </div>
                    </div>

                    <div className="scene-actions">
                      <button
                        className="move-scene-btn"
                        onClick={e => {
                          e.stopPropagation();
                          handleShowMoveMenu(scene.id, e);
                        }}
                        title="Move to another chapter (scenes can only be dragged within the same chapter)"
                      >
                        ↗️
                      </button>

                      <button
                        className="delete-scene-btn"
                        onClick={e => {
                          e.stopPropagation();
                          onSceneDelete(scene.id);
                        }}
                        title="Delete scene"
                      >
                        🗑️
                      </button>
                    </div>

                    {showMoveMenu === scene.id && (
                      <div className="move-menu">
                        <div className="move-menu-title">Move to:</div>
                        {chapters
                          .filter(ch => ch.id !== chapter.id)
                          .map(targetChapter => (
                            <button
                              key={targetChapter.id}
                              className="move-menu-item"
                              onClick={e => {
                                e.stopPropagation();
                                handleMoveSceneToChapter(
                                  scene.id,
                                  chapter.id,
                                  targetChapter.id
                                );
                              }}
                            >
                              {targetChapter.title}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="tab-list">
      <div className="tab-list-header">
        <h3>Book Structure</h3>
        <p className="tab-description">
          {usingParts
            ? 'Organize your story into parts, chapters, and scenes. Parts help group related chapters together.'
            : 'Organize your story into chapters and scenes. You can optionally add Parts to group chapters.'}
        </p>
        {currentChapterId && (
          <div className="current-chapter-indicator">
            <small>
              Adding scenes to:{' '}
              <strong>
                {chapters.find(ch => ch.id === currentChapterId)?.title ||
                  'Unknown Chapter'}
              </strong>
            </small>
          </div>
        )}
        <div className="header-buttons">
          {!usingParts && (
            <button
              onClick={onPartAdd}
              className="secondary-btn"
              title="Add Parts to organize chapters into larger sections"
            >
              📚+ Part
            </button>
          )}
          {usingParts && (
            <button
              onClick={onPartAdd}
              className="primary-btn"
              title="Add Part"
            >
              📚+ Part
            </button>
          )}
          <button
            onClick={onChapterAdd}
            className="primary-btn"
            title="Add Chapter"
          >
            📁+ Chapter
          </button>
          <button
            onClick={onSceneAdd}
            className="primary-btn"
            title={
              currentChapterId
                ? `Add Scene to ${chapters.find(ch => ch.id === currentChapterId)?.title || 'Current Chapter'}`
                : 'Select a chapter first'
            }
            disabled={!currentChapterId}
          >
            📄+ Scene
          </button>
          <button
            onClick={onToggleRecycleBin}
            className={`secondary-btn ${recycleBin.length > 0 ? 'has-items' : ''}`}
            title={`Recycle Bin (${recycleBin.length} items)`}
          >
            🗑️ ({recycleBin.length})
          </button>
        </div>
      </div>

      <div className="tab-content-container chapters-container">
        {usingParts ? (
          // Parts-based view
          <>
            {parts.map((part, __partIndex) => {
              const isPartExpanded = expandedParts.has(part.id);
              const isCurrentPart = part.id === currentPartId;
              const partChapters = getChaptersInPart(part.id);
              const partWordCount = partChapters.reduce(
                (total, ch) => total + getTotalWords(ch.scenes),
                0
              );
              const isPartDraggedOver =
                dragOverTarget?.type === 'part' &&
                dragOverTarget.id === part.id;
              const isPartDraggedInvalid =
                dragInvalidTarget?.type === 'part' &&
                dragInvalidTarget.id === part.id;

              return (
                <div
                  key={part.id}
                  className={`part-group ${
                    isPartDraggedOver
                      ? 'drag-over'
                      : isPartDraggedInvalid
                        ? 'drag-invalid'
                        : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDragEnter={e =>
                    handleDragEnter(e, { type: 'part', id: part.id })
                  }
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, { type: 'part', id: part.id })}
                >
                  <div
                    className={`part-header ${isCurrentPart ? 'active-part' : ''}`}
                    onClick={() => handlePartClick(part.id)}
                    draggable
                    onDragStart={e =>
                      handleDragStart(e, { type: 'part', id: part.id })
                    }
                    onDragEnd={handleDragEnd}
                  >
                    <div className="part-header-content">
                      <span className="drag-handle" title="Drag to reorder">
                        ⋮⋮
                      </span>

                      <button
                        className="part-toggle"
                        onClick={e => {
                          e.stopPropagation();
                          togglePart(part.id);
                        }}
                        title={isPartExpanded ? 'Collapse part' : 'Expand part'}
                      >
                        {isPartExpanded ? '📚' : '📖'}
                      </button>

                      {editingPart === part.id ? (
                        <input
                          type="text"
                          defaultValue={part.title}
                          className="part-title-edit"
                          autoFocus
                          onBlur={e =>
                            handlePartTitleChange(part.id, e.target.value)
                          }
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              handlePartTitleChange(part.id, e.target.value);
                            } else if (e.key === 'Escape') {
                              setEditingPart(null);
                            }
                          }}
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <span
                          className="part-title"
                          onDoubleClick={e => {
                            e.stopPropagation();
                            setEditingPart(part.id);
                          }}
                        >
                          {part.title}
                        </span>
                      )}

                      <div className="part-meta">
                        <span className="chapter-count">
                          {partChapters.length} chapters
                        </span>
                        <span className="word-count">
                          {partWordCount} words
                        </span>
                      </div>

                      <button
                        className="part-delete"
                        onClick={e => {
                          e.stopPropagation();
                          onPartDelete(part.id);
                        }}
                        title="Delete Part (chapters will remain)"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {isPartExpanded && (
                    <div className="chapters-in-part">
                      {partChapters.length === 0 ? (
                        <div className="empty-part">
                          <span>
                            No chapters assigned. Drag chapters here or click
                            "📁+ Chapter" to add one.
                          </span>
                        </div>
                      ) : (
                        partChapters.map((chapter, chapterIndex) =>
                          renderChapter(chapter, chapterIndex, part.id)
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unassigned chapters section */}
            {getUnassignedChapters().length > 0 && (
              <div className="unassigned-chapters-section">
                <div className="unassigned-header">
                  <h4>📄 Unassigned Chapters</h4>
                  <p>
                    These chapters are not assigned to any part. Drag them to a
                    part to organize them.
                  </p>
                </div>
                {getUnassignedChapters().map((chapter, chapterIndex) =>
                  renderChapter(chapter, chapterIndex, null)
                )}
              </div>
            )}
          </>
        ) : (
          // Simple chapters-only view
          chapters.map((chapter, chapterIndex) =>
            renderChapter(chapter, chapterIndex, null)
          )
        )}
      </div>

      {/* Recycle Bin */}
      {showRecycleBin && (
        <div className="recycle-bin">
          <div className="recycle-bin-header">
            <h4>🗑️ Recycle Bin</h4>
            <div className="recycle-bin-controls">
              {recycleBin.length > 0 && (
                <button
                  onClick={onEmptyRecycleBin}
                  className="empty-bin-btn"
                  title="Permanently delete all items"
                >
                  Empty Bin
                </button>
              )}
              <button
                onClick={onToggleRecycleBin}
                className="close-bin-btn"
                title="Close recycle bin"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="recycle-bin-content">
            {recycleBin.length === 0 ? (
              <div className="empty-bin">
                <span>Recycle bin is empty</span>
              </div>
            ) : (
              recycleBin.map(item => (
                <div key={item.id} className="recycle-bin-item">
                  <div className="recycle-item-content">
                    <div className="recycle-item-title">
                      {item.type === 'scene' ? '📄' : '📁'} {item.item.title}
                    </div>
                    <div className="recycle-item-meta">
                      {item.type === 'scene' && (
                        <span>from {item.originalChapterTitle}</span>
                      )}
                      <span>
                        deleted {new Date(item.deletedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="recycle-item-actions">
                    <button
                      onClick={() => onRestoreFromRecycleBin(item.id)}
                      className="restore-btn"
                      title="Restore item"
                    >
                      ↩️
                    </button>
                    <button
                      onClick={() => onPermanentlyDelete(item.id)}
                      className="permanent-delete-btn"
                      title="Permanently delete"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SceneList;
