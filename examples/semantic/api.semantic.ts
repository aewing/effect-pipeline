// Semantic API - Advanced example with services and error handling
// Shows how complex Effect patterns can be made simple and intuitive

import { ingress, transform, egress, pipeline, run, service } from "../../../effect-pipeline/src/semantic";

// 🎯 Simple service definitions - no Context.Tag complexity
const database = service("Database", {
  async query(sql: string) {
    // Mock database query
    return [{ id: 1, name: "John Doe", email: "john@example.com" }];
  },
  
  async save(data: any) {
    // Mock database save
    return { id: Math.random().toString(36) };
  }
});

const logger = service("Logger", {
  async info(message: string) {
    console.log(`[INFO] ${message}`);
  },
  
  async error(message: string) {
    console.error(`[ERROR] ${message}`);
  }
});

// 🎯 Simple error classes - no _tag boilerplate
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = "ValidationError";
  }
}

class DatabaseError extends Error {
  constructor(message: string, public query: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

// 🎯 Nodes with services - dependency injection made simple
const apiIngress = ingress("api-ingress", async () => {
  return { 
    body: { userId: "123", action: "getProfile" },
    headers: { authorization: "Bearer token123" }
  };
});

const validateRequest = transform("validate-request", async (input: any, { logger }) => {
  await logger.info(`Validating request for user ${input.body.userId}`);
  
  if (!input.body.userId) {
    throw new ValidationError("User ID is required", "userId");
  }
  
  if (!input.headers.authorization) {
    throw new ValidationError("Authorization header is required", "authorization");
  }
  
  return {
    ...input,
    validated: true,
    timestamp: Date.now()
  };
});

const fetchUserData = transform("fetch-user-data", async (input: any, { database, logger }) => {
  await logger.info(`Fetching data for user ${input.body.userId}`);
  
  try {
    const users = await database.query(`SELECT * FROM users WHERE id = '${input.body.userId}'`);
    
    if (users.length === 0) {
      throw new DatabaseError("User not found", `SELECT * FROM users WHERE id = '${input.body.userId}'`);
    }
    
    return {
      ...input,
      user: users[0],
      fetchedAt: Date.now()
    };
  } catch (error) {
    throw new DatabaseError(`Failed to fetch user: ${error.message}`, "user query");
  }
});

const apiResponse = egress("api-response", async (input: any, { logger }) => {
  await logger.info(`Sending response for user ${input.user.name}`);
  
  console.log("API Response:", {
    status: 200,
    body: {
      user: input.user,
      metadata: {
        validated: input.validated,
        timestamp: input.timestamp,
        fetchedAt: input.fetchedAt
      }
    }
  });
});

// 🎯 Simple pipeline with services - no Layer complexity
const apiPipeline = pipeline("api-semantic")
  .with(database, logger)  // Provide services
  .start(apiIngress)
  .then(validateRequest)
  .then(fetchUserData)
  .end(apiResponse);

// 🎯 Simple execution with error handling
async function main() {
  console.log("🚀 Running semantic API pipeline...");
  
  try {
    await run(apiPipeline);
    console.log("✅ API pipeline completed successfully!");
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error(`❌ Validation failed: ${error.message} (field: ${error.field})`);
    } else if (error instanceof DatabaseError) {
      console.error(`❌ Database error: ${error.message} (query: ${error.query})`);
    } else {
      console.error("❌ Pipeline failed:", error);
    }
  }
}

// Run if this file is executed directly
if (import.meta.main) {
  main();
}

export default apiPipeline; 