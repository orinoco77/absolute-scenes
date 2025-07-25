// Quick fixes script - this documents the remaining fixes needed

/*
Files that need React import removed (React 17+ doesn't need React import for JSX):

1. CharacterThreadVisualization.js - Remove React, fix unused variables
2. ExportDialog.js - Remove React
3. FontPreview.js - Remove React, fix unused useEffect import, fix JSX formatting
4. FontPreviewDialog.js - Remove React, fix unused imports, fix array index key
5. GitHubIntegration.js - Remove React, fix anchor href
6. LocationEditor.js - Remove React  
7. LocationList.js - Remove React
8. SceneEditor.js - Remove React, fix unused imports, fix unused template param
9. SceneList.js - Fix JSX formatting
10. StatusBar.js - Remove React
11. TemplateManager.js - Remove React
12. index.js - Remove React (if it has it)
13. All test files - Remove React imports
14. All utility files - Fix console statements, unused variables, anonymous exports

Major fixes needed:
- Unused variables should be prefixed with underscore
- Console statements in src/ should be warnings, not errors (our config allows them)
- Import order issues
- React hooks dependency arrays
- JSX formatting issues
*/

console.log('This script documents the fixes needed for the remaining ESLint errors');
