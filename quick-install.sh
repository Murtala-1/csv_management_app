#!/bin/bash

echo "🚀 Quick Install Script for CSV Management App"
echo "=============================================="

cd frontend

echo "🗑️ Cleaning up..."
rm -rf node_modules package-lock.json

echo "📦 Using simplified package.json..."
cp package-simple.json package.json

echo "⚙️ Installing core dependencies only..."
npm install react react-dom react-scripts@4.0.3 --legacy-peer-deps

echo "📦 Installing additional dependencies..."
npm install axios react-dropzone react-hot-toast lucide-react clsx --legacy-peer-deps

echo "✅ Installation complete!"
echo ""
echo "🚀 To start the app:"
echo "cd frontend && npm start"