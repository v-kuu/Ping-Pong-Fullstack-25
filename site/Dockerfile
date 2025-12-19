FROM silkeh/clang:20

COPY web3d .
RUN make production


FROM oven/bun:1

WORKDIR /app
COPY . .
COPY --from=0 web3d.wasm public/web3d.wasm

# Install dependencies
RUN bun install

# Generate Prisma client
ENV DATABASE_URL="file:./dev.db"
RUN bun run db:generate

# Build the application
RUN bun run build

# Set production environment
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 3000

# Start the server
CMD ["bun", "run", "start"]
