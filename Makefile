# Makefile for nvisy.com
# This file provides common commands for managing the project build lifecycle.

define log
	@echo "[$(shell date '+%Y-%m-%d %H:%M:%S')] [MAKE] [$(MAKECMDGOALS)] $(1)"
endef

.PHONY: install
install: # Installs all dependencies.
	$(call log,Installing dependencies...)
	@npm install
	$(call log,Making scripts executable...)
	@chmod +x scripts/*.sh
	$(call log,Made scripts executable.)

.PHONY: build
build: # Builds all packages.
	$(call log,Building all packages...)
	@npm run build --workspaces --if-present
	$(call log,Copying dist to ./output folder...)
	@cp -r packages/landing/dist ./output
	$(call log,Copied dist to ./output folder.)

.PHONY: clean
clean: # Cleans build artifacts and dependencies.
	$(call log,Cleaning build artifacts...)
	@rm -rf node_modules
	@rm -rf packages/*/node_modules
	@rm -rf packages/*/dist
	@rm -rf output
	$(call log,Cleaned build artifacts.)

.PHONY: check
check: # Runs code quality checks.
	$(call log,Running code checks...)
	@npm run ci --workspaces --if-present
