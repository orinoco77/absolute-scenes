import { useState } from 'react';

function FrontMatterList({
  frontMatter,
  currentFrontMatterId,
  onFrontMatterSelect,
  onFrontMatterAdd,
  onFrontMatterDelete,
  onFrontMatterUpdate: _onFrontMatterUpdate,
  onFrontMatterToggle,
  onFrontMatterReorder,
  authorName = '' // Add author name prop
}) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);

  // Predefined front matter types with their default configurations
  const frontMatterTypes = {
    copyright: {
      title: 'Copyright',
      icon: '©️',
      description: 'Copyright and publication information',
      defaultContent: generateDefaultCopyright(authorName)
    },
    dedication: {
      title: 'Dedication',
      icon: '💝',
      description: 'Personal dedication message',
      defaultContent: ''
    },
    acknowledgments: {
      title: 'Acknowledgments',
      icon: '🙏',
      description: 'Thank you messages',
      defaultContent: ''
    },
    foreword: {
      title: 'Foreword',
      icon: '📝',
      description: 'Introduction by another author',
      defaultContent: ''
    },
    prologue: {
      title: 'Prologue',
      icon: '🎭',
      description: 'Story preface or opening scene',
      defaultContent: ''
    },
    map: {
      title: 'Map',
      icon: '🗺️',
      description: 'Visual map or illustration',
      defaultContent: '',
      isImage: true
    }
  };

  function generateDefaultCopyright(author) {
    const currentYear = new Date().getFullYear();
    const authorText =
      author && author.trim() ? author.trim() : '[Author Name]';
    return `Copyright © ${currentYear} ${authorText}

All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the publisher, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.

For permission requests, write to the publisher at [Email Address].

First Edition

ISBN: [To be assigned]

Printed in [Country]`;
  }

  const handleAddFrontMatter = type => {
    const typeConfig = frontMatterTypes[type];
    const newItem = {
      id: `${type}-${Date.now()}`,
      type,
      title: typeConfig.title,
      content: typeConfig.defaultContent,
      enabled: true,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      ...(typeConfig.isImage && { imageData: null, imageFileName: null })
    };
    onFrontMatterAdd(newItem);
  };

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, target) => {
    e.preventDefault();
    if (draggedItem && target && draggedItem.id !== target.id) {
      setDragOverTarget(target);
    }
  };

  const handleDragLeave = e => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverTarget(null);
    }
  };

  const handleDrop = (e, target) => {
    e.preventDefault();
    setDragOverTarget(null);

    if (!draggedItem || !target || draggedItem.id === target.id) return;

    const fromIndex = frontMatter.findIndex(item => item.id === draggedItem.id);
    const toIndex = frontMatter.findIndex(item => item.id === target.id);

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      onFrontMatterReorder(fromIndex, toIndex);
    }

    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverTarget(null);
  };

  // Get enabled front matter types for the add dropdown
  const enabledTypes = new Set(frontMatter.map(item => item.type));
  const availableTypes = Object.entries(frontMatterTypes).filter(
    ([type]) =>
      type !== 'map' ||
      frontMatter.filter(item => item.type === 'map').length < 5 // Allow up to 5 maps
  );

  return (
    <div className="tab-list">
      <div className="tab-list-header">
        <h3>Front Matter</h3>
        <p className="tab-description">
          Add optional front matter sections like copyright, dedication, maps,
          and more. These appear before your main story content.
        </p>

        <div className="header-buttons">
          <div className="add-dropdown">
            <button className="primary-btn dropdown-trigger">
              📄+ Add Section
            </button>
            <div className="dropdown-menu">
              {availableTypes.map(([type, config]) => (
                <button
                  key={type}
                  className={`dropdown-item ${enabledTypes.has(type) && type !== 'map' ? 'disabled' : ''}`}
                  onClick={() => handleAddFrontMatter(type)}
                  disabled={enabledTypes.has(type) && type !== 'map'}
                  title={config.description}
                >
                  <span className="dropdown-icon">{config.icon}</span>
                  <span className="dropdown-text">
                    {config.title}
                    {enabledTypes.has(type) && type !== 'map' && ' (Added)'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="tab-content-container front-matter-container">
        {frontMatter.length === 0 ? (
          <div className="empty-state">
            <p>
              No front matter added yet. Click "📄+ Add Section" to add
              copyright, dedication, maps, or other front matter.
            </p>
          </div>
        ) : (
          frontMatter.map(item => {
            const typeConfig = frontMatterTypes[item.type] || {
              icon: '📄',
              title: item.type
            };
            const isDraggedOver = dragOverTarget?.id === item.id;

            return (
              <div
                key={item.id}
                className={`front-matter-item ${
                  item.id === currentFrontMatterId ? 'active' : ''
                } ${isDraggedOver ? 'drag-over' : ''} ${!item.enabled ? 'disabled' : ''}`}
                onClick={() => onFrontMatterSelect(item.id)}
                draggable
                onDragStart={e => handleDragStart(e, item)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragEnter={e => handleDragEnter(e, item)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, item)}
              >
                <div className="front-matter-content">
                  <span className="drag-handle" title="Drag to reorder">
                    ⋮⋮
                  </span>

                  <div className="front-matter-icon">{typeConfig.icon}</div>

                  <div className="front-matter-details">
                    <div className="front-matter-title">{item.title}</div>
                    <div className="front-matter-type">{typeConfig.title}</div>
                    <div className="front-matter-meta">
                      {item.type === 'map' && item.imageFileName && (
                        <span className="image-info">
                          📷 {item.imageFileName}
                        </span>
                      )}
                      {item.type !== 'map' && item.content && (
                        <span className="word-count">
                          {
                            item.content
                              .split(/\s+/)
                              .filter(word => word.length > 0).length
                          }{' '}
                          words
                        </span>
                      )}
                      <span className="modified-date">
                        {new Date(item.modified).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="front-matter-actions">
                  <button
                    className={`toggle-btn ${item.enabled ? 'enabled' : 'disabled'}`}
                    onClick={e => {
                      e.stopPropagation();
                      onFrontMatterToggle(item.id, !item.enabled);
                    }}
                    title={
                      item.enabled
                        ? 'Disable this section'
                        : 'Enable this section'
                    }
                  >
                    {item.enabled ? '✓' : '○'}
                  </button>

                  <button
                    className="delete-btn"
                    onClick={e => {
                      e.stopPropagation();
                      onFrontMatterDelete(item.id);
                    }}
                    title="Delete section"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default FrontMatterList;
