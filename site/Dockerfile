FROM oven/bun:alpine AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN apk add --no-cache clang lld make
RUN bun install --frozen-lockfile

FROM oven/bun:alpine AS prod-deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production


FROM deps AS builder
WORKDIR /app
COPY . .
ENV MAKE_TARGET=native
RUN bun run docker

FROM oven/bun:alpine AS runner
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["bun", "run", "./dist/server/entry.mjs"]
