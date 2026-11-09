# Multi-stage Dockerfile for LEXORA Backend
FROM node:20-alpine AS build

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache openssl libc6-compat

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy application source and build TypeScript
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

# Set production environment
ENV NODE_ENV=production

# Copy built artifacts and dependencies
COPY package*.json ./
RUN npm ci --only=production

COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist

# Create storage upload directory
RUN mkdir -p /app/storage/uploads

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && node dist/app.js"]

