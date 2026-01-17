FROM silkeh/clang:20
WORKDIR /app
COPY web3d ./web3d
RUN make -sC web3d native

FROM oven/bun:alpine
WORKDIR /app
COPY . .
RUN mkdir -p /app/web3d
COPY --from=0 app/web3d /app/web3d
RUN bun run docker

# Backup the database
RUN cp /app/.astro/content.db /app/content.db.init

# Ensure data directories exist
RUN mkdir -p /app/.astro /app/dist/client/avatars

EXPOSE 3000

RUN ["sh", "-c", "[ -s .astro/content.db ] || cp content.db.init .astro/content.db"]
CMD ["bun-tasks", "bun run serve ::: bun run web3d ::: bun run pong"]
