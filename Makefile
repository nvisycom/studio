# Makefile for nvisy studio

ifneq (,$(wildcard ./.env))
	include .env
	export
endif

# Make-level logger (evaluated by make; does not invoke the shell).
define make-log
$(info [$(shell date '+%Y-%m-%d %H:%M:%S')] [MAKE] [$(MAKECMDGOALS)] $(1))
endef

# Shell-level logger (expands to a printf that runs in the shell).
define shell-log
printf "[%s] [MAKE] [$(MAKECMDGOALS)] $(1)\n" "$$(date '+%Y-%m-%d %H:%M:%S')"
endef

.PHONY: clean
clean: ## Cleans all build artifacts (Rust and npm).
	$(call make-log,Cleaning Rust build artifacts...)
	@cargo clean
	$(call make-log,Rust build artifacts cleaned.)

	$(call make-log,Cleaning npm artifacts...)
	@rm -rf node_modules
	@rm -rf packages/*/node_modules
	@rm -f package-lock.json
	$(call make-log,Node modules cleaned.)

	$(call make-log,Cleaning Nuxt build artifacts...)
	@rm -rf .nuxt
	@rm -rf packages/*/.nuxt
	@rm -rf .output
	@rm -rf packages/*/.output
	$(call make-log,Nuxt build artifacts cleaned.)

	$(call make-log,All build artifacts cleaned!)

.PHONY: build
build: ## Builds the desktop app for production.
	$(call make-log,Building config package...)
	@npm run build -w @nvisy/config
	$(call make-log,Config package built.)

	$(call make-log,Building desktop app...)
	@npm run tauri:build -w @nvisy/desktop
	$(call make-log,Desktop app built!)

.PHONY: install
install: ## Installs all dependencies.
	$(call make-log,Installing npm dependencies...)
	@npm install
	$(call make-log,npm dependencies installed.)

.PHONY: ci
ci: lint clippy typecheck test ## Runs all CI checks locally.
	$(call make-log,All CI checks passed!)

.PHONY: lint
lint: ## Runs linting checks (biome, cargo fmt).
	$(call make-log,Running biome check...)
	@npm run ci --workspaces --if-present
	$(call make-log,Checking Rust code formatting...)
	@cargo +nightly fmt --all -- --check
	$(call make-log,Linting passed!)

.PHONY: clippy
clippy: ## Runs Rust clippy checks.
	$(call make-log,Running clippy...)
	@cargo clippy --all-targets --all-features --workspace -- -D warnings
	$(call make-log,Clippy passed!)

.PHONY: typecheck
typecheck: ## Runs TypeScript type checking.
	$(call make-log,Building config package...)
	@npm run build -w @nvisy/config
	$(call make-log,Running type check...)
	@npm run test:types --workspaces --if-present
	$(call make-log,Type check passed!)

.PHONY: test
test: ## Runs all tests.
	$(call make-log,Running Rust tests...)
	@cargo test --all-features --workspace
	$(call make-log,Running npm tests...)
	@npm run test --workspaces --if-present
	$(call make-log,All tests passed!)

.PHONY: fmt
fmt: ## Formats all code.
	$(call make-log,Formatting Rust code...)
	@cargo +nightly fmt --all
	$(call make-log,Formatting TypeScript/JavaScript code...)
	@npm run format --workspaces --if-present
	$(call make-log,Formatting complete!)

.PHONY: help
help: ## Shows this help message.
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
