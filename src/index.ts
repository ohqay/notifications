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
        description: "Send a macOS notification with customizable options",
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
            subtitle: {
              type: "string",
              description: "Optional subtitle for the notification",
            },
            sound: {
              type: "string",
              description: `Notification sound. Can be: ${MACOS_SOUNDS.join(", ")}, or 'none' for silent`,
              enum: [...MACOS_SOUNDS, "none"],
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
          required: ["title"],
        },
      },
      {
        name: "send_simple_notification",
        description: "Send a simple notification with just title and message",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "The notification title",
            },
            message: {
              type: "string",
              description: "The notification message",
            },
            sound: {
              type: "boolean",
              description: "Play the default notification sound",
              default: true,
            },
          },
          required: ["title", "message"],
        },
      },
    ],
  };
});

// Type definitions for tool arguments
interface SimpleNotificationArgs {
  title: string;
  message: string;
  sound?: boolean;
}

interface NotificationArgs {
  title: string;
  message?: string;
  subtitle?: string;
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
    case "send_simple_notification": {
      const notifArgs = args as unknown as SimpleNotificationArgs;
      
      try {
        await new Promise<string>((resolve, reject) => {
          notifier.notify(
            {
              title: notifArgs.title,
              message: notifArgs.message,
              sound: notifArgs.sound !== false,
              timeout: 10,
            },
            (err, response) => {
              if (err) {
                reject(err);
              } else {
                resolve(response);
              }
            }
          );
        });

        return {
          content: [
            {
              type: "text",
              text: `Notification sent successfully: "${notifArgs.title}"`,
            },
          ],
        };
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to send notification: ${error}`
        );
      }
    }

    case "send_notification": {
      const notifArgs = args as unknown as NotificationArgs;
      
      try {
        const notificationOptions: any = {
          title: notifArgs.title,
          message: notifArgs.message || "",
          timeout: notifArgs.timeout || 10,
          wait: notifArgs.wait || false,
        };

        // Add optional properties
        if (notifArgs.subtitle) {
          notificationOptions.subtitle = notifArgs.subtitle;
        }

        if (notifArgs.sound && notifArgs.sound !== "none") {
          notificationOptions.sound = notifArgs.sound === "default" ? true : notifArgs.sound;
        } else if (notifArgs.sound === "none") {
          notificationOptions.sound = false;
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
        }>((resolve, reject) => {
          const notification = notifier.notify(notificationOptions, (err, response) => {
            if (err) {
              reject(err);
            } else if (!notifArgs.wait) {
              resolve({ type: "sent", response });
            }
          });

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
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to send notification: ${error}`
        );
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