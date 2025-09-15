# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN cd backend && npm ci --only=production && npm cache clean --force
RUN cd frontend && npm ci --only=production && npm cache clean --force

# Build frontend
FROM base AS frontend-builder
WORKDIR /app/frontend

# Copy frontend source
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Build backend
FROM base AS backend-builder
WORKDIR /app/backend

# Copy backend source
COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 csvapp

# Copy built applications
COPY --from=deps --chown=csvapp:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=csvapp:nodejs /app/backend ./backend
COPY --from=frontend-builder --chown=csvapp:nodejs /app/frontend/build ./frontend/build

# Create necessary directories
RUN mkdir -p /app/backend/logs /app/backend/temp /app/backend/uploads
RUN chown -R csvapp:nodejs /app/backend/logs /app/backend/temp /app/backend/uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV FRONTEND_URL=http://localhost:3000

# Expose port
EXPOSE 3001

# Switch to non-root user
USER csvapp

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "backend/src/app.js"]