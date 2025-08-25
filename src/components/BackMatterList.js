import { useDragAndDrop } from '../hooks/useDragAndDrop';

function BackMatterList({
  backMatter = [],
  currentBackMatterId,
  onBackMatterSelect,
  onBackMatterAdd,
  onBackMatterDelete,
  onBackMatterUpdate: _onBackMatterUpdate,
  onBackMatterToggle,
  onBackMatterReorder,
  authorName = ''
}) {
  // Handle reordering back matter items
  const handleBackMatterReorder = ({ draggedItem, target }) => {
    if (!draggedItem || !target || draggedItem.id === target.id) return;

    const fromIndex = backMatter.findIndex(item => item.id === draggedItem.id);
    const toIndex = backMatter.findIndex(item => item.id === target.id);

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      onBackMatterReorder(fromIndex, toIndex);
    }
  };

  // Initialize drag and drop functionality
  const {
    draggedItem: _draggedItem,
    dragOverTarget,
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    isValidDropTarget: _isValidDropTarget
  } = useDragAndDrop({
    onReorder: handleBackMatterReorder
  });

  // Predefined back matter types with their default configurations
  const backMatterTypes = {
    epilogue: {
      title: 'Epilogue',
      icon: '🎬',
      description: 'Story conclusion or final thoughts',
      defaultContent: ''
    },
    acknowledgments: {
      title: 'Acknowledgments',
      icon: '🙏',
      description: 'Thank you messages to contributors',
      defaultContent: generateDefaultAcknowledgments()
    },
    appendix: {
      title: 'Appendix',
      icon: '📋',
      description: 'Supplementary information and data',
      defaultContent: ''
    },
    glossary: {
      title: 'Glossary',
      icon: '📖',
      description: 'Definitions of key terms',
      defaultContent: generateDefaultGlossary()
    },
    bibliography: {
      title: 'Bibliography',
      icon: '📚',
      description: 'List of sources and references',
      defaultContent: generateDefaultBibliography()
    },
    index: {
      title: 'Index',
      icon: '🔍',
      description: 'Alphabetical topic listing',
      defaultContent: generateDefaultIndex()
    },
    'about-author': {
      title: 'About the Author',
      icon: '👤',
      description: 'Author biography and credentials',
      defaultContent: generateDefaultAboutAuthor(authorName)
    }
  };

  function generateDefaultAcknowledgments() {
    return `I would like to express my heartfelt gratitude to all those who contributed to the creation of this book.

First and foremost, I thank my family for their unwavering support and understanding throughout this journey.

Special thanks to my editor [Editor Name] for their invaluable feedback and guidance in shaping this work.

I am grateful to my beta readers [Beta Reader Names] who provided essential insights and suggestions.

My appreciation extends to [Publisher/Agent Name] for believing in this project and making its publication possible.

Finally, I thank all the readers who will engage with this work and bring their own interpretations to its pages.`;
  }

  function generateDefaultGlossary() {
    return `[Term 1]: Definition of the first term used in your book.

[Term 2]: Definition of the second term, providing clear explanation for readers.

[Term 3]: Another important term that readers may need clarification on.

Note: Add, remove, or modify these entries based on the specific terminology used in your book.`;
  }

  function generateDefaultBibliography() {
    return `[1] Author, A. (Year). Title of Book. Publisher.

[2] Author, B. (Year). "Title of Article." Journal Name, Volume(Issue), pages.

[3] Author, C. (Year). Title of Website Article. Website Name. Retrieved from URL

Note: Format your sources according to your preferred citation style (APA, MLA, Chicago, etc.).`;
  }

  function generateDefaultIndex() {
    return `A
[Topic A], 12, 45, 78

B
[Topic B], 23, 67, 89

C
[Topic C], 34, 56, 90

Note: This is a template. In practice, the index would be generated after final page layout and would contain actual page numbers for topics mentioned in your book.`;
  }

  function generateDefaultAboutAuthor(author) {
    const authorText =
      author && author.trim() ? author.trim() : '[Author Name]';
    return `${authorText} is [brief description of background/credentials].

[Add 2-3 sentences about your relevant experience, education, or expertise related to the book's subject matter.]

[Optional: Mention previous works, awards, or recognition.]

[Optional: Include personal information like current residence or interests if relevant.]

For more information, visit [website] or follow on [social media platforms].`;
  }

  const handleAddBackMatter = type => {
    const typeConfig = backMatterTypes[type];
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
    onBackMatterAdd(newItem);
  };

  const sortedBackMatter = [...backMatter].sort((a, b) => {
    const aOrder = backMatter.findIndex(item => item.id === a.id);
    const bOrder = backMatter.findIndex(item => item.id === b.id);
    return aOrder - bOrder;
  });

  // Get enabled back matter types for the add dropdown
  const enabledTypes = new Set(backMatter.map(item => item.type));
  const availableTypes = Object.entries(backMatterTypes);

  return (
    <div className="tab-list">
      <div className="tab-list-header">
        <h3>Back Matter</h3>
        <p className="tab-description">
          Add optional back matter sections like epilogue, acknowledgments,
          author bio, and more. These appear after your main story content.
        </p>

        <div className="header-buttons">
          <div className="add-dropdown">
            <button className="primary-btn dropdown-trigger">
              📑+ Add Section
            </button>
            <div className="dropdown-menu">
              {availableTypes.map(([type, config]) => (
                <button
                  key={type}
                  className={`dropdown-item ${enabledTypes.has(type) ? 'disabled' : ''}`}
                  onClick={() => handleAddBackMatter(type)}
                  disabled={enabledTypes.has(type)}
                  title={config.description}
                >
                  <span className="dropdown-icon">{config.icon}</span>
                  <span className="dropdown-text">
                    {config.title}
                    {enabledTypes.has(type) && ' (Added)'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="tab-content-container back-matter-container">
        {backMatter.length === 0 ? (
          <div className="empty-state">
            <p>
              No back matter added yet. Click "📑+ Add Section" to add epilogue,
              acknowledgments, author bio, or other back matter.
            </p>
          </div>
        ) : (
          sortedBackMatter.map(item => {
            const typeConfig = backMatterTypes[item.type] || {
              icon: '📑',
              title: item.type
            };
            const isDraggedOver = dragOverTarget?.id === item.id;

            return (
              <div
                key={item.id}
                className={`front-matter-item ${
                  item.id === currentBackMatterId ? 'active' : ''
                } ${isDraggedOver ? 'drag-over' : ''} ${!item.enabled ? 'disabled' : ''}`}
                onClick={() => onBackMatterSelect(item.id)}
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
                      {item.imageData ? (
                        <span className="image-info">
                          📷 {item.imageFileName || 'Image'}
                        </span>
                      ) : (
                        item.content && (
                          <span className="word-count">
                            {
                              item.content
                                .split(/\s+/)
                                .filter(word => word.length > 0).length
                            }{' '}
                            words
                          </span>
                        )
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
                      onBackMatterToggle(item.id, !item.enabled);
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
                      if (window.confirm(`Delete ${item.title}?`)) {
                        onBackMatterDelete(item.id);
                      }
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

export default BackMatterList;
