SHELL := /bin/bash

DIST ?= dist

.PHONY: prepare
prepare:
	npx husky install
	cp node_modules/github-markdown-css/github-markdown-*.css src/assets
	cp node_modules/highlight.js/styles/github-dark.css src/assets/highlightjs-github-dark.css
	cp node_modules/highlight.js/styles/github.css src/assets/highlightjs-github-light.css
	cp node_modules/katex/dist/contrib/auto-render.min.js src/assets/katex-auto-render.min.js
	mkdir src/assets/fonts
	cp node_modules/katex/dist/fonts/* src/assets/fonts # not use -r or -R on mac
	cp node_modules/katex/dist/katex.min.css src/assets
	cp node_modules/katex/dist/katex.min.js src/assets

.PHONY: lint
lint:
	npx eslint --fix .
	npx stylelint "src/**/*.{css,scss}" --fix
	@echo -e '\033[1;32mNo lint errors found.'

.PHONY: clean
clean:
	-rm -r ${DIST}

.PHONY: dev
dev: clean
	npx vite --mode development --config config/vite.dev.ts

.PHONY: build\:client
build\:client:
	npx vite build --mode production --config config/vite.prod.ts

.PHONY: build\:server
build\:server:
	# parallel use \n to separate inputs
	echo -e "server\\nserverEntry" |\
		parallel -j4 --tty "npx vite build --mode production --config config/vite.{}.ts"

.PHONY: build
build: clean build\:server build\:client

.PHONY: start
start: build
	DEBUG=socket.io:* node cli.js -o -r ../../doc

.PHONY: test
test:
	NODE_ENV=test npx jest --coverage --silent --runInBand
