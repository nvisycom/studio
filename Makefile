# Makefile for nvisy.com
# This file provides common commands for managing the project build lifecycle.

define log
$(info [$(shell date '+%Y-%m-%d %H:%M:%S')] [MAKE] [$(MAKECMDGOALS)] $(1))
endef

.PHONY: install
install: # Installs all dependencies.
	$(call log,Installing dependencies...)
	npm install

	$(call log,Making scripts executable...)
	chmod +x scripts/*.sh

.PHONY: build
build: # Builds all packages.
	$(call log,Building all packages...)
	npm run build --workspaces --if-present
	# TODO: Copy dist to the root folder

.PHONY: clean
clean: # Cleans build artifacts and dependencies.
	$(call log,Cleaning build artifacts...)
	rm -rf node_modules
	rm -rf packages/*/node_modules
	rm -rf packages/*/dist

.PHONY: check
check: # Runs code quality checks.
	$(call log,Running code checks...)
	npm run ci --workspaces --if-present
