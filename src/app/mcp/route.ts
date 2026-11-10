/**
 * MCP over Streamable HTTP, stateless: one server and transport per request.
 * LAN mode only; public mode answers 404 before auth.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { isLanMode } from "@/lib/mode";
import { authenticate } from "@/lib/mcp/auth";
import { TOOLS, callTool } from "@/lib/mcp/tools";

async function handle(req: Request): Promise<Response> {
  if (!isLanMode()) return new Response("Not Found", { status: 404 });
  const caller = await authenticate(req);
  if (!caller) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": "Bearer" },
    });
  }
  const server = new Server(
    { name: "nissekomm", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: Object.entries(TOOLS)
      .filter(([, t]) => t.level === "read" || caller.level === "parent")
      .map(([name, t]) => ({
        name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
  }));
  server.setRequestHandler(CallToolRequestSchema, async (r) => {
    try {
      const text = await callTool(
        caller,
        r.params.name,
        r.params.arguments,
      );
      return { content: [{ type: "text", text }] };
    } catch (e) {
      return {
        isError: true,
        content: [{ type: "text", text: (e as Error).message }],
      };
    }
  });
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(req);
}

export { handle as POST };
