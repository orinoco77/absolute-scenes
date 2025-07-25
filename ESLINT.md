# ESLint + Prettier Configuration

This project uses ESLint for code quality and Prettier for code formatting, working together seamlessly.

## Available Scripts

```bash
# Linting (code quality)
npm run lint              # Check for code quality issues
npm run lint:fix          # Fix auto-fixable quality issues
npm run lint:check        # Zero-warnings check (for CI)

# Formatting (code style)
npm run format            # Format all code with Prettier
npm run format:check      # Check if code is properly formatted
```

## How ESLint + Prettier Work Together

### **ESLint** - Code Quality & Logic
- ✅ **Code logic**: unused variables, missing dependencies, etc.
- ✅ **React best practices**: proper hooks usage, JSX patterns
- ✅ **Import organization**: alphabetical ordering, no duplicates
- ✅ **Accessibility**: basic a11y checks
- ✅ **TypeScript**: type checking (if enabled)

### **Prettier** - Code Formatting
- ✅ **Indentation**: consistent 2-space indentation
- ✅ **Quotes**: single quotes for JS, double for JSON/CSS
- ✅ **Semicolons**: always use semicolons
- ✅ **Line length**: 80 characters max
- ✅ **Bracket spacing**: `{ foo }` not `{foo}`
- ✅ **Trailing commas**: none (for better git diffs)

## Configuration Files

### **`.eslintrc.js`** - ESLint Configuration
```javascript
extends: [
  'react-app',
  'react-app/jest',
  'prettier'  // MUST be last - disables formatting rules
]
```

### **`.prettierrc`** - Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "none",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### **Conflict Resolution**
The `eslint-config-prettier` package **automatically disables** all ESLint formatting rules that conflict with Prettier. This means:
- ✅ **No conflicts** between tools
- ✅ **ESLint focuses** on code quality
- ✅ **Prettier focuses** on formatting
- ✅ **One source of truth** for each concern

## IDE Integration

### **VS Code Setup**
Install these extensions:
- `ESLint` (official)
- `Prettier - Code formatter` (official)

Add to your `.vscode/settings.json`:
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "javascriptreact"],
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### **WebStorm/IntelliJ Setup**
1. **Enable ESLint**: `Settings > Languages & Frameworks > JavaScript > Code Quality Tools > ESLint`
2. **Enable Prettier**: `Settings > Languages & Frameworks > JavaScript > Prettier`
3. **Format on save**: `Settings > Tools > Actions on Save > Reformat code`

## Workflow

### **Development Workflow**
1. **Write code** - Focus on logic, not formatting
2. **Save file** - Prettier auto-formats (if configured)
3. **Before commit** - Run `npm run lint` to check quality
4. **Fix issues** - Run `npm run lint:fix` for auto-fixes

### **Pre-commit Hooks** (Optional)
Add to `package.json`:
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run format && npm run lint:check"
    }
  }
}
```

### **CI/CD Pipeline**
```yaml
# In GitHub Actions
- name: Check formatting
  run: npm run format:check

- name: Lint code
  run: npm run lint:check
```

## Rule Categories

### **ESLint Rules (Quality)**
```javascript
// These check code logic and best practices
'no-unused-vars': 'error',           // Catch unused variables
'react-hooks/exhaustive-deps': 'warn', // Check hook dependencies
'import/order': 'error',             // Organize imports
'no-console': 'warn'                 // Warn about console statements
```

### **Prettier Rules (Formatting)**
```json
// These handle code appearance
{
  "printWidth": 80,        // Line length
  "tabWidth": 2,          // Indentation
  "singleQuote": true,    // Quote style
  "semi": true            // Semicolons
}
```

## Common Patterns

### **Disabling Rules**

#### **Disable ESLint for a line**
```javascript
// eslint-disable-next-line no-console
console.log('Debug info');
```

#### **Disable Prettier for a block**
```javascript
// prettier-ignore
const matrix = [
  1, 0, 0,
  0, 1, 0,
  0, 0, 1
];
```

### **Custom Overrides**

#### **File-specific rules**
```javascript
// .eslintrc.js
overrides: [
  {
    files: ['src/utils/**/*.js'],
    rules: {
      'no-console': 'off'  // Allow console in utilities
    }
  }
]
```

#### **File-specific formatting**
```json
// .prettierrc
{
  "overrides": [
    {
      "files": "*.md",
      "options": {
        "printWidth": 100
      }
    }
  ]
}
```

## Troubleshooting

### **"Prettier formatting conflicts with ESLint"**
- ✅ **Solution**: Ensure `prettier` is last in ESLint extends array
- ✅ **Check**: `eslint-config-prettier` is installed

### **"Code keeps getting reformatted differently"**
- ✅ **Solution**: Check that all team members use same Prettier config
- ✅ **Check**: No competing formatters (Beautify, etc.) enabled

### **"ESLint shows formatting errors"**
- ✅ **Solution**: Update ESLint config to extend `prettier`
- ✅ **Check**: Remove manual formatting rules from ESLint

### **"Prettier not running on save"**
- ✅ **Solution**: Check IDE settings for format-on-save
- ✅ **Check**: Default formatter is set to Prettier

## Best Practices

### **✅ Do**
- Let **Prettier handle all formatting**
- Let **ESLint handle code quality**
- Run both tools in CI/CD
- Use format-on-save in your editor
- Commit the config files to version control

### **❌ Don't**
- Add formatting rules to ESLint
- Disable Prettier rules individually
- Mix multiple formatting tools
- Skip running both tools before commits
- Override Prettier with manual formatting

## Project-Specific Settings

### **Why These Settings?**
- **Single quotes**: More common in React/JavaScript projects
- **No trailing commas**: Cleaner git diffs
- **2-space indentation**: React community standard
- **80 character lines**: Good readability on all screens
- **Semicolons**: Explicit and safe

### **File Types Formatted**
- **JavaScript**: `.js`, `.jsx`
- **Styles**: `.css`
- **Data**: `.json`
- **Documentation**: `.md`

### **Excluded Files**
- Node modules
- Build outputs
- Generated files
- Binary assets
- Third-party scripts

---

**Result**: Clean, consistent code with zero formatting conflicts! 🎉
