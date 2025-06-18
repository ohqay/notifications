#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupClaude() {
  try {
    // Path to Claude Desktop config
    const configPath = path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'Claude',
      'claude_desktop_config.json'
    );

    // Get the absolute path to our built server
    const serverPath = path.join(__dirname, 'build', 'index.js');

    // Check if the server is built
    try {
      await fs.access(serverPath);
    } catch {
      console.error('Error: Server not built yet. Run "bun run build" first.');
      process.exit(1);
    }

    // Read existing config or create new one
    let config = {};
    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(configContent);
    } catch (error) {
      console.log('No existing Claude config found, creating new one...');
    }

    // Ensure mcpServers object exists
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    // Add our notifications server
    config.mcpServers.notifications = {
      command: 'node',
      args: [serverPath]
    };

    // Write the updated config
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    console.log('✅ Successfully configured Claude Desktop!');
    console.log(`📝 Added notifications server at: ${serverPath}`);
    console.log('🔄 Please restart Claude Desktop to use the notifications server.');
  } catch (error) {
    console.error('Error setting up Claude Desktop config:', error);
    process.exit(1);
  }
}

setupClaude();