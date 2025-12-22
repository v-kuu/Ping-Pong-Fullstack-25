FROM silkeh/clang:20
WORKDIR /src
COPY web3d .
RUN make production

FROM denoland/deno:latest
ARG GIT_REVISION
ENV DENO_DEPLOYMENT_ID=${GIT_REVISION}

WORKDIR /app
COPY . .
COPY --from=0 src/web3d.wasm assets/web3d.wasm

RUN deno install
RUN deno task build
RUN deno cache _fresh/server.js

EXPOSE 8000

CMD ["deno", "task", "start"]
