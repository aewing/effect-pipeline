import { describe, it, expect } from "bun:test";
import { 
  ingress, 
  transform, 
  egress, 
  service, 
  pipeline, 
  run, 
  concurrent 
} from "./index";

describe("Semantic API Integration", () => {
  describe("Basic Pipeline", () => {
    it("should create and run a simple pipeline", async () => {
      let captured: any = null;

      const start = ingress("start", () => ({ data: "hello" }));
      const process = transform("process", (input: any) => ({ 
        result: input.data.toUpperCase() 
      }));
      const finish = egress("finish", (input: any) => {
        captured = input;
      });

      const myPipeline = pipeline("test-pipeline")
        .start(start)
        .then(process)
        .end(finish);

      await run(myPipeline);

      expect(captured).toEqual({ result: "HELLO" });
    });

    it("should handle async nodes", async () => {
      let captured: any = null;

      const asyncStart = ingress("async-start", async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { value: 42 };
      });

      const asyncProcess = transform("async-process", async (input: any) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { doubled: input.value * 2 };
      });

      const asyncFinish = egress("async-finish", async (input: any) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        captured = input;
      });

      const asyncPipeline = pipeline("async-pipeline")
        .start(asyncStart)
        .then(asyncProcess)
        .end(asyncFinish);

      await run(asyncPipeline);

      expect(captured).toEqual({ doubled: 84 });
    });
  });

  describe("Services", () => {
    it("should create and use services", async () => {
      let logMessages: string[] = [];
      let dbQueries: string[] = [];

      const logger = service("Logger", {
        info: (message: string) => {
          logMessages.push(message);
        }
      });

      const database = service("Database", {
        getUser: async (id: string) => {
          dbQueries.push(`getUser:${id}`);
          return { id, name: `User ${id}` };
        }
      });

      const fetchUser = transform("fetch-user", async (input: any, services: any) => {
        const { Logger, Database } = services;
        Logger.info(`Fetching user ${input.userId}`);
        const user = await Database.getUser(input.userId);
        return { user };
      });

      const startNode = ingress("start", () => ({ userId: "123" }));
      const endNode = egress("end", () => {});

      const servicesPipeline = pipeline("services-pipeline")
        .with(logger, database)
        .start(startNode)
        .then(fetchUser)
        .end(endNode);

      await run(servicesPipeline);

      expect(logMessages).toEqual(["Fetching user 123"]);
      expect(dbQueries).toEqual(["getUser:123"]);
    });
  });

  describe("Concurrency", () => {
    it("should execute operations concurrently", async () => {
      const startTime = Date.now();

      const results = await concurrent({
        task1: new Promise(resolve => setTimeout(() => resolve("result1"), 50)),
        task2: new Promise(resolve => setTimeout(() => resolve("result2"), 50)),
        task3: new Promise(resolve => setTimeout(() => resolve("result3"), 50))
      });

      const duration = Date.now() - startTime;

      expect(results.task1).toBe("result1");
      expect(results.task2).toBe("result2");
      expect(results.task3).toBe("result3");
      
      // Should complete in ~50ms, not ~150ms (sequential)
      expect(duration).toBeLessThan(100);
    });
  });

  describe("Error Handling", () => {
    it("should propagate errors correctly", async () => {
      const errorNode = transform("error-node", () => {
        throw new Error("Test error");
      });

      const errorPipeline = pipeline("error-pipeline")
        .start(ingress("start", () => ({ data: "test" })))
        .then(errorNode)
        .end(egress("end", () => {}));

      await expect(run(errorPipeline)).rejects.toThrow("Test error");
    });
  });

  describe("Type Safety", () => {
    it("should maintain type safety through pipeline", async () => {
      // This test ensures types work correctly at compile time
      const typedPipeline = pipeline("typed-pipeline")
        .start(ingress("start", (): { count: number } => ({ count: 5 })))
        .then(transform("double", (input: { count: number }): { doubled: number } => ({ 
          doubled: input.count * 2 
        })))
        .end(egress("end", (input: { doubled: number }) => {
          expect(input.doubled).toBe(10);
        }));

      await run(typedPipeline);
    });
  });
}); 