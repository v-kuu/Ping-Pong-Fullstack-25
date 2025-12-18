NAME := web3d.wasm

CFLAGS := \
    -Os \
    -s \
    -std=c23 \
    -Wall \
    -Wextra \
    -Wpedantic \
    --target=wasm32 \
    -nostdlib \
    -mbulk-memory \
    -Wl,--no-entry \

.PHONY: ../static/$(NAME)
../static/$(NAME): main.c
	# @ docker ps | grep -q clang20 || docker run --rm -dit --name clang20 -v `pwd`:/src silkeh/clang:20 sh >/dev/null
	# @ docker exec -it clang20 clang /src/$< -o /src/$(NAME) $(CFLAGS)
	@ docker ps | grep -q clang20 || docker run --rm -d --name clang20 -v `pwd`:/src silkeh/clang:20 sh >/dev/null
	@ docker exec clang20 clang /src/$< -o /src/$(NAME) $(CFLAGS)
	@ mv $(NAME) ../assets/$(NAME)

.PHONY: clean
clean:
	@ $(RM) ../assets/$(NAME)
