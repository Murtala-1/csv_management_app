#!/bin/bash

echo "🔧 Fixing AJV dependency conflict..."

# Navigate to frontend directory
cd frontend

# Remove existing node_modules and package-lock.json
echo "🗑️ Cleaning existing dependencies..."
rm -rf node_modules package-lock.json

# Create .npmrc with legacy peer deps
echo "📝 Creating .npmrc configuration..."
cat > .npmrc << EOF
legacy-peer-deps=true
auto-install-peers=true
strict-peer-deps=false
EOF

# Update package.json to use resolutions
echo "📦 Updating package.json with dependency resolutions..."
cat > package.json << 'EOF'
{
  "name": "csv-management-frontend",
  "version": "1.0.0",
  "description": "Frontend for CSV data management application",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "axios": "^1.6.2",
    "react-dropzone": "^14.2.3",
    "react-table": "^7.8.0",
    "react-hot-toast": "^2.4.1",
    "lucide-react": "^0.294.0",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^5.17.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "tailwindcss": "^3.3.6",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "jest": "^27.5.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "SKIP_PREFLIGHT_CHECK=true react-scripts start",
    "build": "SKIP_PREFLIGHT_CHECK=true react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "test:coverage": "react-scripts test --coverage --watchAll=false"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "proxy": "http://localhost:3001",
  "overrides": {
    "ajv": "8.12.0"
  }
}
EOF

echo "✅ Configuration updated!"
echo ""
echo "🚀 Next steps:"
echo "1. Run: cd frontend"
echo "2. Run: npm install --legacy-peer-deps"
echo "3. If that fails, try: npm install --force"
echo "4. Then run: npm start"
echo ""
echo "💡 Alternative: Use yarn instead of npm if available"