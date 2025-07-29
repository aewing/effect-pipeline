/**
 * Semantic Zod Validation Example
 * 
 * This example shows how to use Zod schema validation with the semantic API
 * for more readable and expressive data validation pipelines.
 */
import { z } from "zod";
import { ingress, transform, egress, pipeline, run } from "../../src/semantic";

// API Request/Response Schemas
const CreatePostRequestSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10),
  tags: z.array(z.string()).max(10),
  publishedAt: z.string().datetime().optional(),
  metadata: z.object({
    authorId: z.string().uuid(),
    category: z.enum(["tech", "lifestyle", "business", "other"])
  })
});

const PostSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  publishedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.object({
    authorId: z.string().uuid(),
    category: z.string(),
    wordCount: z.number(),
    estimatedReadTime: z.number()
  })
});

// Mock HTTP request input
const httpRequest = ingress("http-request", async () => ({
  body: {
    title: "Getting Started with Zod Validation",
    content: "Zod is a TypeScript-first schema validation library that provides runtime type checking...",
    tags: ["typescript", "validation", "zod"],
    metadata: {
      authorId: "550e8400-e29b-41d4-a716-446655440000",
      category: "tech" as const
    }
  }
}));

// Validate incoming request using Zod schema
const validateRequest = transform("validate-request", async (input: any) => {
  const requestData = input.body;
  
  try {
    // Validate the request body against our schema
    const validatedData = CreatePostRequestSchema.parse(requestData);
    console.log("✅ Request validation passed");
    return validatedData;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    throw error;
  }
});

// Transform request data to internal post format
const createPost = transform("create-post", async (requestData: z.infer<typeof CreatePostRequestSchema>) => {
  // Calculate metadata
  const wordCount = requestData.content.split(/\s+/).length;
  const estimatedReadTime = Math.ceil(wordCount / 200); // 200 words per minute

  const post = {
    id: crypto.randomUUID(),
    title: requestData.title,
    content: requestData.content,
    tags: requestData.tags,
    publishedAt: requestData.publishedAt ? new Date(requestData.publishedAt) : new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {
      authorId: requestData.metadata.authorId,
      category: requestData.metadata.category,
      wordCount,
      estimatedReadTime
    }
  };

  // Validate the created post against our output schema
  try {
    const validatedPost = PostSchema.parse(post);
    console.log("✅ Post creation validation passed");
    return validatedPost;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Post validation failed:", error.errors);
      throw new Error("Failed to create valid post");
    }
    throw error;
  }
});

// Conditional validation based on post category
const validateCategoryRules = transform("validate-category-rules", async (post: z.infer<typeof PostSchema>) => {
  // Apply different validation rules based on category
  switch (post.metadata.category) {
    case "tech":
      // Tech posts should have at least one tech-related tag
      const techTags = ["typescript", "javascript", "python", "react", "node", "api", "database"];
      const hasTechTag = post.tags.some(tag => 
        techTags.some(techTag => tag.toLowerCase().includes(techTag))
      );
      if (!hasTechTag) {
        throw new Error("Tech posts must include at least one technology-related tag");
      }
      break;
      
    case "business":
      // Business posts should have reasonable read time
      if (post.metadata.estimatedReadTime > 15) {
        throw new Error("Business posts should be concise (max 15 minutes read time)");
      }
      break;
      
    case "lifestyle":
      // Lifestyle posts should be engaging
      if (post.content.length < 500) {
        throw new Error("Lifestyle posts should be detailed (min 500 characters)");
      }
      break;
  }
  
  console.log(`✅ Category-specific validation passed for ${post.metadata.category} post`);
  return post;
});

// Safe validation with detailed error handling
const safeValidateAndEnrich = transform("safe-validate-enrich", async (post: z.infer<typeof PostSchema>) => {
  // Add enrichment data
  const enrichedPost = {
    ...post,
    metadata: {
      ...post.metadata,
      slug: post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      excerpt: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
      searchKeywords: [...post.tags, ...post.title.split(' ')].filter(Boolean)
    }
  };

  // Define enriched schema
  const EnrichedPostSchema = PostSchema.extend({
    metadata: PostSchema.shape.metadata.extend({
      slug: z.string(),
      excerpt: z.string(),
      searchKeywords: z.array(z.string())
    })
  });

  // Safe validation
  const result = EnrichedPostSchema.safeParse(enrichedPost);
  
  if (!result.success) {
    console.error("❌ Enrichment validation failed:", result.error.errors);
    // Return original post if enrichment fails
    return post;
  }
  
  console.log("✅ Post enrichment successful");
  return result.data;
});

// Save the validated and enriched post
const savePost = egress("save-post", async (post: any) => {
  console.log("💾 Saving post to database:");
  console.log(JSON.stringify(post, null, 2));
  
  // Simulate database save
  return {
    success: true,
    postId: post.id,
    message: "Post created successfully"
  };
});

// Create and run the pipeline
const zodValidationPipeline = pipeline("zod-semantic-validation")
  .start(httpRequest)
  .then(validateRequest)
  .then(createPost)
  .then(validateCategoryRules)
  .then(safeValidateAndEnrich)
  .end(savePost);

// Example with error handling
export async function runZodValidationExample() {
  try {
    console.log("🚀 Starting Zod validation pipeline...\n");
    const result = await run(zodValidationPipeline);
    console.log("\n✅ Pipeline completed successfully!");
    console.log("Result:", result);
  } catch (error) {
    console.error("\n❌ Pipeline failed:", error);
    
    // Handle different types of validation errors
    if (error instanceof z.ZodError) {
      console.error("Validation errors:");
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
  }
}

// Export for use in other examples
export { zodValidationPipeline };

// Auto-run if this file is executed directly
if (import.meta.main) {
  runZodValidationExample();
}