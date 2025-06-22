# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS production

WORKDIR /app

# Copy only package files and install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf /root/.npm /root/.cache && \
    find node_modules -type d -name 'test' -o -name 'tests' -o -name '__tests__' | xargs rm -rf && \
    find node_modules -type d -name 'docs' | xargs rm -rf && \
    npm prune --production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy .env.production as .env
COPY .env.production .env

EXPOSE 3000

CMD ["node", "dist/index.js"]