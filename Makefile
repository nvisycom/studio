# Makefile for app.nvisy.com
# This file provides common commands for managing the project build lifecycle.

define log
	@echo "[$(shell date '+%Y-%m-%d %H:%M:%S')] [MAKE] [$(MAKECMDGOALS)] $(1)"
endef

.PHONY: install
install: # Installs all dependencies.
	$(call log,Installing dependencies...)
	@npm install
	@if [ -d scripts ]; then \
		$(call log,Making scripts executable...); \
		chmod +x scripts/*.sh; \
		$(call log,Made scripts executable.); \
	fi

.PHONY: install-tools
install-tools: # Installs Lighthouse tools.
	$(call log,Installing Lighthouse...)
	@npm install -g lighthouse
	$(call log,Tools installed.)

.PHONY: build
build: # Builds the web app (self-hosted edition).
	$(call log,Building web app (self-hosted)...)
	@npm run generate -w @nvisy/webapp
	$(call log,Copying build output to ./output folder...)
	@mkdir -p ./output
	@cp -r apps/web/.output/public/* ./output/
	$(call log,Copied build output to ./output folder.)

.PHONY: build-cloud
build-cloud: # Builds the web app (cloud edition, app.nvisy.com).
	$(call log,Building app.nvisy.com (cloud)...)
	@NUXT_PUBLIC_DEPLOYMENT=cloud npm run generate -w @nvisy/webapp
	$(call log,Copying build output to ./output folder...)
	@mkdir -p ./output
	@cp -r apps/web/.output/public/* ./output/
	$(call log,Copied build output to ./output folder.)

.PHONY: build-desktop
build-desktop: # Builds the desktop app frontend (Tauri).
	$(call log,Building desktop frontend...)
	@npm run generate -w @nvisy/desktop
	$(call log,Desktop frontend built at apps/desktop/.output/public.)

.PHONY: clean
clean: # Cleans build artifacts and dependencies.
	$(call log,Cleaning build artifacts...)
	@rm -rf node_modules
	@rm -rf packages/*/node_modules apps/*/node_modules
	@rm -rf apps/*/.output apps/*/.nuxt
	@rm -rf output
	@rm -rf .lighthouse
	$(call log,Cleaned build artifacts.)

.PHONY: repair
repair: clean install # Cleans and reinstalls dependencies.

.PHONY: check
check: # Runs code quality checks.
	$(call log,Running code checks...)
	@npm run ci

.PHONY: lighthouse
lighthouse: build # Runs Lighthouse performance tests on the web app.
	@mkdir -p .lighthouse/webapp
	$(call log,Running Lighthouse on the web app (production build)...)
	@npx serve output -l 3000 -s &
	@sleep 2 && \
		CHROME_PATH="$$(node -e "console.log(require('@playwright/test').chromium.executablePath())")" \
		lighthouse http://localhost:3000 \
		--chrome-flags="--headless" \
		--output=html,json \
		--output-path=.lighthouse/webapp/lighthouse && \
		pkill -f "serve output" || true
	$(call log,Lighthouse report saved to .lighthouse/webapp/)
	@open .lighthouse/webapp/lighthouse.report.html 2>/dev/null || \
		xdg-open .lighthouse/webapp/lighthouse.report.html 2>/dev/null || \
		echo "Report available at .lighthouse/webapp/lighthouse.report.html"
