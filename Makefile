# Makefile for nvisy.com
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
install-tools: # Installs Playwright and Lighthouse tools.
	$(call log,Installing Playwright...)
	@npx playwright install
	$(call log,Installing Lighthouse...)
	@npm install -g lighthouse
	$(call log,Tools installed.)

.PHONY: build-deps
build-deps: # Builds shared dependencies (config, shared).
	$(call log,Building shared dependencies...)
	@npm run build --workspace=@nvisy/config
	@npm run build --workspace=@nvisy/shared
	$(call log,Shared dependencies built.)

.PHONY: build-com
build-com: build-deps # Builds landing (nvisy.com).
	$(call log,Building nvisy.com...)
	@npm run build --workspace=@nvisy/landing
	$(call log,Copying build output to ./output/com folder...)
	@mkdir -p ./output/com
	@cp -r packages/nvisy-landing/dist/* ./output/com/
	$(call log,Copied build output to ./output/com folder.)

.PHONY: build-app
build-app: build-deps # Builds webapp (app.nvisy.com).
	$(call log,Building app.nvisy.com...)
	@npm run generate --workspace=@nvisy/webapp
	$(call log,Copying build output to ./output/app folder...)
	@mkdir -p ./output/app
	@cp -r packages/nvisy-webapp/.output/public/* ./output/app/
	$(call log,Copied build output to ./output/app folder.)

.PHONY: build
build: build-com build-app # Builds all packages.

.PHONY: clean
clean: # Cleans build artifacts and dependencies.
	$(call log,Cleaning build artifacts...)
	@rm -rf node_modules
	@rm -rf packages/*/node_modules
	@rm -rf packages/*/dist
	@rm -rf packages/*/.astro
	@rm -rf packages/*/.output
	@rm -rf packages/*/.nuxt
	@rm -rf output
	@rm -rf .lighthouse
	$(call log,Cleaned build artifacts.)

.PHONY: repair
repair: clean install build-deps # Cleans, reinstalls, and builds shared dependencies.

.PHONY: check
check: # Runs code quality checks.
	$(call log,Running code checks...)
	@npm run ci --workspaces --if-present

.PHONY: lighthouse-landing
lighthouse-landing: build-com # Runs Lighthouse performance tests on landing site.
	@mkdir -p .lighthouse/landing
	$(call log,Running Lighthouse on landing site (production build)...)
	@npx serve output/com -l 4321 -s &
	@sleep 2 && \
		CHROME_PATH="$$(node -e "console.log(require('@playwright/test').chromium.executablePath())")" \
		lighthouse http://localhost:4321 \
		--chrome-flags="--headless" \
		--output=html,json \
		--output-path=.lighthouse/landing/lighthouse && \
		pkill -f "serve output/com" || true
	$(call log,Lighthouse report saved to .lighthouse/landing/)
	@open .lighthouse/landing/lighthouse.report.html 2>/dev/null || \
		xdg-open .lighthouse/landing/lighthouse.report.html 2>/dev/null || \
		echo "Report available at .lighthouse/landing/lighthouse.report.html"

.PHONY: lighthouse-webapp
lighthouse-webapp: build-app # Runs Lighthouse performance tests on webapp.
	@mkdir -p .lighthouse/webapp
	$(call log,Running Lighthouse on webapp (production build)...)
	@npx serve output/app -l 3000 -s &
	@sleep 2 && \
		CHROME_PATH="$$(node -e "console.log(require('@playwright/test').chromium.executablePath())")" \
		lighthouse http://localhost:3000 \
		--chrome-flags="--headless" \
		--output=html,json \
		--output-path=.lighthouse/webapp/lighthouse && \
		pkill -f "serve output/app" || true
	$(call log,Lighthouse report saved to .lighthouse/webapp/)
	@open .lighthouse/webapp/lighthouse.report.html 2>/dev/null || \
		xdg-open .lighthouse/webapp/lighthouse.report.html 2>/dev/null || \
		echo "Report available at .lighthouse/webapp/lighthouse.report.html"

.PHONY: lighthouse
lighthouse: lighthouse-landing lighthouse-webapp # Runs Lighthouse on both sites.
