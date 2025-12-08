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

.PHONY: build-deps
build-deps: # Builds shared dependencies (config, shared).
	$(call log,Building shared dependencies...)
	@npm run build --workspace=@nvisy/config
	@npm run build --workspace=@nvisy/shared
	$(call log,Shared dependencies built.)

.PHONY: build
build: build-com build-app # Builds all packages.

.PHONY: build-com
build-com: build-deps # Builds landing (nvisy.com).
	$(call log,Building nvisy.com...)
	@npm run build --workspace=@nvisy/landing
	$(call log,Copying build output to ./output/com folder...)
	@mkdir -p ./output/com
	@cp -r packages/landing/dist/* ./output/com/
	$(call log,Copied build output to ./output/com folder.)

.PHONY: build-app
build-app: build-deps # Builds webapp (app.nvisy.com).
	$(call log,Building app.nvisy.com...)
	@npm run build --workspace=@nvisy/webapp
	$(call log,Copying build output to ./output/app folder...)
	@mkdir -p ./output/app
	@cp -r packages/webapp/.output/* ./output/app/
	$(call log,Copied build output to ./output/app folder.)

.PHONY: clean
clean: # Cleans build artifacts and dependencies.
	$(call log,Cleaning build artifacts...)
	@rm -rf node_modules
	@rm -rf packages/*/node_modules
	@rm -rf packages/*/dist
	@rm -rf packages/*/.output
	@rm -rf packages/*/.nuxt
	@rm -rf output
	$(call log,Cleaned build artifacts.)

.PHONY: check
check: # Runs code quality checks.
	$(call log,Running code checks...)
	@npm run ci --workspaces --if-present
