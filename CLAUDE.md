# Project-Specific Instructions for Claude

## Package Manager
- **ALWAYS use Bun** instead of npm for all package management tasks
- Use `bun install` instead of `npm install`
- Use `bun run` instead of `npm run`
- Use `bun add` instead of `npm install <package>`
- Use `bun add -d` instead of `npm install --save-dev <package>`

## Project Overview
This is an MCP (Model Context Protocol) server that provides native macOS notification capabilities to AI tools like Claude Desktop.

## Development Commands
- `bun install` - Install dependencies
- `bun run build` - Build the TypeScript project
- `bun run watch` - Watch for changes and rebuild
- `bun run dev` - Build and run the server

## Key Features
- Native macOS notifications using node-notifier
- Full MCP protocol compliance
- Support for notification sounds, titles, messages, and icons
- TypeScript for type safety