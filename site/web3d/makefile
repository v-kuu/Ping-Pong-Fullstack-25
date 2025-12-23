NAME := web3d.wasm
CONTAINER := clang20
CFLAGS := -std=c23 --target=wasm32 -nostdlib -Oz -s -Wall -Wextra -Wpedantic \
          -mbulk-memory -Wl,--no-entry -flto

.PHONY: all
all: src/*.c
	@ docker ps | grep -q $(CONTAINER) || docker run --rm -dit --name $(CONTAINER) silkeh/clang:20 sh >/dev/null
	@ docker cp -q . $(CONTAINER):/ # Copy sources in
	@ docker exec $(CONTAINER) clang $^ -o $(NAME) $(CFLAGS) # Compile
	@ docker cp -q $(CONTAINER):$(NAME) ../public/$(NAME) # Copy build artifacts out

.PHONY: native
native: src/*.c
	clang $^ -o ../public/$(NAME) $(CFLAGS)

.PHONY: clean
clean:
	@ $(RM) $(NAME)
