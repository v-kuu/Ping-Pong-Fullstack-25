NAME := web3d.wasm
CONTAINER := clang20
CFLAGS := -std=c23 --target=wasm32 -nostdlib -Os -s -Wall -Wextra -Wpedantic \
          -mbulk-memory -Wl,--no-entry -flto -ffast-math

.PHONY: all
all: src/*.c
	@ docker ps | grep -q $(CONTAINER) || docker run --rm -dit --name $(CONTAINER) silkeh/clang:20 sh >/dev/null
	@ docker cp -q . $(CONTAINER):/ # Copy sources in
	@ docker exec $(CONTAINER) clang $^ -o $(NAME) $(CFLAGS) # Compile
	@ docker cp -q $(CONTAINER):$(NAME) $(NAME) # Copy build artifacts out

.PHONY: native
native: src/*.c
	clang $^ -o $(NAME) $(CFLAGS)

.PHONY: clean
clean:
	@ $(RM) $(NAME)
