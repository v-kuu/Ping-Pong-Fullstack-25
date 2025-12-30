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

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["bun", "run", "./dist/server/entry.mjs"]
