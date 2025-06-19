#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import notifier from "node-notifier";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Available macOS notification sounds
const MACOS_SOUNDS = [
  "Basso",
  "Blow",
  "Bottle",
  "Frog",
  "Funk",
  "Glass",
  "Hero",
  "Morse",
  "Ping",
  "Pop",
  "Purr",
  "Sosumi",
  "Submarine",
  "Tink",
  "default"
];

const server = new Server(
  {
    name: "Notifications",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "send_notification",
        description: "Send a macOS notification",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "The notification title",
            },
            message: {
              type: "string",
              description: "The notification message body",
            },
            sound: {
              type: "string",
              description: `Notification sound. Can be: ${MACOS_SOUNDS.join(", ")}, 'none' for silent, or omit for default sound`,
              enum: [...MACOS_SOUNDS, "none"],
              default: "default",
            },
            icon: {
              type: "string",
              description: "Path to an icon image file (absolute path)",
            },
            contentImage: {
              type: "string",
              description: "Path to an image to display in the notification body (macOS 10.9+)",
            },
            wait: {
              type: "boolean",
              description: "Wait for user interaction with the notification",
              default: false,
            },
            timeout: {
              type: "number",
              description: "Timeout in seconds (default: 10)",
              default: 10,
            },
            closeLabel: {
              type: "string",
              description: "Label for the close button (macOS only)",
            },
            actions: {
              type: "array",
              description: "Action buttons for the notification (macOS 10.9+)",
              items: {
                type: "string",
              },
              maxItems: 2,
            },
            reply: {
              type: "boolean",
              description: "Enable reply functionality (macOS 10.9+)",
              default: false,
            },
          },
          required: ["title", "message"],
        },
      },
    ],
  };
});

// Type definition for tool arguments
interface NotificationArgs {
  title: string;
  message: string;
  sound?: string;
  icon?: string;
  contentImage?: string;
  wait?: boolean;
  timeout?: number;
  closeLabel?: string;
  actions?: string[];
  reply?: boolean;
}

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new McpError(ErrorCode.InvalidParams, "No arguments provided");
  }

  switch (name) {
    case "send_notification": {
      const notifArgs = args as unknown as NotificationArgs;
      
      try {
        const notificationOptions: any = {
          title: notifArgs.title,
          message: notifArgs.message,
          timeout: notifArgs.timeout || 10,
          wait: notifArgs.wait || false,
        };

        // Handle sound: default to true (system sound) if not specified
        if (notifArgs.sound === "none") {
          notificationOptions.sound = false;
        } else if (notifArgs.sound && notifArgs.sound !== "default") {
          notificationOptions.sound = notifArgs.sound;
        } else {
          // Default case: sound is undefined or "default"
          notificationOptions.sound = true;
        }

        if (notifArgs.icon) {
          notificationOptions.icon = path.resolve(notifArgs.icon);
        }

        if (notifArgs.contentImage) {
          notificationOptions.contentImage = path.resolve(notifArgs.contentImage);
        }

        if (notifArgs.closeLabel) {
          notificationOptions.closeLabel = notifArgs.closeLabel;
        }

        if (notifArgs.actions && notifArgs.actions.length > 0) {
          notificationOptions.actions = notifArgs.actions;
        }

        if (notifArgs.reply) {
          notificationOptions.reply = true;
        }

        const result = await new Promise<{
          type: string;
          response?: string;
          activationValue?: string;
          error?: string;
        }>((resolve, reject) => {
          try {
            const notification = notifier.notify(notificationOptions, (err, response) => {
              if (err) {
                // Check for common notification failure scenarios
                if (err.message?.includes("Notification Center")) {
                  resolve({ 
                    type: "error", 
                    error: "Notifications may be disabled in System Settings or blocked by Focus mode" 
                  });
                } else {
                  resolve({ 
                    type: "error", 
                    error: err.message || "Failed to send notification" 
                  });
                }
              } else if (!notifArgs.wait) {
                // Check if response indicates notification was not shown
                if (response === "Notification not sent") {
                  resolve({ 
                    type: "error", 
                    error: "Notification was not displayed (may be disabled or in Focus mode)" 
                  });
                } else {
                  resolve({ type: "sent", response });
                }
              }
            });
          } catch (error) {
            // Handle synchronous errors from notifier
            resolve({ 
              type: "error", 
              error: `Failed to create notification: ${error}` 
            });
          }

          if (notifArgs.wait) {
            // Set up event listeners for user interaction
            notifier.on("click", (notifierObject, options) => {
              resolve({ type: "clicked" });
            });

            notifier.on("timeout", (notifierObject, options) => {
              resolve({ type: "timeout" });
            });

            if (notifArgs.reply) {
              notifier.on("replied", (notifierObject, options, metadata) => {
                resolve({ 
                  type: "replied", 
                  response: metadata.activationValue 
                });
              });
            }

            if (notifArgs.actions && notifArgs.actions.length > 0) {
              notifier.on("activate", (notifierObject, options, metadata) => {
                resolve({ 
                  type: "action", 
                  activationValue: metadata.activationValue 
                });
              });
            }
          }
        });

        // Handle error cases gracefully
        if (result.type === "error") {
          return {
            content: [
              {
                type: "text",
                text: `⚠️ Could not send notification: ${result.error}\n\nTo enable notifications:\n1. Open System Settings > Notifications\n2. Find "Terminal" in the app list\n3. Allow notifications\n4. Check that Focus mode isn't blocking notifications`,
              },
            ],
          };
        }

        let resultText = `Notification sent successfully: "${notifArgs.title}"`;
        
        if (result.type === "clicked") {
          resultText = `Notification clicked: "${notifArgs.title}"`;
        } else if (result.type === "timeout") {
          resultText = `Notification timed out: "${notifArgs.title}"`;
        } else if (result.type === "replied" && result.response) {
          resultText = `Notification reply received: "${result.response}"`;
        } else if (result.type === "action" && result.activationValue) {
          resultText = `Notification action clicked: "${result.activationValue}"`;
        }

        return {
          content: [
            {
              type: "text",
              text: resultText,
            },
          ],
        };
      } catch (error) {
        // Return a helpful message instead of throwing an error
        return {
          content: [
            {
              type: "text",
              text: `⚠️ Could not send notification due to an unexpected error: ${error}\n\nThis might happen if:\n- Notifications are disabled in System Settings\n- Focus mode is blocking notifications\n- Terminal doesn't have notification permissions\n\nPlease check System Settings > Notifications > Terminal`,
            },
          ],
        };
      }
    }

    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Notifications MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});