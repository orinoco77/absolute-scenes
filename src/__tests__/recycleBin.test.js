/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
/* eslint-disable jest/no-conditional-expect */
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App.jsx';

// Mock file operations
jest.mock('../utils/fileOperations', () => ({
  saveBook: jest.fn(() => Promise.resolve({ success: true })),
  loadBook: jest.fn(),
  saveBookToFile: jest.fn()
}));

// Mock all service dependencies
jest.mock('../services/SaveService', () => ({
  SaveService: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    createDebouncedSave: jest.fn(() => jest.fn()),
    saveBookData: jest.fn(() => Promise.resolve({ success: true })),
    saveAsBookData: jest.fn(() => Promise.resolve({ success: true })),
    isSaveInProgress: jest.fn(() => false)
  }))
}));

jest.mock('../services/GitHubSyncService', () => ({
  GitHubSyncService: jest.fn().mockImplementation(() => ({
    syncWithGitHub: jest.fn()
  }))
}));

jest.mock('../services/EventHandlerService', () => ({
  EventHandlerService: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    exposeToElectron: jest.fn(),
    isElectron: jest.fn(() => false),
    updateWindowTitle: jest.fn(),
    setupBeforeUnloadHandler: jest.fn(() => jest.fn()),
    setupKeyboardShortcuts: jest.fn(() => jest.fn()),
    setupIpcHandlers: jest.fn(() => jest.fn()),
    cleanup: jest.fn()
  }))
}));

jest.mock('../services/ThemeService', () => ({
  ThemeService: jest.fn().mockImplementation(() => ({
    initialize: jest.fn()
  }))
}));

// Mock BookStructure with necessary UI elements
jest.mock('../components/BookStructure', () => {
  return function MockedBookStructure(props) {
    return (
      <div data-testid="book-structure">
        <button onClick={() => props.onTabChange('manuscript')}>
          Manuscript Tab
        </button>
        <button onClick={() => props.onTabChange('characters')}>
          Characters Tab
        </button>
        <button onClick={() => props.onTabChange('locations')}>
          Locations Tab
        </button>
        <button onClick={() => props.onTabChange('background')}>
          Background Tab
        </button>

        <button onClick={props.onSceneAdd}>Add Scene</button>
        <button onClick={props.onChapterAdd}>Add Chapter</button>
      </div>
    );
  };
});

// Mock components to make tests faster
jest.mock('../components/BackupRecovery', () => () => null);
jest.mock('../components/ConflictResolution', () => () => null);
jest.mock('../components/ExportDialog', () => () => null);
jest.mock('../components/GitHubIntegration', () => () => null);
jest.mock('../components/SpellCheckSettings', () => () => null);
jest.mock('../components/TemplateManager', () => () => null);
jest.mock('../components/FontSettings', () => () => null);

// Mock the main editors
jest.mock('../components/SceneEditor', () => ({ scene }) => (
  <div data-testid="scene-editor">{scene?.title || 'No scene'}</div>
));

jest.mock('../components/CharacterEditor', () => ({ character }) => (
  <div data-testid="character-editor">{character?.name || 'No character'}</div>
));

jest.mock('../components/LocationEditor', () => ({ location }) => (
  <div data-testid="location-editor">{location?.name || 'No location'}</div>
));

jest.mock('../components/BackgroundEditor', () => ({ document }) => (
  <div data-testid="background-editor">{document?.title || 'No document'}</div>
));

jest.mock('../components/FrontMatterEditor', () => () => (
  <div data-testid="frontmatter-editor" />
));

jest.mock('../components/BackMatterEditor', () => () => (
  <div data-testid="backmatter-editor" />
));

jest.mock('../components/IllustrationEditor', () => () => (
  <div data-testid="illustration-editor" />
));

jest.mock('../components/StatusBar', () => () => null);

describe('Recycle Bin Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Document Recycle Bin', () => {
    test('deleting a document adds it to background recycle bin with position', async () => {
      const { container } = render(<App />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Switch to background tab
      const backgroundTab = screen.getByText('Background Tab');
      fireEvent.click(backgroundTab);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Add a folder and multiple documents
      const addFolderBtn = container.querySelector('[title="Add Folder"]');
      if (addFolderBtn) {
        fireEvent.click(addFolderBtn);

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Add three documents to establish position
        const addDocBtn = container.querySelector('[title="Add Document"]');
        if (addDocBtn) {
          fireEvent.click(addDocBtn); // Doc at position 0
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });

          fireEvent.click(addDocBtn); // Doc at position 1
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });

          fireEvent.click(addDocBtn); // Doc at position 2
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });

          // Delete the middle document (position 1)
          const deleteButtons = container.querySelectorAll(
            '.document-item button[title="Delete document"]'
          );
          if (deleteButtons.length > 1) {
            fireEvent.click(deleteButtons[1]);

            await act(async () => {
              await new Promise(resolve => setTimeout(resolve, 50));
            });

            // Check that recycle bin button shows 1 item
            const recycleBinBtn = container.querySelector(
              'button[title*="Background Recycle Bin"]'
            );
            expect(recycleBinBtn).toBeInTheDocument();
            expect(recycleBinBtn?.textContent).toContain('1');
          }
        }
      }
    });

    test('restoring a document returns it to original position', async () => {
      const { container } = render(<App />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Switch to background tab
      const backgroundTab = screen.getByText('Background Tab');
      fireEvent.click(backgroundTab);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Add a folder and documents
      const addFolderBtn = container.querySelector('[title="Add Folder"]');
      if (addFolderBtn) {
        fireEvent.click(addFolderBtn);

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        const addDocBtn = container.querySelector('[title="Add Document"]');
        if (addDocBtn) {
          // Add three documents
          fireEvent.click(addDocBtn);
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });
          fireEvent.click(addDocBtn);
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });
          fireEvent.click(addDocBtn);
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });

          const documentsBefore = container.querySelectorAll('.document-item');
          const initialCount = documentsBefore.length;

          // Delete middle document
          const deleteButtons = container.querySelectorAll(
            '.document-item button[title="Delete document"]'
          );
          if (deleteButtons.length > 1) {
            fireEvent.click(deleteButtons[1]);

            await act(async () => {
              await new Promise(resolve => setTimeout(resolve, 50));
            });

            const documentsAfterDelete =
              container.querySelectorAll('.document-item');
            expect(documentsAfterDelete.length).toBe(initialCount - 1);

            // Open recycle bin
            const recycleBinBtn = container.querySelector(
              'button[title*="Background Recycle Bin"]'
            );
            if (recycleBinBtn) {
              fireEvent.click(recycleBinBtn);

              await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
              });

              // Restore the document
              const restoreBtn = container.querySelector(
                '.recycle-bin-item button[title="Restore document"]'
              );
              if (restoreBtn) {
                fireEvent.click(restoreBtn);

                await act(async () => {
                  await new Promise(resolve => setTimeout(resolve, 50));
                });

                // Check that document count is restored
                const documentsAfterRestore =
                  container.querySelectorAll('.document-item');
                expect(documentsAfterRestore.length).toBe(initialCount);
              }
            }
          }
        }
      }
    });

    test('permanently deleting a document removes it from recycle bin', async () => {
      const { container } = render(<App />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Switch to background tab
      const backgroundTab = screen.getByText('Background Tab');
      fireEvent.click(backgroundTab);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Add a folder and document
      const addFolderBtn = container.querySelector('[title="Add Folder"]');
      if (addFolderBtn) {
        fireEvent.click(addFolderBtn);

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        const addDocBtn = container.querySelector('[title="Add Document"]');
        if (addDocBtn) {
          fireEvent.click(addDocBtn);

          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });

          // Delete the document
          const deleteBtn = container.querySelector(
            '.document-item button[title="Delete document"]'
          );
          if (deleteBtn) {
            fireEvent.click(deleteBtn);

            await act(async () => {
              await new Promise(resolve => setTimeout(resolve, 50));
            });

            // Open recycle bin
            const recycleBinBtn = container.querySelector(
              'button[title*="Background Recycle Bin"]'
            );
            expect(recycleBinBtn?.textContent).toContain('1');

            if (recycleBinBtn) {
              fireEvent.click(recycleBinBtn);

              await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
              });

              // Permanently delete
              const permanentDeleteBtn = container.querySelector(
                '.recycle-bin-item button[title="Permanently delete"]'
              );
              if (permanentDeleteBtn) {
                fireEvent.click(permanentDeleteBtn);

                await act(async () => {
                  await new Promise(resolve => setTimeout(resolve, 50));
                });

                // Check that recycle bin is empty
                const emptyBin = container.querySelector('.empty-bin');
                expect(emptyBin).toBeInTheDocument();
              }
            }
          }
        }
      }
    });

    test('restoring document to deleted folder falls back to first folder', async () => {
      const { container } = render(<App />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Switch to background tab
      const backgroundTab = screen.getByText('Background Tab');
      fireEvent.click(backgroundTab);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Add two folders
      const addFolderBtn = container.querySelector('[title="Add Folder"]');
      if (addFolderBtn) {
        fireEvent.click(addFolderBtn); // Folder 1

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        fireEvent.click(addFolderBtn); // Folder 2

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Select second folder and add document
        const folderItems = container.querySelectorAll('.folder-item');
        if (folderItems.length > 1) {
          fireEvent.click(folderItems[1]);

          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });

          const addDocBtn = container.querySelector('[title="Add Document"]');
          if (addDocBtn) {
            fireEvent.click(addDocBtn);

            await act(async () => {
              await new Promise(resolve => setTimeout(resolve, 50));
            });

            // Delete the document
            const deleteDocBtn = container.querySelector(
              '.document-item button[title="Delete document"]'
            );
            if (deleteDocBtn) {
              fireEvent.click(deleteDocBtn);

              await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
              });

              // Delete the second folder
              const deleteFolderBtn = Array.from(
                container.querySelectorAll('button[title="Delete Folder"]')
              )[1];
              if (deleteFolderBtn) {
                fireEvent.click(deleteFolderBtn);

                await act(async () => {
                  await new Promise(resolve => setTimeout(resolve, 50));
                });

                // Open recycle bin and restore document
                const recycleBinBtn = container.querySelector(
                  'button[title*="Background Recycle Bin"]'
                );
                if (recycleBinBtn) {
                  fireEvent.click(recycleBinBtn);

                  await act(async () => {
                    await new Promise(resolve => setTimeout(resolve, 50));
                  });

                  const restoreBtn = container.querySelector(
                    '.recycle-bin-item button[title="Restore document"]'
                  );
                  if (restoreBtn) {
                    fireEvent.click(restoreBtn);

                    await act(async () => {
                      await new Promise(resolve => setTimeout(resolve, 50));
                    });

                    // Document should be restored to first folder
                    const documentsInFirstFolder =
                      container.querySelectorAll('.document-item');
                    expect(documentsInFirstFolder.length).toBeGreaterThan(0);
                  }
                }
              }
            }
          }
        }
      }
    });
  });

  describe('Character Recycle Bin', () => {
    test('deleting a character adds it to character recycle bin', async () => {
      const { container } = render(<App />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Switch to characters tab
      const charactersTab = screen.getByText('Characters Tab');
      fireEvent.click(charactersTab);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Add a character
      const addCharBtn = container.querySelector('[title="Add Character"]');
      if (addCharBtn) {
        fireEvent.click(addCharBtn);

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Delete the character
        const deleteBtn = container.querySelector(
          'button[title="Delete character"]'
        );
        if (deleteBtn) {
          fireEvent.click(deleteBtn);

          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });

          // Check recycle bin has 1 item
          const recycleBinBtn = container.querySelector(
            'button[title*="Character Recycle Bin"]'
          );
          expect(recycleBinBtn).toBeInTheDocument();
          expect(recycleBinBtn?.textContent).toContain('1');
        }
      }
    });

    test('restoring a character adds it back to character list', async () => {
      const { container } = render(<App />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Switch to characters tab
      const charactersTab = screen.getByText('Characters Tab');
      fireEvent.click(charactersTab);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Add a character
      const addCharBtn = container.querySelector('[title="Add Character"]');
      if (addCharBtn) {
        fireEvent.click(addCharBtn);

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        const charactersBefore = container.querySelectorAll('.character-item');
        const initialCount = charactersBefore.length;

        // Delete the character
        const deleteBtn = container.querySelector(
          'button[title="Delete character"]'
        );
        if (deleteBtn) {
          fireEvent.click(deleteBtn);

          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });

          const charactersAfterDelete =
            container.querySelectorAll('.character-item');
          expect(charactersAfterDelete.length).toBe(initialCount - 1);

          // Open recycle bin and restore
          const recycleBinBtn = container.querySelector(
            'button[title*="Character Recycle Bin"]'
          );
          if (recycleBinBtn) {
            fireEvent.click(recycleBinBtn);

            await act(async () => {
              await new Promise(resolve => setTimeout(resolve, 50));
            });

            const restoreBtn = container.querySelector(
              '.recycle-bin-item button[title="Restore character"]'
            );
            if (restoreBtn) {
              fireEvent.click(restoreBtn);

              await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
              });

              const charactersAfterRestore =
                container.querySelectorAll('.character-item');
              expect(charactersAfterRestore.length).toBe(initialCount);
            }
          }
        }
      }
    });
  });

  describe('Location Recycle Bin', () => {
    test('deleting a location adds it to location recycle bin', async () => {
      const { container } = render(<App />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Switch to locations tab
      const locationsTab = screen.getByText('Locations Tab');
      fireEvent.click(locationsTab);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Add a location
      const addLocBtn = container.querySelector('[title="Add Location"]');
      if (addLocBtn) {
        fireEvent.click(addLocBtn);

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Delete the location
        const deleteBtn = container.querySelector(
          'button[title="Delete location"]'
        );
        if (deleteBtn) {
          fireEvent.click(deleteBtn);

          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });

          // Check recycle bin has 1 item
          const recycleBinBtn = container.querySelector(
            'button[title*="Location Recycle Bin"]'
          );
          expect(recycleBinBtn).toBeInTheDocument();
          expect(recycleBinBtn?.textContent).toContain('1');
        }
      }
    });

    test('restoring a location adds it back to location list', async () => {
      const { container } = render(<App />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Switch to locations tab
      const locationsTab = screen.getByText('Locations Tab');
      fireEvent.click(locationsTab);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Add a location
      const addLocBtn = container.querySelector('[title="Add Location"]');
      if (addLocBtn) {
        fireEvent.click(addLocBtn);

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        const locationsBefore = container.querySelectorAll('.location-item');
        const initialCount = locationsBefore.length;

        // Delete the location
        const deleteBtn = container.querySelector(
          'button[title="Delete location"]'
        );
        if (deleteBtn) {
          fireEvent.click(deleteBtn);

          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });

          const locationsAfterDelete =
            container.querySelectorAll('.location-item');
          expect(locationsAfterDelete.length).toBe(initialCount - 1);

          // Open recycle bin and restore
          const recycleBinBtn = container.querySelector(
            'button[title*="Location Recycle Bin"]'
          );
          if (recycleBinBtn) {
            fireEvent.click(recycleBinBtn);

            await act(async () => {
              await new Promise(resolve => setTimeout(resolve, 50));
            });

            const restoreBtn = container.querySelector(
              '.recycle-bin-item button[title="Restore location"]'
            );
            if (restoreBtn) {
              fireEvent.click(restoreBtn);

              await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
              });

              const locationsAfterRestore =
                container.querySelectorAll('.location-item');
              expect(locationsAfterRestore.length).toBe(initialCount);
            }
          }
        }
      }
    });
  });

  describe('Scene and Chapter Recycle Bin', () => {
    test('deleting a scene adds it to recycle bin with chapter info', async () => {
      const { container } = render(<App />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Add a scene to the default chapter
      const addSceneBtn = screen.getByText('Add Scene');
      fireEvent.click(addSceneBtn);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Delete the scene
      const deleteBtn = container.querySelector('button[title="Delete scene"]');
      if (deleteBtn) {
        fireEvent.click(deleteBtn);

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Check recycle bin has 1 item
        const recycleBinBtn = container.querySelector(
          'button[title*="Recycle Bin"]'
        );
        expect(recycleBinBtn).toBeInTheDocument();
        expect(recycleBinBtn?.textContent).toMatch(/\(\d+\)/);
      }
    });

    test('restoring a scene returns it to original chapter', async () => {
      const { container } = render(<App />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Add a scene
      const addSceneBtn = screen.getByText('Add Scene');
      fireEvent.click(addSceneBtn);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      const scenesBefore = container.querySelectorAll('.scene-item');
      const initialCount = scenesBefore.length;

      // Delete the scene
      const deleteBtn = container.querySelector('button[title="Delete scene"]');
      if (deleteBtn) {
        fireEvent.click(deleteBtn);

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        const scenesAfterDelete = container.querySelectorAll('.scene-item');
        expect(scenesAfterDelete.length).toBe(initialCount - 1);

        // Open recycle bin and restore
        const recycleBinBtn = container.querySelector(
          'button[title*="Recycle Bin"]'
        );
        if (recycleBinBtn) {
          fireEvent.click(recycleBinBtn);

          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });

          const restoreBtn = container.querySelector(
            '.recycle-bin-item button[title="Restore item"]'
          );
          if (restoreBtn) {
            fireEvent.click(restoreBtn);

            await act(async () => {
              await new Promise(resolve => setTimeout(resolve, 50));
            });

            const scenesAfterRestore =
              container.querySelectorAll('.scene-item');
            expect(scenesAfterRestore.length).toBe(initialCount);
          }
        }
      }
    });

    test('deleting a chapter adds it to recycle bin with all scenes', async () => {
      const { container } = render(<App />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Add a new chapter
      const addChapterBtn = screen.getByText('Add Chapter');
      fireEvent.click(addChapterBtn);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Delete the chapter
      const deleteBtn = container.querySelector(
        'button[title="Delete Chapter"]'
      );
      if (deleteBtn) {
        fireEvent.click(deleteBtn);

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Check recycle bin has 1 item
        const recycleBinBtn = container.querySelector(
          'button[title*="Recycle Bin"]'
        );
        expect(recycleBinBtn).toBeInTheDocument();
      }
    });
  });

  describe('Empty Recycle Bin', () => {
    test('emptying recycle bin removes all items', async () => {
      const { container } = render(<App />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Add and delete a scene
      const addSceneBtn = screen.getByText('Add Scene');
      fireEvent.click(addSceneBtn);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      const deleteBtn = container.querySelector('button[title="Delete scene"]');
      if (deleteBtn) {
        fireEvent.click(deleteBtn);

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Open recycle bin
        const recycleBinBtn = container.querySelector(
          'button[title*="Recycle Bin"]'
        );
        if (recycleBinBtn) {
          fireEvent.click(recycleBinBtn);

          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });

          // Empty the bin
          const emptyBinBtn = container.querySelector(
            'button[title="Permanently delete all items"]'
          );
          if (emptyBinBtn) {
            fireEvent.click(emptyBinBtn);

            await act(async () => {
              await new Promise(resolve => setTimeout(resolve, 50));
            });

            // Check that bin is empty
            const emptyBinMessage = container.querySelector('.empty-bin');
            expect(emptyBinMessage).toBeInTheDocument();
          }
        }
      }
    });
  });
});
