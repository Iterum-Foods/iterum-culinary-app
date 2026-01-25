# Contributing to Iterum Culinary App

Thank you for your interest in contributing to Iterum Culinary App! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm 8+
- Modern web browser
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/Iterum-Foods/iterum-culinary-app.git
   cd iterum-culinary-app
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Local Server**
   ```bash
   npm start
   # Or: npm run dev (with auto-reload)
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## 📝 Development Workflow

### 1. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes
- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation as needed

### 3. Test Your Changes
- Test locally in multiple browsers
- Run `npm test` to ensure tests pass
- Test edge cases
- Verify no console errors

### 4. Commit Your Changes
```bash
git add .
git commit -m "type(scope): description"
```

**Commit Message Format:**
```
type(scope): short description

Longer description if needed

Closes #issue-number
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

### 5. Push and Create PR
```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 🎨 Code Style

### JavaScript
- Use ES6+ features
- Follow existing code patterns
- Use meaningful variable names
- Add JSDoc comments for functions
- Keep functions focused and small

### CSS
- Use CSS variables from `iterum-brand-kit.css`
- Follow BEM naming convention where applicable
- Keep styles organized and commented
- Use semantic class names

### HTML
- Use semantic HTML5 elements
- Include proper accessibility attributes
- Keep structure clean and readable
- Comment complex sections

## 🧪 Testing Guidelines

### Before Submitting
- [ ] All existing tests pass
- [ ] New features have tests
- [ ] Tested in Chrome, Firefox, Safari, Edge
- [ ] Tested on mobile devices (if UI changes)
- [ ] No console errors or warnings
- [ ] Performance is acceptable

### Writing Tests
- Write descriptive test names
- Test happy paths and edge cases
- Test error handling
- Keep tests independent and isolated

## 📋 Pull Request Process

1. **Update Documentation**
   - Update README if needed
   - Add/update code comments
   - Update CHANGELOG.md

2. **Fill Out PR Template**
   - Describe your changes
   - Link related issues
   - Add screenshots if UI changes
   - Complete the checklist

3. **Request Review**
   - Assign appropriate reviewers
   - Add relevant labels
   - Wait for review and address feedback

4. **Merge**
   - Once approved, maintainers will merge
   - Your PR will be automatically deployed to Firebase

## 🐛 Reporting Bugs

### Before Reporting
- Check existing issues
- Search closed issues
- Test in latest browser version
- Clear browser cache

### Bug Report Template
Use the bug report template and include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Console errors (if any)
- Screenshots (if applicable)

## 💡 Suggesting Features

### Before Suggesting
- Check existing feature requests
- Consider if it fits the project scope
- Think about implementation complexity

### Feature Request Template
Use the feature request template and include:
- Clear description
- Use case/benefit
- Proposed solution
- Alternatives considered
- Mockups/wireframes (if UI)

## 🔒 Security Issues

**DO NOT** create public issues for security vulnerabilities.

Instead:
1. Email: security@iterum-foods.com
2. Include detailed information
3. Wait for response before disclosure

See [SECURITY.md](SECURITY.md) for details.

## 📚 Resources

### Documentation
- [README.md](README.md) - Project overview
- [SECURITY.md](SECURITY.md) - Security policy
- [Firebase Setup Guide](FIREBASE_SETUP_STATUS.md) - Deployment info

### Getting Help
- Check existing issues
- Search documentation
- Ask in discussions (if enabled)
- Create a question issue

## 🎯 Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the project

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Personal attacks
- Publishing others' private information

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Acknowledged in documentation

Thank you for contributing to Iterum Culinary App! 🍳

