import React, { useState } from 'react';

function SceneList({ 
  chapters, 
  currentSceneId, 
  currentChapterId,
  onSceneSelect, 
  onChapterSelect,
  onSceneAdd, 
  onChapterAdd,
  onSceneDelete, 
  onChapterDelete,
  onChapterUpdate,
  onReorderChapters,
  onReorderScenesInChapter,
  onMoveSceneBetweenChapters,
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
  const [editingChapter, setEditingChapter] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);
  const [dragInvalidTarget, setDragInvalidTarget] = useState(null);
  const [showMoveMenu, setShowMoveMenu] = useState(null);

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

  // Close move menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMoveMenu && !event.target.closest('.move-menu') && !event.target.closest('.move-scene-btn')) {
        setShowMoveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoveMenu]);

  const toggleChapter = (chapterId) => {
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

  const handleChapterTitleChange = (chapterId, newTitle) => {
    onChapterUpdate(chapterId, { title: newTitle });
    setEditingChapter(null);
  };

  const handleChapterClick = (chapterId) => {
    onChapterSelect(chapterId);
    // Ensure the chapter is expanded when selected
    if (!expandedChapters.has(chapterId)) {
      toggleChapter(chapterId);
    }
  };

  const getTotalWords = (scenes) => {
    return scenes.reduce((total, scene) => {
      return total + scene.content.split(/\s+/).filter(word => word.length > 0).length;
    }, 0);
  };

  // Drag and drop handlers
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, target) => {
    e.preventDefault();
    
    // Only allow valid drop targets
    if (!draggedItem || !target) return;
    
    // Allow chapter-to-chapter drops
    if (draggedItem.type === 'chapter' && target.type === 'chapter') {
      setDragOverTarget(target);
      setDragInvalidTarget(null);
    }
    // Only allow scene-to-scene drops within the same chapter
    else if (draggedItem.type === 'scene' && target.type === 'scene' && 
             draggedItem.chapterId === target.chapterId) {
      setDragOverTarget(target);
      setDragInvalidTarget(null);
    }
    // Show invalid drop target for cross-chapter operations
    else if (draggedItem.type === 'scene' && 
             (target.type === 'chapter' || 
              (target.type === 'scene' && draggedItem.chapterId !== target.chapterId))) {
      setDragOverTarget(null);
      setDragInvalidTarget(target);
    }
    // Don't allow any other combinations
    else {
      setDragOverTarget(null);
      setDragInvalidTarget(null);
    }
  };

  const handleDragLeave = (e) => {
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

    if (draggedItem.type === 'chapter' && target.type === 'chapter') {
      // Reorder chapters
      const fromIndex = chapters.findIndex(ch => ch.id === draggedItem.id);
      const toIndex = chapters.findIndex(ch => ch.id === target.id);
      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        onReorderChapters(fromIndex, toIndex);
      }
    } else if (draggedItem.type === 'scene' && target.type === 'scene') {
      // Only allow reordering scenes within the same chapter
      if (draggedItem.chapterId === target.chapterId) {
        const chapter = chapters.find(ch => ch.id === draggedItem.chapterId);
        if (chapter) {
          const fromIndex = chapter.scenes.findIndex(s => s.id === draggedItem.id);
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
          const containerRect = button.closest('.chapters-container')?.getBoundingClientRect();
          
          if (!containerRect) return;
          
          const spaceBelow = containerRect.bottom - buttonRect.bottom;
          const menuHeight = 200; // Approximate max height
          
          if (spaceBelow < menuHeight && buttonRect.top - containerRect.top > menuHeight) {
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

  return (
    <div className="scene-list">
      <div className="scene-list-header">
        <h3>Book Structure</h3>
        {currentChapterId && (
          <div className="current-chapter-indicator">
            <small>
              Adding scenes to: <strong>
                {chapters.find(ch => ch.id === currentChapterId)?.title || 'Unknown Chapter'}
              </strong>
            </small>
          </div>
        )}
        <div className="header-buttons">
          <button onClick={onChapterAdd} className="add-chapter-btn" title="Add Chapter">
            📁+ Chapter
          </button>
          <button 
            onClick={onSceneAdd} 
            className="add-scene-btn" 
            title={currentChapterId 
              ? `Add Scene to ${chapters.find(ch => ch.id === currentChapterId)?.title || 'Current Chapter'}` 
              : 'Select a chapter first'
            }
            disabled={!currentChapterId}
          >
            📄+ Scene
          </button>
          <button 
            onClick={onToggleRecycleBin} 
            className={`recycle-bin-btn ${recycleBin.length > 0 ? 'has-items' : ''}`}
            title={`Recycle Bin (${recycleBin.length} items)`}
          >
            🗑️ ({recycleBin.length})
          </button>
        </div>
      </div>
      
      <div className="chapters-container">
        {chapters.map((chapter, chapterIndex) => {
          const isExpanded = expandedChapters.has(chapter.id);
          const isCurrentChapter = chapter.id === currentChapterId;
          const chapterWordCount = getTotalWords(chapter.scenes);
          const isDraggedOver = dragOverTarget?.type === 'chapter' && dragOverTarget.id === chapter.id;
          const isDraggedInvalid = dragInvalidTarget?.type === 'chapter' && dragInvalidTarget.id === chapter.id;
          
          return (
            <div 
              key={chapter.id} 
              className={`chapter-group ${
                isDraggedOver ? 'drag-over' : 
                isDraggedInvalid ? 'drag-invalid' : ''
              }`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, { type: 'chapter', id: chapter.id })}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, { type: 'chapter', id: chapter.id })}
            >
              <div 
                className={`chapter-header ${isCurrentChapter ? 'active-chapter' : ''}`}
                onClick={() => handleChapterClick(chapter.id)}
                draggable
                onDragStart={(e) => handleDragStart(e, { type: 'chapter', id: chapter.id })}
                onDragEnd={handleDragEnd}
              >
                <div className="chapter-header-content">
                  <span className="drag-handle" title="Drag to reorder">⋮⋮</span>
                  
                  <button 
                    className="chapter-toggle"
                    onClick={(e) => {
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
                      onBlur={(e) => handleChapterTitleChange(chapter.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleChapterTitleChange(chapter.id, e.target.value);
                        } else if (e.key === 'Escape') {
                          setEditingChapter(null);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span 
                      className="chapter-title"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingChapter(chapter.id);
                      }}
                    >
                      {chapter.title}
                    </span>
                  )}
                  
                  <div className="chapter-meta">
                    <span className="scene-count">{chapter.scenes.length} scenes</span>
                    <span className="word-count">{chapterWordCount} words</span>
                  </div>
                  
                  <button 
                    className="chapter-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChapterDelete(chapter.id);
                    }}
                    title="Delete Chapter"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              {isExpanded && (
                <div className="scenes-in-chapter">
                  {chapter.scenes.length === 0 ? (
                    <div className="empty-chapter">
                      <span>No scenes yet. Click "📄+ Scene" to add one.</span>
                    </div>
                  ) : (
                    chapter.scenes.map((scene, sceneIndex) => {
                      const isSceneDraggedOver = dragOverTarget?.type === 'scene' && 
                                               dragOverTarget.id === scene.id;
                      const isSceneDraggedInvalid = dragInvalidTarget?.type === 'scene' && 
                                                   dragInvalidTarget.id === scene.id;
                      
                      return (
                        <div
                          key={scene.id}
                          className={`scene-item ${
                            scene.id === currentSceneId ? 'active' : ''
                          } ${
                            isSceneDraggedOver ? 'drag-over' : 
                            isSceneDraggedInvalid ? 'drag-invalid' : ''
                          }`}
                          onClick={() => onSceneSelect(scene.id)}
                          draggable
                          onDragStart={(e) => handleDragStart(e, { 
                            type: 'scene', 
                            id: scene.id, 
                            chapterId: chapter.id 
                          })}
                          onDragEnd={handleDragEnd}
                          onDragOver={handleDragOver}
                          onDragEnter={(e) => handleDragEnter(e, { 
                            type: 'scene', 
                            id: scene.id, 
                            chapterId: chapter.id 
                          })}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, { 
                            type: 'scene', 
                            id: scene.id, 
                            chapterId: chapter.id 
                          })}
                        >
                          <div className="scene-controls">
                            <span className="drag-handle" title="Drag to reorder">⋮⋮</span>
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
                                {scene.content.split(/\s+/).filter(word => word.length > 0).length} words
                              </span>
                            </div>
                          </div>
                          
                          <div className="scene-actions">
                            <button 
                              className="move-scene-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowMoveMenu(scene.id, e);
                              }}
                              title="Move to another chapter (scenes can only be dragged within the same chapter)"
                            >
                              ↗️
                            </button>
                            
                            <button 
                              className="delete-scene-btn"
                              onClick={(e) => {
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveSceneToChapter(scene.id, chapter.id, targetChapter.id);
                                    }}
                                  >
                                    {targetChapter.title}
                                  </button>
                                ))
                              }
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
        })}
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
                      <span>deleted {new Date(item.deletedAt).toLocaleDateString()}</span>
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