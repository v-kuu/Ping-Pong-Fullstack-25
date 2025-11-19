all:
	npm install --global pnpm
	pnpm install
	pnpm build:all
	pnpm docker:up

build:
	npm install --global pnpm
	pnpm install
	pnpm build:all

dev: build
	pnpm dev

clean:
	pnpm docker:down
	pnpm clean:all
