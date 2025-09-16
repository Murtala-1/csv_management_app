#!/bin/bash

echo "🔧 Fixing babel-jest version conflict..."

cd frontend

# Method 1: Use minimal package.json
echo "📦 Step 1: Using minimal package.json..."
cp package-minimal.json package.json

# Method 2: Clear everything
echo "🗑️ Step 2: Cleaning up..."
rm -rf node_modules package-lock.json
npm cache clean --force

# Method 3: Try different installation approaches
echo "🚀 Step 3: Trying installation..."

echo "Attempt 1: Basic install..."
timeout 60 npm install --legacy-peer-deps

if [ $? -eq 0 ]; then
    echo "✅ Basic install successful!"
    echo "🎯 Now installing additional packages..."
    npm install axios react-dropzone react-hot-toast lucide-react clsx --legacy-peer-deps
    echo "✅ All packages installed!"
    echo "🚀 Try: npm start"
    exit 0
fi

echo "⚠️ Basic install failed, trying alternative..."

echo "Attempt 2: Force install..."
timeout 60 npm install --force

if [ $? -eq 0 ]; then
    echo "✅ Force install successful!"
    echo "🎯 Now installing additional packages..."
    npm install axios react-dropzone react-hot-toast lucide-react clsx --force
    echo "✅ All packages installed!"
    echo "🚀 Try: npm start"
    exit 0
fi

echo "⚠️ Force install failed, trying manual approach..."

echo "Attempt 3: Manual package installation..."
npm install react@17.0.2 --legacy-peer-deps
npm install react-dom@17.0.2 --legacy-peer-deps
npm install react-scripts@4.0.3 --legacy-peer-deps

if [ $? -eq 0 ]; then
    echo "✅ Manual install successful!"
    echo "🎯 Now installing additional packages..."
    npm install axios react-dropzone react-hot-toast lucide-react clsx --legacy-peer-deps
    echo "✅ All packages installed!"
    echo "🚀 Try: npm start"
    exit 0
fi

echo "❌ All installation methods failed."
echo ""
echo "🛠️ Manual solutions:"
echo "1. Check your internet connection"
echo "2. Try: npm config set registry https://registry.npmjs.org/"
echo "3. Try: npm install -g yarn && yarn install"
echo "4. Try using a different Node.js version (nvm use 16)"
echo ""
echo "🚀 Alternative: Use Create React App fresh:"
echo "npx create-react-app csv-frontend"
echo "Then copy your src files over"