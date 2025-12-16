FROM denoland/deno:latest

ARG GIT_REVISION
ENV DENO_DEPLOYMENT_ID=${GIT_REVISION}

WORKDIR /app

COPY . .

RUN deno install
RUN deno task build
RUN deno cache _fresh/server.js

EXPOSE 8000


CMD ["deno", "task", "start"]
