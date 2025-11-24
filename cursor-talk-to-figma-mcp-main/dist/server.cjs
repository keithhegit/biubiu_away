#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/talk_to_figma_mcp/server.ts
var import_mcp = require("@modelcontextprotocol/sdk/server/mcp.js");
var import_stdio = require("@modelcontextprotocol/sdk/server/stdio.js");
var import_zod = require("zod");
var import_ws = __toESM(require("ws"), 1);
var import_uuid = require("uuid");
var logger = {
  info: (message) => process.stderr.write(`[INFO] ${message}
`),
  debug: (message) => process.stderr.write(`[DEBUG] ${message}
`),
  warn: (message) => process.stderr.write(`[WARN] ${message}
`),
  error: (message) => process.stderr.write(`[ERROR] ${message}
`),
  log: (message) => process.stderr.write(`[LOG] ${message}
`)
};
var ws = null;
var pendingRequests = /* @__PURE__ */ new Map();
var currentChannel = null;
var server = new import_mcp.McpServer({
  name: "TalkToFigmaMCP",
  version: "1.0.0"
});
var args = process.argv.slice(2);
var serverArg = args.find((arg) => arg.startsWith("--server="));
var serverUrl = serverArg ? serverArg.split("=")[1] : "localhost";
var WS_URL = serverUrl === "localhost" ? `ws://${serverUrl}` : `wss://${serverUrl}`;
server.tool(
  "get_document_info",
  "Get detailed information about the current Figma document",
  {},
  async () => {
    try {
      const result = await sendCommandToFigma("get_document_info");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting document info: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "get_selection",
  "Get information about the current selection in Figma",
  {},
  async () => {
    try {
      const result = await sendCommandToFigma("get_selection");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting selection: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "get_node_info",
  "Get detailed information about a specific node in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to get information about")
  },
  async ({ nodeId }) => {
    try {
      const result = await sendCommandToFigma("get_node_info", { nodeId });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(filterFigmaNode(result))
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting node info: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
function rgbaToHex(color) {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = Math.round(color.a * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}${a === 255 ? "" : a.toString(16).padStart(2, "0")}`;
}
function filterFigmaNode(node) {
  if (node.type === "VECTOR") {
    return null;
  }
  const filtered = {
    id: node.id,
    name: node.name,
    type: node.type
  };
  if (node.fills && node.fills.length > 0) {
    filtered.fills = node.fills.map((fill) => {
      const processedFill = { ...fill };
      delete processedFill.boundVariables;
      delete processedFill.imageRef;
      if (processedFill.gradientStops) {
        processedFill.gradientStops = processedFill.gradientStops.map((stop) => {
          const processedStop = { ...stop };
          if (processedStop.color) {
            processedStop.color = rgbaToHex(processedStop.color);
          }
          delete processedStop.boundVariables;
          return processedStop;
        });
      }
      if (processedFill.color) {
        processedFill.color = rgbaToHex(processedFill.color);
      }
      return processedFill;
    });
  }
  if (node.strokes && node.strokes.length > 0) {
    filtered.strokes = node.strokes.map((stroke) => {
      const processedStroke = { ...stroke };
      delete processedStroke.boundVariables;
      if (processedStroke.color) {
        processedStroke.color = rgbaToHex(processedStroke.color);
      }
      return processedStroke;
    });
  }
  if (node.cornerRadius !== void 0) {
    filtered.cornerRadius = node.cornerRadius;
  }
  if (node.absoluteBoundingBox) {
    filtered.absoluteBoundingBox = node.absoluteBoundingBox;
  }
  if (node.characters) {
    filtered.characters = node.characters;
  }
  if (node.style) {
    filtered.style = {
      fontFamily: node.style.fontFamily,
      fontStyle: node.style.fontStyle,
      fontWeight: node.style.fontWeight,
      fontSize: node.style.fontSize,
      textAlignHorizontal: node.style.textAlignHorizontal,
      letterSpacing: node.style.letterSpacing,
      lineHeightPx: node.style.lineHeightPx
    };
  }
  if (node.children) {
    filtered.children = node.children.map((child) => filterFigmaNode(child)).filter((child) => child !== null);
  }
  return filtered;
}
server.tool(
  "get_nodes_info",
  "Get detailed information about multiple nodes in Figma",
  {
    nodeIds: import_zod.z.array(import_zod.z.string()).describe("Array of node IDs to get information about")
  },
  async ({ nodeIds }) => {
    try {
      const results = await Promise.all(
        nodeIds.map(async (nodeId) => {
          const result = await sendCommandToFigma("get_node_info", { nodeId });
          return { nodeId, info: result };
        })
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results.map((result) => filterFigmaNode(result.info)))
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting nodes info: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_rectangle",
  "Create a new rectangle in Figma",
  {
    x: import_zod.z.number().describe("X position"),
    y: import_zod.z.number().describe("Y position"),
    width: import_zod.z.number().describe("Width of the rectangle"),
    height: import_zod.z.number().describe("Height of the rectangle"),
    name: import_zod.z.string().optional().describe("Optional name for the rectangle"),
    parentId: import_zod.z.string().optional().describe("Optional parent node ID to append the rectangle to")
  },
  async ({ x, y, width, height, name, parentId }) => {
    try {
      const result = await sendCommandToFigma("create_rectangle", {
        x,
        y,
        width,
        height,
        name: name || "Rectangle",
        parentId
      });
      return {
        content: [
          {
            type: "text",
            text: `Created rectangle "${JSON.stringify(result)}"`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating rectangle: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_frame",
  "Create a new frame in Figma",
  {
    x: import_zod.z.number().describe("X position"),
    y: import_zod.z.number().describe("Y position"),
    width: import_zod.z.number().describe("Width of the frame"),
    height: import_zod.z.number().describe("Height of the frame"),
    name: import_zod.z.string().optional().describe("Optional name for the frame"),
    parentId: import_zod.z.string().optional().describe("Optional parent node ID to append the frame to"),
    fillColor: import_zod.z.object({
      r: import_zod.z.number().min(0).max(1).describe("Red component (0-1)"),
      g: import_zod.z.number().min(0).max(1).describe("Green component (0-1)"),
      b: import_zod.z.number().min(0).max(1).describe("Blue component (0-1)"),
      a: import_zod.z.number().min(0).max(1).optional().describe("Alpha component (0-1)")
    }).optional().describe("Fill color in RGBA format"),
    strokeColor: import_zod.z.object({
      r: import_zod.z.number().min(0).max(1).describe("Red component (0-1)"),
      g: import_zod.z.number().min(0).max(1).describe("Green component (0-1)"),
      b: import_zod.z.number().min(0).max(1).describe("Blue component (0-1)"),
      a: import_zod.z.number().min(0).max(1).optional().describe("Alpha component (0-1)")
    }).optional().describe("Stroke color in RGBA format"),
    strokeWeight: import_zod.z.number().positive().optional().describe("Stroke weight")
  },
  async ({
    x,
    y,
    width,
    height,
    name,
    parentId,
    fillColor,
    strokeColor,
    strokeWeight
  }) => {
    try {
      const result = await sendCommandToFigma("create_frame", {
        x,
        y,
        width,
        height,
        name: name || "Frame",
        parentId,
        fillColor: fillColor || { r: 1, g: 1, b: 1, a: 1 },
        strokeColor,
        strokeWeight
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Created frame "${typedResult.name}" with ID: ${typedResult.id}. Use the ID as the parentId to appendChild inside this frame.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating frame: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_text",
  "Create a new text element in Figma",
  {
    x: import_zod.z.number().describe("X position"),
    y: import_zod.z.number().describe("Y position"),
    text: import_zod.z.string().describe("Text content"),
    fontSize: import_zod.z.number().optional().describe("Font size (default: 14)"),
    fontWeight: import_zod.z.number().optional().describe("Font weight (e.g., 400 for Regular, 700 for Bold)"),
    fontColor: import_zod.z.object({
      r: import_zod.z.number().min(0).max(1).describe("Red component (0-1)"),
      g: import_zod.z.number().min(0).max(1).describe("Green component (0-1)"),
      b: import_zod.z.number().min(0).max(1).describe("Blue component (0-1)"),
      a: import_zod.z.number().min(0).max(1).optional().describe("Alpha component (0-1)")
    }).optional().describe("Font color in RGBA format"),
    name: import_zod.z.string().optional().describe("Optional name for the text node by default following text"),
    parentId: import_zod.z.string().optional().describe("Optional parent node ID to append the text to")
  },
  async ({ x, y, text, fontSize, fontWeight, fontColor, name, parentId }) => {
    try {
      const result = await sendCommandToFigma("create_text", {
        x,
        y,
        text,
        fontSize: fontSize || 14,
        fontWeight: fontWeight || 400,
        fontColor: fontColor || { r: 0, g: 0, b: 0, a: 1 },
        name: name || "Text",
        parentId
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Created text "${typedResult.name}" with ID: ${typedResult.id}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating text: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_fill_color",
  "Set the fill color of a node in Figma can be TextNode or FrameNode",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to modify"),
    r: import_zod.z.number().min(0).max(1).describe("Red component (0-1)"),
    g: import_zod.z.number().min(0).max(1).describe("Green component (0-1)"),
    b: import_zod.z.number().min(0).max(1).describe("Blue component (0-1)"),
    a: import_zod.z.number().min(0).max(1).optional().describe("Alpha component (0-1)")
  },
  async ({ nodeId, r, g, b, a }) => {
    try {
      const result = await sendCommandToFigma("set_fill_color", {
        nodeId,
        color: { r, g, b, a: a || 1 }
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Set fill color of node "${typedResult.name}" to RGBA(${r}, ${g}, ${b}, ${a || 1})`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting fill color: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_stroke_color",
  "Set the stroke color of a node in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to modify"),
    r: import_zod.z.number().min(0).max(1).describe("Red component (0-1)"),
    g: import_zod.z.number().min(0).max(1).describe("Green component (0-1)"),
    b: import_zod.z.number().min(0).max(1).describe("Blue component (0-1)"),
    a: import_zod.z.number().min(0).max(1).optional().describe("Alpha component (0-1)"),
    weight: import_zod.z.number().positive().optional().describe("Stroke weight")
  },
  async ({ nodeId, r, g, b, a, weight }) => {
    try {
      const result = await sendCommandToFigma("set_stroke_color", {
        nodeId,
        color: { r, g, b, a: a || 1 },
        weight: weight || 1
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Set stroke color of node "${typedResult.name}" to RGBA(${r}, ${g}, ${b}, ${a || 1}) with weight ${weight || 1}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting stroke color: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "move_node",
  "Move a node to a new position in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to move"),
    x: import_zod.z.number().describe("New X position"),
    y: import_zod.z.number().describe("New Y position")
  },
  async ({ nodeId, x, y }) => {
    try {
      const result = await sendCommandToFigma("move_node", { nodeId, x, y });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Moved node "${typedResult.name}" to position (${x}, ${y})`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error moving node: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "clone_node",
  "Clone an existing node in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to clone"),
    x: import_zod.z.number().optional().describe("New X position for the clone"),
    y: import_zod.z.number().optional().describe("New Y position for the clone")
  },
  async ({ nodeId, x, y }) => {
    try {
      const result = await sendCommandToFigma("clone_node", { nodeId, x, y });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Cloned node "${typedResult.name}" with new ID: ${typedResult.id}${x !== void 0 && y !== void 0 ? ` at position (${x}, ${y})` : ""}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error cloning node: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "resize_node",
  "Resize a node in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to resize"),
    width: import_zod.z.number().positive().describe("New width"),
    height: import_zod.z.number().positive().describe("New height")
  },
  async ({ nodeId, width, height }) => {
    try {
      const result = await sendCommandToFigma("resize_node", {
        nodeId,
        width,
        height
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Resized node "${typedResult.name}" to width ${width} and height ${height}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error resizing node: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "delete_node",
  "Delete a node from Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to delete")
  },
  async ({ nodeId }) => {
    try {
      await sendCommandToFigma("delete_node", { nodeId });
      return {
        content: [
          {
            type: "text",
            text: `Deleted node with ID: ${nodeId}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error deleting node: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "export_node_as_image",
  "Export a node as an image from Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to export"),
    format: import_zod.z.enum(["PNG", "JPG", "SVG", "PDF"]).optional().describe("Export format"),
    scale: import_zod.z.number().positive().optional().describe("Export scale")
  },
  async ({ nodeId, format, scale }) => {
    try {
      const result = await sendCommandToFigma("export_node_as_image", {
        nodeId,
        format: format || "PNG",
        scale: scale || 1
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "image",
            data: typedResult.imageData,
            mimeType: typedResult.mimeType || "image/png"
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error exporting node as image: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_text_content",
  "Set the text content of an existing text node in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the text node to modify"),
    text: import_zod.z.string().describe("New text content")
  },
  async ({ nodeId, text }) => {
    try {
      const result = await sendCommandToFigma("set_text_content", {
        nodeId,
        text
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Updated text content of node "${typedResult.name}" to "${text}"`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting text content: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "get_styles",
  "Get all styles from the current Figma document",
  {},
  async () => {
    try {
      const result = await sendCommandToFigma("get_styles");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting styles: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "get_local_components",
  "Get all local components from the Figma document",
  {},
  async () => {
    try {
      const result = await sendCommandToFigma("get_local_components");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting local components: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "create_component_instance",
  "Create an instance of a component in Figma",
  {
    componentKey: import_zod.z.string().describe("Key of the component to instantiate"),
    x: import_zod.z.number().describe("X position"),
    y: import_zod.z.number().describe("Y position")
  },
  async ({ componentKey, x, y }) => {
    try {
      const result = await sendCommandToFigma("create_component_instance", {
        componentKey,
        x,
        y
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(typedResult)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating component instance: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.tool(
  "set_corner_radius",
  "Set the corner radius of a node in Figma",
  {
    nodeId: import_zod.z.string().describe("The ID of the node to modify"),
    radius: import_zod.z.number().min(0).describe("Corner radius value"),
    corners: import_zod.z.array(import_zod.z.boolean()).length(4).optional().describe(
      "Optional array of 4 booleans to specify which corners to round [topLeft, topRight, bottomRight, bottomLeft]"
    )
  },
  async ({ nodeId, radius, corners }) => {
    try {
      const result = await sendCommandToFigma("set_corner_radius", {
        nodeId,
        radius,
        corners: corners || [true, true, true, true]
      });
      const typedResult = result;
      return {
        content: [
          {
            type: "text",
            text: `Set corner radius of node "${typedResult.name}" to ${radius}px`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting corner radius: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.prompt(
  "design_strategy",
  "Best practices for working with Figma designs",
  (extra) => {
    return {
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: `When working with Figma designs, follow these best practices:

1. Start with Document Structure:
   - First use get_document_info() to understand the current document
   - Plan your layout hierarchy before creating elements
   - Create a main container frame for each screen/section

2. Naming Conventions:
   - Use descriptive, semantic names for all elements
   - Follow a consistent naming pattern (e.g., "Login Screen", "Logo Container", "Email Input")
   - Group related elements with meaningful names

3. Layout Hierarchy:
   - Create parent frames first, then add child elements
   - For forms/login screens:
     * Start with the main screen container frame
     * Create a logo container at the top
     * Group input fields in their own containers
     * Place action buttons (login, submit) after inputs
     * Add secondary elements (forgot password, signup links) last

4. Input Fields Structure:
   - Create a container frame for each input field
   - Include a label text above or inside the input
   - Group related inputs (e.g., username/password) together

5. Element Creation:
   - Use create_frame() for containers and input fields
   - Use create_text() for labels, buttons text, and links
   - Set appropriate colors and styles:
     * Use fillColor for backgrounds
     * Use strokeColor for borders
     * Set proper fontWeight for different text elements

6. Mofifying existing elements:
  - use set_text_content() to modify text content.

7. Visual Hierarchy:
   - Position elements in logical reading order (top to bottom)
   - Maintain consistent spacing between elements
   - Use appropriate font sizes for different text types:
     * Larger for headings/welcome text
     * Medium for input labels
     * Standard for button text
     * Smaller for helper text/links

8. Best Practices:
   - Verify each creation with get_node_info()
   - Use parentId to maintain proper hierarchy
   - Group related elements together in frames
   - Keep consistent spacing and alignment

Example Login Screen Structure:
- Login Screen (main frame)
  - Logo Container (frame)
    - Logo (image/text)
  - Welcome Text (text)
  - Input Container (frame)
    - Email Input (frame)
      - Email Label (text)
      - Email Field (frame)
    - Password Input (frame)
      - Password Label (text)
      - Password Field (frame)
  - Login Button (frame)
    - Button Text (text)
  - Helper Links (frame)
    - Forgot Password (text)
    - Don't have account (text)`
          }
        }
      ],
      description: "Best practices for working with Figma designs"
    };
  }
);
server.prompt(
  "read_design_strategy",
  "Best practices for reading Figma designs",
  (extra) => {
    return {
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: `When reading Figma designs, follow these best practices:

1. Start with selection:
   - First use get_selection() to understand the current selection
   - If no selection ask user to select single or multiple nodes

2. Get node infos of the selected nodes:
   - Use get_nodes_info() to get the information of the selected nodes
   - If no selection ask user to select single or multiple nodes
`
          }
        }
      ],
      description: "Best practices for reading Figma designs"
    };
  }
);
server.tool(
  "scan_text_nodes",
  "Scan all text nodes in the selected Figma node",
  {
    nodeId: import_zod.z.string().describe("ID of the node to scan")
  },
  async ({ nodeId }) => {
    try {
      const initialStatus = {
        type: "text",
        text: "Starting text node scanning. This may take a moment for large designs..."
      };
      const result = await sendCommandToFigma("scan_text_nodes", {
        nodeId,
        useChunking: true,
        // Enable chunking on the plugin side
        chunkSize: 10
        // Process 10 nodes at a time
      });
      if (result && typeof result === "object" && "chunks" in result) {
        const typedResult = result;
        const summaryText = `
        Scan completed:
        - Found ${typedResult.totalNodes} text nodes
        - Processed in ${typedResult.chunks} chunks
        `;
        return {
          content: [
            initialStatus,
            {
              type: "text",
              text: summaryText
            },
            {
              type: "text",
              text: JSON.stringify(typedResult.textNodes, null, 2)
            }
          ]
        };
      }
      return {
        content: [
          initialStatus,
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error scanning text nodes: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
server.prompt(
  "text_replacement_strategy",
  "Systematic approach for replacing text in Figma designs",
  (extra) => {
    return {
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: `# Intelligent Text Replacement Strategy

## 1. Analyze Design & Identify Structure
- Scan text nodes to understand the overall structure of the design
- Use AI pattern recognition to identify logical groupings:
  * Tables (rows, columns, headers, cells)
  * Lists (items, headers, nested lists)
  * Card groups (similar cards with recurring text fields)
  * Forms (labels, input fields, validation text)
  * Navigation (menu items, breadcrumbs)
\`\`\`
scan_text_nodes(nodeId: "node-id")
get_node_info(nodeId: "node-id")  // optional
\`\`\`

## 2. Strategic Chunking for Complex Designs
- Divide replacement tasks into logical content chunks based on design structure
- Use one of these chunking strategies that best fits the design:
  * **Structural Chunking**: Table rows/columns, list sections, card groups
  * **Spatial Chunking**: Top-to-bottom, left-to-right in screen areas
  * **Semantic Chunking**: Content related to the same topic or functionality
  * **Component-Based Chunking**: Process similar component instances together

## 3. Progressive Replacement with Verification
- Create a safe copy of the node for text replacement
- Replace text chunk by chunk with continuous progress updates
- After each chunk is processed:
  * Export that section as a small, manageable image
  * Verify text fits properly and maintain design integrity
  * Fix issues before proceeding to the next chunk

\`\`\`
// Clone the node to create a safe copy
clone_node(nodeId: "selected-node-id", x: [new-x], y: [new-y])

// Replace text chunk by chunk
set_multiple_text_contents(
  nodeId: "parent-node-id", 
  text: [
    { nodeId: "node-id-1", text: "New text 1" },
    // More nodes in this chunk...
  ]
)

// Verify chunk with small, targeted image exports
export_node_as_image(nodeId: "chunk-node-id", format: "PNG", scale: 0.5)
\`\`\`

## 4. Intelligent Handling for Table Data
- For tabular content:
  * Process one row or column at a time
  * Maintain alignment and spacing between cells
  * Consider conditional formatting based on cell content
  * Preserve header/data relationships

## 5. Smart Text Adaptation
- Adaptively handle text based on container constraints:
  * Auto-detect space constraints and adjust text length
  * Apply line breaks at appropriate linguistic points
  * Maintain text hierarchy and emphasis
  * Consider font scaling for critical content that must fit

## 6. Progressive Feedback Loop
- Establish a continuous feedback loop during replacement:
  * Real-time progress updates (0-100%)
  * Small image exports after each chunk for verification
  * Issues identified early and resolved incrementally
  * Quick adjustments applied to subsequent chunks

## 7. Final Verification & Context-Aware QA
- After all chunks are processed:
  * Export the entire design at reduced scale for final verification
  * Check for cross-chunk consistency issues
  * Verify proper text flow between different sections
  * Ensure design harmony across the full composition

## 8. Chunk-Specific Export Scale Guidelines
- Scale exports appropriately based on chunk size:
  * Small chunks (1-5 elements): scale 1.0
  * Medium chunks (6-20 elements): scale 0.7
  * Large chunks (21-50 elements): scale 0.5
  * Very large chunks (50+ elements): scale 0.3
  * Full design verification: scale 0.2

## Sample Chunking Strategy for Common Design Types

### Tables
- Process by logical rows (5-10 rows per chunk)
- Alternative: Process by column for columnar analysis
- Tip: Always include header row in first chunk for reference

### Card Lists
- Group 3-5 similar cards per chunk
- Process entire cards to maintain internal consistency
- Verify text-to-image ratio within cards after each chunk

### Forms
- Group related fields (e.g., "Personal Information", "Payment Details")
- Process labels and input fields together
- Ensure validation messages and hints are updated with their fields

### Navigation & Menus
- Process hierarchical levels together (main menu, submenu)
- Respect information architecture relationships
- Verify menu fit and alignment after replacement

## Best Practices
- **Preserve Design Intent**: Always prioritize design integrity
- **Structural Consistency**: Maintain alignment, spacing, and hierarchy
- **Visual Feedback**: Verify each chunk visually before proceeding
- **Incremental Improvement**: Learn from each chunk to improve subsequent ones
- **Balance Automation & Control**: Let AI handle repetitive replacements but maintain oversight
- **Respect Content Relationships**: Keep related content consistent across chunks

Remember that text is never just text\u2014it's a core design element that must work harmoniously with the overall composition. This chunk-based strategy allows you to methodically transform text while maintaining design integrity.`
          }
        }
      ],
      description: "Systematic approach for replacing text in Figma designs"
    };
  }
);
server.tool(
  "set_multiple_text_contents",
  "Set multiple text contents parallelly in a node",
  {
    nodeId: import_zod.z.string().describe("The ID of the node containing the text nodes to replace"),
    text: import_zod.z.array(
      import_zod.z.object({
        nodeId: import_zod.z.string().describe("The ID of the text node"),
        text: import_zod.z.string().describe("The replacement text")
      })
    ).describe("Array of text node IDs and their replacement texts")
  },
  async ({ nodeId, text }, extra) => {
    try {
      if (!text || text.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No text provided"
            }
          ]
        };
      }
      const initialStatus = {
        type: "text",
        text: `Starting text replacement for ${text.length} nodes. This will be processed in batches of 5...`
      };
      let totalProcessed = 0;
      const totalToProcess = text.length;
      const result = await sendCommandToFigma("set_multiple_text_contents", {
        nodeId,
        text
      });
      const typedResult = result;
      const success = typedResult.replacementsApplied && typedResult.replacementsApplied > 0;
      const progressText = `
      Text replacement completed:
      - ${typedResult.replacementsApplied || 0} of ${totalToProcess} successfully updated
      - ${typedResult.replacementsFailed || 0} failed
      - Processed in ${typedResult.completedInChunks || 1} batches
      `;
      const detailedResults = typedResult.results || [];
      const failedResults = detailedResults.filter((item) => !item.success);
      let detailedResponse = "";
      if (failedResults.length > 0) {
        detailedResponse = `

Nodes that failed:
${failedResults.map(
          (item) => `- ${item.nodeId}: ${item.error || "Unknown error"}`
        ).join("\n")}`;
      }
      return {
        content: [
          initialStatus,
          {
            type: "text",
            text: progressText + detailedResponse
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting multiple text contents: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
function connectToFigma(port = 3055) {
  if (ws && ws.readyState === import_ws.default.OPEN) {
    logger.info("Already connected to Figma");
    return;
  }
  const wsUrl = serverUrl === "localhost" ? `${WS_URL}:${port}` : WS_URL;
  logger.info(`Connecting to Figma socket server at ${wsUrl}...`);
  ws = new import_ws.default(wsUrl);
  ws.on("open", () => {
    logger.info("Connected to Figma socket server");
    currentChannel = null;
  });
  ws.on("message", (data) => {
    try {
      const json = JSON.parse(data);
      if (json.type === "progress_update") {
        const progressData = json.message.data;
        const requestId = json.id || "";
        if (requestId && pendingRequests.has(requestId)) {
          const request = pendingRequests.get(requestId);
          request.lastActivity = Date.now();
          clearTimeout(request.timeout);
          request.timeout = setTimeout(() => {
            if (pendingRequests.has(requestId)) {
              logger.error(`Request ${requestId} timed out after extended period of inactivity`);
              pendingRequests.delete(requestId);
              request.reject(new Error("Request to Figma timed out"));
            }
          }, 6e4);
          logger.info(`Progress update for ${progressData.commandType}: ${progressData.progress}% - ${progressData.message}`);
          if (progressData.status === "completed" && progressData.progress === 100) {
            logger.info(`Operation ${progressData.commandType} completed, waiting for final result`);
          }
        }
        return;
      }
      const myResponse = json.message;
      logger.debug(`Received message: ${JSON.stringify(myResponse)}`);
      logger.log("myResponse" + JSON.stringify(myResponse));
      if (myResponse.id && pendingRequests.has(myResponse.id) && myResponse.result) {
        const request = pendingRequests.get(myResponse.id);
        clearTimeout(request.timeout);
        if (myResponse.error) {
          logger.error(`Error from Figma: ${myResponse.error}`);
          request.reject(new Error(myResponse.error));
        } else {
          if (myResponse.result) {
            request.resolve(myResponse.result);
          }
        }
        pendingRequests.delete(myResponse.id);
      } else {
        logger.info(`Received broadcast message: ${JSON.stringify(myResponse)}`);
      }
    } catch (error) {
      logger.error(`Error parsing message: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  ws.on("error", (error) => {
    logger.error(`Socket error: ${error}`);
  });
  ws.on("close", () => {
    logger.info("Disconnected from Figma socket server");
    ws = null;
    for (const [id, request] of pendingRequests.entries()) {
      clearTimeout(request.timeout);
      request.reject(new Error("Connection closed"));
      pendingRequests.delete(id);
    }
    logger.info("Attempting to reconnect in 2 seconds...");
    setTimeout(() => connectToFigma(port), 2e3);
  });
}
async function joinChannel(channelName) {
  if (!ws || ws.readyState !== import_ws.default.OPEN) {
    throw new Error("Not connected to Figma");
  }
  try {
    await sendCommandToFigma("join", { channel: channelName });
    currentChannel = channelName;
    logger.info(`Joined channel: ${channelName}`);
  } catch (error) {
    logger.error(`Failed to join channel: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
function sendCommandToFigma(command, params = {}, timeoutMs = 3e4) {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== import_ws.default.OPEN) {
      connectToFigma();
      reject(new Error("Not connected to Figma. Attempting to connect..."));
      return;
    }
    const requiresChannel = command !== "join";
    if (requiresChannel && !currentChannel) {
      reject(new Error("Must join a channel before sending commands"));
      return;
    }
    const id = (0, import_uuid.v4)();
    const request = {
      id,
      type: command === "join" ? "join" : "message",
      ...command === "join" ? { channel: params.channel } : { channel: currentChannel },
      message: {
        id,
        command,
        params: {
          ...params,
          commandId: id
          // Include the command ID in params
        }
      }
    };
    const timeout = setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        logger.error(`Request ${id} to Figma timed out after ${timeoutMs / 1e3} seconds`);
        reject(new Error("Request to Figma timed out"));
      }
    }, timeoutMs);
    pendingRequests.set(id, {
      resolve,
      reject,
      timeout,
      lastActivity: Date.now()
    });
    logger.info(`Sending command to Figma: ${command}`);
    logger.debug(`Request details: ${JSON.stringify(request)}`);
    ws.send(JSON.stringify(request));
  });
}
server.tool(
  "join_channel",
  "Join a specific channel to communicate with Figma",
  {
    channel: import_zod.z.string().describe("The name of the channel to join").default("")
  },
  async ({ channel }) => {
    try {
      if (!channel) {
        return {
          content: [
            {
              type: "text",
              text: "Please provide a channel name to join:"
            }
          ],
          followUp: {
            tool: "join_channel",
            description: "Join the specified channel"
          }
        };
      }
      await joinChannel(channel);
      return {
        content: [
          {
            type: "text",
            text: `Successfully joined channel: ${channel}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error joining channel: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
async function main() {
  try {
    connectToFigma();
  } catch (error) {
    logger.warn(`Could not connect to Figma initially: ${error instanceof Error ? error.message : String(error)}`);
    logger.warn("Will try to connect when the first command is sent");
  }
  const transport = new import_stdio.StdioServerTransport();
  await server.connect(transport);
  logger.info("FigmaMCP server running on stdio");
}
main().catch((error) => {
  logger.error(`Error starting FigmaMCP server: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map