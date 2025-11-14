# Nx with Fastify API and React UI via ts-rest

An [Nx](https://nx.dev) monorepo featuring a [Fastify](https://fastify.dev/) back-end API and [React](https://react.dev/) front-end that exchange data via [ts-rest](https://ts-rest.com/).

API documentation based on the ts-rest contract is generated via Swagger/OpenAPI.

### About this Repo

The code in this repo can serve as a reference boilerplate/template for new full-stack projects.

### Development Setup

Run `make dev` to bootstrap and run a hot-loading version and hack away.

### Development Workflow

The API runs on port 3001 and the UI runs on port 3000.

A proxy configuration in `apps/react-ui/proxy.conf.json` will proxy requests to http://127.0.0.1:3001/api to the back-end API.

## Using

The production build with docker version is still WIP, goto development setup. 

Check out the [Nx Console extensions](https://nx.dev/nx-console) for VSCode extensions and other tools for working with Nx.
