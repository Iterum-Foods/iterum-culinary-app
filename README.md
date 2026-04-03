# 🍳 Iterum Culinary R&D App

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://iterum-culinary-app.vercel.app)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

A comprehensive culinary research and development application for chefs, food service professionals, and culinary enthusiasts.

🌐 **Live Site (Vercel)**: [https://iterum-culinary-app.vercel.app](https://iterum-culinary-app.vercel.app)

## 🚀 Features

### **User Management System**
- **Multi-User Profiles**: Create and manage multiple chef profiles
- **Project-Based Organization**: Organize work by projects (Master, Client, etc.)
- **Cross-Page Synchronization**: User and project selection persists across all pages

### **Recipe Development**
- **Recipe Ideas Management**: Capture and organize culinary concepts
- **Recipe Builder**: Comprehensive recipe development with ingredients, instructions, and notes
- **PDF Recipe Import**: Convert existing recipe PDFs into structured data
- **Recipe Versioning**: Track changes and improvements over time

### **Project Management**
- **Project Organization**: Separate data by project for different clients or purposes
- **Data Tagging**: Organize information with custom tags and categories
- **Progress Tracking**: Monitor development status and milestones

### **Data Management**
- **Ingredient Library**: Comprehensive ingredient database with nutritional information
- **Vendor Management**: Track suppliers and vendor relationships
- **Equipment Tracking**: Manage kitchen equipment and maintenance
- **Menu Planning**: Build and organize menus for different occasions

### **Storage & Security**
- **User-Controlled Storage**: Local data storage with export/backup capabilities
- **Offline-First Design**: Works without internet connection
- **Data Portability**: Easy data export and import between systems
- **🔒 Advanced Security Features**:
  - **XSS Protection**: Safe HTML injection with input sanitization
  - **Data Encryption**: AES-GCM encryption for sensitive localStorage data
  - **Content Security Policy (CSP)**: Comprehensive security headers and violation monitoring
  - **Input Validation**: Robust validation for all user inputs
  - **API Security**: Secure fetch wrapper with request sanitization and response validation
  - **Security Monitoring**: Real-time violation logging and reporting

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS, Custom Design System
- **Backend**: Firebase (Authentication, Firestore, Cloud Storage rules)
- **Storage**: LocalStorage, IndexedDB, Firebase Firestore
- **Build Tools**: Modern JavaScript with ES6 modules
- **Deployment**: **Vercel** (static hosting); Firebase for auth + data rules
- **Compatibility**: Modern browsers (Chrome, Firefox, Safari, Edge)

## 📋 Prerequisites

- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- Local file system access or HTTP server
- JavaScript enabled

## 🚀 Quick Start

### **Option 1: Direct File Access**
1. Clone or download this repository
2. Navigate to the `Iterum App` folder
3. Open `index.html` in your web browser
4. Create your first user profile and start using the app

### **Option 2: Local HTTP Server (Recommended)**
1. Clone this repository:
   ```bash
   git clone https://github.com/Iterum-Foods/iterum-culinary-app.git
   cd iterum-culinary-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start a local HTTP server:

```bash
# Using npm (recommended)
npm start
# Opens http://localhost:8080 automatically

# Or manually:
npx http-server public -p 8080

# Python 3
python -m http.server 8080

# PHP
php -S localhost:8080
```

4. Open `http://localhost:8080` in your browser
5. Create your first user profile and start using the app

### **Option 3: Deploy frontend (Vercel)**
Connect the repo to Vercel with root **`public`** as the static output (or your team’s Vercel project settings). Production URL: **https://iterum-culinary-app.vercel.app**

### **Option 4: Deploy Firebase rules only (not hosting)**
Firestore + Storage security rules: `firebase deploy --only firestore:rules,storage --project iterum-culinary-app2`

## 🔧 Development Setup

### **Project Structure**
```
iterum-culinary-app/
├── public/                    # Static app (deployed via Vercel)
│   ├── index.html            # Landing/login page
│   ├── dashboard.html        # Main dashboard
│   ├── assets/               # Static assets
│   │   ├── js/               # JavaScript modules (124 files)
│   │   ├── css/              # Stylesheets
│   │   ├── icons/            # Icons
│   │   └── images/           # Images
│   └── data/                 # Data files and catalogs
├── docs/                      # Documentation
├── .github/                   # GitHub templates and workflows
├── firebase.json             # Firebase configuration
├── firestore.rules          # Firestore security rules
└── package.json             # Node.js dependencies
```

### **Key JavaScript Modules**
- **`unified_auth_system.js`**: User authentication and profile management
- **`project-management-system.js`**: Project organization and data tagging
- **`userControlledStorage.js`**: Data storage and management
- **`header_user_sync.js`**: Cross-page user interface synchronization

## 🧪 Testing

### **Test Pages**
- **`test_user_loading_fixed.html`**: Test user loading functionality
- **`test_user_switch_dropdown.html`**: Test user switching interface
- **`test_project_persistence.html`**: Test project data persistence

### **Debug Tools**
- Built-in debug buttons in the user interface
- Console logging for troubleshooting
- User loading diagnostics

## 🐛 Known Issues

### **Current Status**
- ✅ User authentication system implemented
- ✅ Project management system working
- ✅ Cross-page data synchronization
- ✅ Recipe development tools
- ⚠️ User loading optimization in progress
- ⚠️ Some cross-page sync edge cases

### **Recent Fixes**
- User loading now defaults to offline mode (no more 404 errors)
- Enhanced user storage scanning and merging
- Improved project persistence across pages

## 📝 Contributing

### **Reporting Issues**
1. Use the appropriate issue template:
   - [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md)
   - [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md)
   - [User Loading Issue](.github/ISSUE_TEMPLATE/user_loading_issue.md)

2. Include detailed reproduction steps
3. Attach console logs and screenshots
4. Specify your environment details

### **Development Workflow**
1. Create a feature branch for your changes
2. Test thoroughly before submitting
3. Update documentation as needed
4. Submit a pull request with clear description

## 🔒 Privacy & Data

- **Local Storage**: All data is stored locally on your device
- **No Cloud Sync**: No data is transmitted to external servers
- **Export Control**: You control when and how data is exported
- **Offline Operation**: Full functionality without internet connection

## 📱 Browser Compatibility

| Browser | Version | Status |
|---------|---------|---------|
| Chrome  | 80+     | ✅ Full Support |
| Firefox | 75+     | ✅ Full Support |
| Safari  | 13+     | ✅ Full Support |
| Edge    | 80+     | ✅ Full Support |

## 🆘 Support

### **Getting Help**
1. Check the [Issues](../../issues) page for known problems
2. Search existing issues for similar problems
3. Create a new issue with detailed information
4. Include console logs and reproduction steps

### **Common Solutions**
- **User Loading Issues**: Try refreshing the page or clearing browser cache
- **Data Not Persisting**: Check if you're on the correct project
- **Interface Sync Issues**: Ensure you're logged in with a valid user profile

## 🔒 Security Features

This application implements comprehensive security measures to protect user data and prevent common web vulnerabilities:

### **XSS Protection**
- Safe HTML injection using trusted content flags
- Input sanitization for all user-provided content
- Automatic escaping of potentially dangerous characters

### **Data Encryption**
- AES-GCM encryption for sensitive localStorage data
- Automatic encryption/decryption of user sessions
- Secure key generation and management

### **Content Security Policy (CSP)**
- Strict CSP headers to prevent code injection
- Violation monitoring and reporting
- Real-time security event logging

### **Input Validation**
- Comprehensive validation for emails, passwords, and text inputs
- File upload security checks
- Number and data type validation

### **API Security**
- Secure fetch wrapper with authentication tokens
- Request sanitization and validation
- Response integrity checks

### **Security Monitoring**
- Real-time violation logging
- Security event tracking
- Automated threat detection

For detailed security information, see [SECURITY_IMPLEMENTATION_SUMMARY.md](SECURITY_IMPLEMENTATION_SUMMARY.md).

## 📄 License

This project is developed for culinary professionals and enthusiasts. Please respect the work and contribute positively to the community.

## 🙏 Acknowledgments

- Built for the culinary community
- Designed for real-world kitchen workflows
- Focused on user experience and data integrity
- Enhanced with enterprise-grade security features

---

**🍳 Happy Cooking and Developing! 🚀**