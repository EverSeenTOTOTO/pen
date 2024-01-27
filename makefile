SHELL := /bin/bash

DIST ?= dist

.PHONY: prepare
prepare:
	npx husky install
	cp node_modules/github-markdown-css/github-markdown-*.css src/assets
	cp node_modules/highlight.js/styles/github-dark.css src/assets/highlightjs-github-dark.css
	cp node_modules/highlight.js/styles/github.css src/assets/highlightjs-github-light.css
	cp node_modules/katex/dist/contrib/copy-tex.min.js src/assets/katex-copy-tex.min.js
	if [[ -e src/assets/fonts ]]; then rm -rf src/assets/fonts; fi
	mkdir src/assets/fonts
	cp node_modules/katex/dist/fonts/* src/assets/fonts # not use -r or -R on mac
	cp node_modules/katex/dist/katex.min.css src/assets

.PHONY: lint
lint:
	npx eslint --fix .
	npx stylelint "src/**/*.{css,scss}" --fix
	# npx tsc -p . -noEmit
	@echo -e '\033[1;32mNo lint errors found.'

.PHONY: clean
clean:
	-rm -r ${DIST}

.PHONY: dev
dev: clean
	npx vite --mode development --config config/vite.dev.mts

.PHONY: build\:client
build\:client:
	npx vite build --mode production --config config/vite.prod.mts

.PHONY: build\:server
build\:server:
	npx vite build --mode production --config config/vite.server.mts
	npx vite build --mode production --config config/vite.serverEntry.mts

.PHONY: build
build: clean build\:server build\:client

.PHONY: start
start: build
	node cli.js -o -r ../docs

.PHONY: test
test:
	NODE_ENV=test npx jest --coverage --silent --runInBand --detectOpenHandles
