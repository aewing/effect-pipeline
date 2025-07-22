// Semantic API - Simple, intuitive, async/await style
// This is what the framework COULD look like for everyday developers

import { ingress, transform, egress, pipeline, run } from "../../../effect-pipeline/src/semantic";

// 🎯 Simple node creation - no Effect.succeed(), no generators
const helloIngress = ingress("hello-ingress", async () => {
  return { query: { name: "World" } };
});

const enrichData = transform("enrich-data", async (input: { query: { name: string } }) => {
  return { message: `Hello ${input.query?.name || "World"}!` };
});

const helloEgress = egress("hello-egress", async (input: { message: string }) => {
  console.log("Response:", input);
});

// 🎯 Simple pipeline building - no pipe(), no complex chaining
const helloPipeline = pipeline("hello-semantic")
  .start(helloIngress)
  .then(enrichData)
  .end(helloEgress);

// 🎯 Simple execution - feels like regular async code
async function main() {
  console.log("🚀 Running semantic hello pipeline...");
  
  try {
    await run(helloPipeline);
    console.log("✅ Pipeline completed successfully!");
  } catch (error) {
    console.error("❌ Pipeline failed:", error);
  }
}

// Run if this file is executed directly
if (import.meta.main) {
  main();
}

export default helloPipeline; 