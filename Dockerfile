# ===== BUILDER STAGE =====
FROM node:24 AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for TypeScript compilation)
RUN npm ci

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Compile TypeScript to JavaScript
RUN npm run build

# ===== PRODUCTION STAGE =====
FROM node:24

# Set working directory
WORKDIR /app

# Copy package files from context
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm ci --only=production

# Copy compiled code from builder stage
COPY --from=builder /app/dist ./dist

# Create and use a non-root user for security
USER node

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/server.js"]
