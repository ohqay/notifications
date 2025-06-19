# Notifications MCP Server

An MCP server that enables AI assistants like Claude to send native macOS notifications to your computer.

## What it does

This server gives AI assistants the ability to notify you through your Mac's notification system. Once installed, you can ask your AI assistant to send you notifications for various purposes like:
- Alerting you when a long-running task completes
- Reminding you of important information
- Notifying you when the AI needs your attention
- Sending updates about ongoing processes

## Features

- Native macOS notifications that appear in Notification Center
- Support for all system notification sounds
- Ability to wait for and detect user interaction with notifications
- Reply functionality for quick responses
- Custom action buttons

## Installation

```bash
# Clone the repository
git clone https://github.com/ohqay/notifications.git
cd notifications

# Install dependencies using Bun
bun install

# Build and configure for Claude Desktop (automatic setup)
bun run setup-claude
```

After installation, restart Claude Desktop to activate the notifications capability.

## Manual Configuration

If you prefer to configure manually, add this to your Claude Desktop configuration file:
`~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "notifications": {
      "command": "node",
      "args": ["/absolute/path/to/notifications/build/index.js"]
    }
  }
}
```

## How to Use

Once installed, you can ask Claude to send notifications by including requests like these in your prompts:

### Basic Examples
- "Let me know when you're done analyzing this data"
- "Notify me when the task is complete"
- "Send me a notification in 5 minutes to take a break"
- "Alert me when you find the answer"

### Advanced Examples
- "When you finish processing, send a notification with a 'Glass' sound"
- "Notify me with a ping sound when the code review is done"
- "Send a silent notification when the download completes"

### Interactive Examples
- "Send a notification I can reply to for quick notes"
- "Alert me with options to continue or stop"

## Technical Details

The server exposes a `send_notification` tool to AI assistants with these options:

- **title** (required): The notification title
- **message** (required): The notification message body
- **sound**: System notification sound (Basso, Blow, Bottle, Frog, Funk, Glass, Hero, Morse, Ping, Pop, Purr, Sosumi, Submarine, Tink, default, or none)
- **wait**: Whether to wait for user interaction
- **timeout**: How long to display the notification (seconds)
- **reply**: Enable reply functionality
- **actions**: Action buttons (max 2)
- **icon**: Path to custom icon
- **contentImage**: Image to display in notification
- **closeLabel**: Custom close button label

## System Requirements

- macOS 10.8 or higher for basic notifications
- macOS 10.9 or higher for advanced features (icons, images, reply, actions)

## Development

### Scripts

- `bun run build` - Build the TypeScript project
- `bun run watch` - Watch for changes and rebuild
- `bun run dev` - Build and run the server
- `bun run setup-claude` - Build and auto-configure for Claude Desktop

### Project Structure

```
notifications/
├── src/
│   └── index.ts        # Main server implementation
├── build/              # Compiled JavaScript output
├── package.json        # Project configuration
├── tsconfig.json       # TypeScript configuration
├── setup-claude.js     # Automatic Claude Desktop configuration
├── CLAUDE.md          # Instructions for AI assistants
└── README.md          # This file
```

## Troubleshooting

### Notifications not appearing?

The server handles notification failures gracefully and will provide helpful instructions if notifications are blocked. Common causes:

1. **Notifications disabled**: Check System Settings > Notifications > Terminal and ensure notifications are allowed
2. **Focus mode active**: macOS Focus modes can block notifications
3. **Do Not Disturb enabled**: Turn off Do Not Disturb in Control Center
4. **First-time permission**: macOS may prompt for permission the first time Terminal tries to send a notification

## Limitations

- Notifications show a Terminal icon in the corner (macOS limitation when sent from command-line tools)
- Maximum of 2 action buttons per notification
- Some features require macOS 10.9 or higher

## Contributing

Feel free to submit issues or pull requests on the [GitHub repository](https://github.com/ohqay/notifications).

## License

MIT