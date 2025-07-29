import { Effect } from "effect";
import { httpServer, httpResponse, mapJson } from "../src/nodes";
import { NodeKind, type Node } from "../src/core/node";
import { PipeBuilder } from "../src/pipes/builder";

// Create a simple transform node that processes the HTTP request
const processRequest: Node<any, any> = {
  kind: NodeKind.Transform,
  name: "process-request",
  run: (input) => Effect.gen(function* () {
    console.log("Processing HTTP request:", {
      method: input.method,
      url: input.url,
      query: input.query
    });

    // Transform the request into a response payload
    const responseData = {
      message: `Hello from the pipeline!`,
      timestamp: new Date().toISOString(),
      receivedMethod: input.method,
      receivedQuery: input.query,
      processedBy: "process-request node"
    };

    // Preserve the resolve function for the HTTP response
    if (input._resolve) {
      (responseData as any)._resolve = input._resolve;
    }

    return responseData;
  })
};

// Build the complete HTTP pipeline
const httpPipeline = new PipeBuilder()
  .from(httpServer("main-server", { 
    port: 8080, 
    hostname: "localhost",
    development: true 
  }))
  .through(processRequest)
  .to(httpResponse("main-response", {
    status: 200,
    headers: {
      "X-Powered-By": "Effect Pipeline",
      "Access-Control-Allow-Origin": "*"
    }
  }))
  .build();

console.log("🚀 Starting HTTP server pipeline...");
console.log("📡 Server will be available at: http://localhost:8080");
console.log("🧪 Try making requests to test the pipeline!");

// This example demonstrates:
// 1. Real HTTP server using Bun.serve
// 2. Request processing through Effect-based nodes
// 3. Proper HTTP response handling
// 4. Complete request-response cycle

export default httpPipeline;