# Notifications MCP Server

A Model Context Protocol (MCP) server that provides native macOS notification capabilities to AI tools like Claude Desktop.

## Features

- Native macOS notifications with full Notification Center integration
- Support for all macOS notification sounds
- Customizable notification properties (title, message, subtitle, icons)
- Interactive notifications with reply and action button support
- Wait for user interaction and receive feedback

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

## Manual Configuration for Claude Desktop

If you prefer to configure manually, add the following to your Claude Desktop configuration file (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

Restart Claude Desktop after updating the configuration.

## Available Tool

### `send_notification`

Send a macOS notification with customizable options.

**Parameters:**
- `title` (string, required): The notification title
- `message` (string, required): The notification message body
- `subtitle` (string, optional): Optional subtitle for the notification
- `sound` (string, optional): Notification sound. Options:
  - "Basso", "Blow", "Bottle", "Frog", "Funk", "Glass", "Hero", "Morse"
  - "Ping", "Pop", "Purr", "Sosumi", "Submarine", "Tink", "default"
  - "none" for silent notifications
  - Defaults to "default" (system sound) if not specified
- `icon` (string, optional): Path to an icon image file (absolute path)
- `contentImage` (string, optional): Path to an image to display in the notification body
- `wait` (boolean, optional): Wait for user interaction with the notification (default: false)
- `timeout` (number, optional): Timeout in seconds (default: 10)
- `closeLabel` (string, optional): Label for the close button
- `actions` (array, optional): Action buttons for the notification (max 2)
- `reply` (boolean, optional): Enable reply functionality (default: false)

**Examples:**

Simple usage:
```
Send a notification with title "Hello" and message "World"
```

Advanced usage:
```
Send a notification with title "Meeting Reminder", message "Team standup in 5 minutes", sound "Ping", and wait for user interaction
```

## macOS Requirements

- macOS 10.8 or higher for basic notifications
- macOS 10.9 or higher for advanced features (icons, content images, reply, actions)

## Development

### Scripts

- `bun run build` - Build the TypeScript project
- `bun run watch` - Watch for changes and rebuild
- `bun run dev` - Build and run the server

### Project Structure

```
notifications/
├── src/
│   └── index.ts        # Main server implementation
├── build/              # Compiled JavaScript output
├── package.json        # Project configuration
├── tsconfig.json       # TypeScript configuration
├── CLAUDE.md          # Claude-specific instructions
└── README.md          # This file
```

## Example Usage in Claude

Once configured, you can use the notification tool in Claude Desktop:

### Basic Usage
```
Please send a notification with title "Reminder" and message "Don't forget to take a break!"
```

### Custom Sound
```
Send a notification with:
- Title: "Build Complete"
- Message: "Your project has been successfully built"
- Sound: "Glass"
- Wait for my click
```

### Interactive Notifications
```
Send a notification that allows me to reply with:
- Title: "Quick Note"
- Message: "What's on your mind?"
- Enable reply
- Sound: "Pop"
```

## Limitations

- The notification will show a small Terminal icon (this is a macOS limitation)
- Some features require macOS 10.9 or higher
- Action buttons are limited to 2 per notification

## License

MIT