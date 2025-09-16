# CSV Data Management Web Application

### Local Development

1. **Clone the repository**

   
   git clone <repository-url>
   cd csv-management-app
   

2. **Install backend dependencies**

   
   cd backend
   npm install
   

3. **Install frontend dependencies**

   
   cd ../frontend
   npm install
   

4. **Start the backend server**

   
   cd ../backend
   npm run dev
   

5. **Start the frontend development server**

   
   cd ../frontend
   npm start
   

6. **Open your browser**
   Navigate to `http://localhost:3000`

### Docker Development

1. **Start with Docker Compose**

   
   docker-compose up --build
   

2. **Access the application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:3001`

##Testing

### Backend Tests


cd backend
npm test
npm run test:coverage


### Frontend Tests


cd frontend
npm test
npm run test:coverage


### Run All Tests


npm run test:all


## API Endpoints

| Method | Endpoint        | Description             |
| ------ | --------------- | ----------------------- |
| POST   | `/api/upload`   | Upload CSV files        |
| GET    | `/api/data`     | Retrieve current data   |
| PUT    | `/api/data`     | Update CSV data         |
| POST   | `/api/validate` | Validate data integrity |
| GET    | `/api/export`   | Export CSV files        |
| DELETE | `/api/data`     | Clear all data          |
| GET    | `/api/stats`    | Get data statistics     |

## Configuration

### Environment Variables

Create a `.env` file in the project root:

env
# Backend
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info

# Frontend
REACT_APP_API_URL=http://localhost:3001/api


### Production Configuration

For production deployment:

1. **Build the application**

   
   docker build -t csv-management-app .
   

2. **Run with production settings**
   
   docker run -p 3001:3001 -e NODE_ENV=production csv-management-app
   

## Deployment

### Render Deployment

1. **Connect your repository to Render**
2. **Configure build settings**:
   - Build Command: `cd backend && npm ci --only=production && cd ../frontend && npm ci && npm run build && mv build ../backend/public`
   - Start Command: `cd backend && npm start`
3. **Set environment variables**:
   ```
   NODE_ENV=production
   PORT=10000
   FRONTEND_URL=https://your-app-name.onrender.com
   ```
4. **Deploy**: Render will automatically build and deploy your application

📖 **Detailed Guide**: See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for complete instructions

### Manual Deployment

1. **Build the Docker image**

   
   docker build -t csv-management-app .
   

2. **Push to your container registry**
3. **Deploy to your hosting platform**

## Usage Guide

### 1. Upload CSV Files

- Drag and drop or click to select CSV files
- Assign files to "Strings" or "Classifications" categories
- Files are automatically validated on upload

### 2. View and Edit Data

- Browse data in interactive tables
- Click any cell to edit inline
- Add new rows with the "Add Row" button
- Delete rows using the trash icon

### 3. Validate Data

- Click "Validate" to check data integrity
- View validation results and error details
- Invalid rows are highlighted in red

### 4. Export Data

- Export individual files or both as ZIP
- Choose from "Strings", "Classifications", or "Both"
- Files maintain original CSV formatting

## 🔄 Version History

- **v1.0.0**: Initial release with core functionality
  - CSV upload and validation
  - Inline editing capabilities
  - Export functionality
  - Docker containerization
  - Comprehensive testing suite
