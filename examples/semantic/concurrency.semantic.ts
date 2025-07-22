// Semantic API - Concurrency made simple
// Shows how Effect's powerful concurrency can be accessible to everyday developers

import { ingress, transform, egress, pipeline, run, service, concurrent } from "../../../effect-pipeline/src/semantic";

// 🎯 Simple service definitions for independent operations
const userService = service("UserService", {
  async getProfile(id: string) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id, name: "John Doe", email: "john@example.com" };
  }
});

const preferencesService = service("PreferencesService", {
  async getPreferences(id: string) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 150));
    return { theme: "dark", language: "en", notifications: true };
  }
});

const permissionsService = service("PermissionsService", {
  async getPermissions(id: string) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 80));
    return { canEdit: true, canDelete: false, role: "user" };
  }
});

// 🎯 Simple ingress
const userRequest = ingress("user-request", async () => {
  return { userId: "123" };
});

// 🎯 Concurrent data fetching - much simpler than Effect.all()
const fetchUserData = transform("fetch-user-data", async (input: any, services) => {
  const { userService, preferencesService, permissionsService } = services;
  
  console.log(`📦 Fetching data for user ${input.userId}...`);
  
  // 🎯 Simple concurrent execution - no Effect.all() complexity
  const result = await concurrent({
    profile: userService.getProfile(input.userId),
    preferences: preferencesService.getPreferences(input.userId),
    permissions: permissionsService.getPermissions(input.userId)
  });
  
  console.log("✅ All data fetched concurrently!");
  
  return {
    ...input,
    userData: result,
    fetchedAt: Date.now()
  };
});

// 🎯 Transform with conditional concurrent operations
const enrichUserData = transform("enrich-user-data", async (input: any, services) => {
  const { userService } = services;
  
  // Only fetch additional data if user has edit permissions
  if (input.userData.permissions.canEdit) {
    console.log("🔄 User has edit permissions, fetching additional data...");
    
    // Concurrent optional operations
    const additionalData = await concurrent({
      recentActivity: userService.getProfile(input.userId), // Mock additional call
      adminSettings: userService.getProfile(input.userId)   // Mock additional call
    });
    
    return {
      ...input,
      userData: {
        ...input.userData,
        additional: additionalData
      }
    };
  }
  
  return input;
});

// 🎯 Simple response
const userResponse = egress("user-response", async (input: any) => {
  console.log("📤 Sending complete user data:", {
    userId: input.userId,
    profile: input.userData.profile,
    preferences: input.userData.preferences,
    permissions: input.userData.permissions,
    hasAdditionalData: !!input.userData.additional,
    fetchedAt: input.fetchedAt
  });
});

// 🎯 Pipeline with concurrent services
const concurrentPipeline = pipeline("concurrent-semantic")
  .with(userService, preferencesService, permissionsService)
  .start(userRequest)
  .then(fetchUserData)
  .then(enrichUserData)
  .end(userResponse);

// 🎯 Simple execution with timing
async function main() {
  console.log("🚀 Running concurrent semantic pipeline...");
  const startTime = Date.now();
  
  try {
    await run(concurrentPipeline);
    const duration = Date.now() - startTime;
    console.log(`✅ Concurrent pipeline completed in ${duration}ms!`);
    console.log("💡 Notice how concurrent operations are much faster than sequential!");
  } catch (error) {
    console.error("❌ Pipeline failed:", error);
  }
}

// Run if this file is executed directly
if (import.meta.main) {
  main();
}

export default concurrentPipeline; 