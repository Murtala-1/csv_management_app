#!/bin/bash

# Render Build Script for CSV Management App
echo "🚀 Starting Render build process..."

# Install backend dependencies (production only)
echo "📦 Installing backend dependencies..."
cd backend
npm ci --only=production

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm ci

# Build React application
echo "🏗️ Building React application..."
npm run build

# Move build files to backend public directory
echo "📁 Moving build files to backend..."
mv build ../backend/public

# Return to root directory
cd ..

echo "✅ Build process completed successfully!"
echo "🎯 Ready for deployment on Render"