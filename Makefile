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
	@npm run build --workspace=@nvisy/config
	$(call make-log,Config package built.)

	$(call make-log,Building desktop app...)
	@npm run tauri:build --workspace=@nvisy/desktop
	$(call make-log,Desktop app built!)

.PHONY: install
install: ## Installs all dependencies.
	$(call make-log,Installing npm dependencies...)
	@npm install
	$(call make-log,npm dependencies installed.)

.PHONY: ci
ci: ## Runs all CI checks locally (check, fmt, clippy, test, biome).
	$(call make-log,Running cargo check...)
	@cargo check --all-features --workspace
	$(call make-log,Checking Rust code formatting...)
	@cargo +nightly fmt --all -- --check
	$(call make-log,Running clippy...)
	@cargo clippy --all-targets --all-features --workspace -- -D warnings
	$(call make-log,Running Rust tests...)
	@cargo test --all-features --workspace
	$(call make-log,Building Rust documentation...)
	@RUSTDOCFLAGS="-D warnings" cargo doc --no-deps --all-features --workspace
	$(call make-log,Running biome check...)
	@npm run check --workspaces --if-present
	$(call make-log,All CI checks passed!)
