# 🏠 Test Your App Offline (Local Development)

## ✅ **Quick Start: Run Local Server**

### **Method 1: Using npm (Simplest)** ⭐ **RECOMMENDED**

**Step 1: Open Command Prompt or Terminal**
```cmd
cd "C:\Users\chefm\Iterum Innovation\iterum-culinary-app"
```

**Step 2: Install dependencies (if not already installed)**
```cmd
npm install
```

**Step 3: Start local server**
```cmd
npm start
```

**That's it!** The app will open automatically in your browser at:
- **URL:** `http://localhost:8080`

---

### **Method 2: Using Python HTTP Server** 🐍

If you have Python installed:

```cmd
cd "C:\Users\chefm\Iterum Innovation\iterum-culinary-app\public"
python -m http.server 8080
```

Then open: `http://localhost:8080`

---

### **Method 3: Using http-server directly** 🌐

If http-server is installed globally:

```cmd
cd "C:\Users\chefm\Iterum Innovation\iterum-culinary-app\public"
http-server -p 8080 -o
```

---

## 📋 **Available npm Scripts**

From `package.json`, you have these commands:

### **Start with auto-open browser:**
```cmd
npm start
```
Runs: `http-server public -p 8080 -o`

### **Start with no cache (for testing):**
```cmd
npm run dev
```
Runs: `http-server public -p 8080 -o -c-1` (clears cache)

---

## 🌐 **Local URLs**

Once the server is running:

- **Main App:** `http://localhost:8080/index.html`
- **Landing Page:** `http://localhost:8080/landing.html`
- **Dashboard:** `http://localhost:8080/dashboard.html`
- **Recipe Developer:** `http://localhost:8080/recipe-developer.html`
- **Menu Builder:** `http://localhost:8080/menu-builder.html`
- **Ingredients:** `http://localhost:8080/ingredients.html`
- **Tech Stage:** `http://localhost:8080/landing.html#tech-stage`
- **Business Plan:** `http://localhost:8080/landing.html#business-plan`
- **Investors:** `http://localhost:8080/landing.html#investors`

---

## 🔥 **Testing Firebase Features Locally**

### **Note about Firebase:**
- Firebase Authentication will work locally (uses Firebase servers)
- Firestore will work locally (uses Firebase servers)
- Storage will work locally (uses Firebase servers)

**You need internet connection for Firebase services**, but the app HTML/CSS/JS runs locally.

---

## 🛑 **Stop the Server**

Press `Ctrl + C` in the terminal/command prompt window.

---

## 🔧 **Troubleshooting**

### **Port 8080 already in use?**
Change the port:
```cmd
http-server public -p 3000 -o
```
Then open: `http://localhost:3000`

### **npm not found?**
Install Node.js: https://nodejs.org/

### **Dependencies not installed?**
```cmd
npm install
```

---

## ✅ **Quick Command**

**Just run this:**
```cmd
npm start
```

**The app will open at:** `http://localhost:8080` 🎉

