SHELL := /bin/bash
DIST ?= dist

export NODE_ENV ?= production

lint:
	npx eslint --fix .

clean:
	-rm -r ${DIST}

dev:
	npx webpack serve --config scripts/webpack.spa.js

build\:server:
	npx tsc
	npx webpack --config scripts/webpack.server.js

build\:spa:
	npx webpack --config scripts/webpack.spa.js

build: clean build\:server build\:spa

test:
	NODE_ENV=test npx jest --coverage --detectOpenHandles

.PHONY: lint clean build test watch start dev
