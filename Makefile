# Makefile for @nvisy/com monorepo
# This file provides common commands for managing the project build lifecycle

.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	@find packages -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
	@find packages -type d -name "build" -exec rm -rf {} + 2>/dev/null || true
	@find packages -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	@rm -rf node_modules
	@echo "Clean complete"

.PHONY: install
install:
	@echo "Installing dependencies..."
	@npm ci
	@echo "Installation complete"

.PHONY: build
build:
	@echo "Building all packages..."
	@npm run build --workspaces --if-present
	@echo "Build complete"
