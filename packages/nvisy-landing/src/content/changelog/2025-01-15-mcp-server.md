---
title: "MCP Server for AI Assistants"
description: "Connect Claude, Cursor, and other AI assistants directly to your document processing workflows using the Model Context Protocol. Upload documents, extract data, query results, and manage templates through natural language conversations with your favorite AI tools."
publishedAt: 2025-01-15
version: "1.0.0-beta"
---

We're excited to release the nvisy MCP server, enabling seamless integration between nvisy and AI assistants like Claude and Cursor.

## Features

- MCP Server for AI assistant integration
- Document processing through natural language
- Query and analyze extracted data conversationally
- Create and manage templates via chat
- Monitor jobs and retrieve results

## Improvements

- Seamless context sharing with AI assistants
- Automatic credential management
- Rich error messages with suggestions
- Batch operations support
- Intelligent caching for faster follow-ups

## Getting Started

Install the nvisy MCP server:

```bash
npm install -g @nvisy/mcp-server
```

Configure Claude Desktop by adding to your config:

```json
{
  "mcpServers": {
    "nvisy": {
      "command": "nvisy-mcp",
      "env": {
        "NVISY_API_KEY": "your-api-key"
      }
    }
  }
}
```

For detailed setup instructions, visit our [MCP documentation](https://docs.nvisy.com/mcp).
