<<<<<<< HEAD
FROM oven/bun:alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN apk add --no-cache clang lld make musl-dev
RUN bun install --frozen-lockfile

FROM oven/bun:alpine AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
=======
FROM silkeh/clang:20
WORKDIR /src
COPY web3d .
RUN make production

FROM denoland/deno:latest
ARG GIT_REVISION
ENV DENO_DEPLOYMENT_ID=${GIT_REVISION}
>>>>>>> main


FROM deps AS builder
WORKDIR /app
COPY . .
ENV MAKE_TARGET=native
RUN bun run build

FROM oven/bun:alpine AS runner
WORKDIR /app
<<<<<<< HEAD

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./
=======
COPY . .
COPY --from=0 src/web3d.wasm assets/web3d.wasm
>>>>>>> main

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["bun", "run", "./dist/server/entry.mjs"]
