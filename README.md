# @nvisy/com

![Build](https://img.shields.io/github/actions/workflow/status/nvisy/com/build.yaml?style=flat&logo=github&label=build&color=black)
![Security](https://img.shields.io/github/actions/workflow/status/nvisy/com/security.yaml?style=flat&logo=github&label=security&color=black)
![Integration](https://img.shields.io/github/actions/workflow/status/nvisy/com/integration.yaml?style=flat&logo=github&label=integration&color=black)
![Performance](https://img.shields.io/github/actions/workflow/status/nvisy/com/performance.yaml?style=flat&logo=github&label=performance&color=black)
![License](https://img.shields.io/badge/license-MIT-black?style=flat)

## Overview

A monorepo workspace for @nvisy/com packages. This repository uses npm workspaces to manage multiple packages with shared dependencies and build processes.

## Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 8 or higher
- **Git**: For version control

## Project Structure

```
.
├── .github/
│   └── workflows/          # GitHub Actions CI/CD workflows
│       ├── build.yaml      # Build and test pipeline
│       ├── integration.yaml # Integration tests
│       ├── performance.yaml # Performance testing
│       └── security.yaml   # Security audits
├── packages/               # Workspace packages
│   ├── config/            # Configuration package
│   └── landing/           # Landing page package
├── Makefile               # Build automation
├── package.json           # Root package configuration
└── README.md              # This file
```
