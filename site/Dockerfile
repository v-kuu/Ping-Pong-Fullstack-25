# ---------------------------------------------------
# 1. DEPS: Install all dependencies (for building)
# ---------------------------------------------------
FROM oven/bun:alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---------------------------------------------------
# 2. PROD-DEPS: Install only runtime dependencies
# ---------------------------------------------------
FROM oven/bun:alpine AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production


FROM deps AS builder
WORKDIR /app
# We copy the source code here
COPY . .
RUN bun run build

FROM oven/bun:alpine AS runner
WORKDIR /app

# Copy only what is needed to run
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["bun", "run", "./dist/server/entry.mjs"]
