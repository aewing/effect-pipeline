import { describe, it, expect } from "bun:test";
import { 
  service, 
  createServiceRegistry, 
  validateServices, 
  extractServicesForNode 
} from "./services";
import type { SemanticService } from "./types";

describe("Semantic Services", () => {
  describe("service()", () => {
    it("should create a service with name and implementation", () => {
      const testService = service("TestService", {
        getData: async () => ({ data: "test" }),
        saveData: (data: any) => ({ id: "123", saved: data })
      });

      expect(testService.name).toBe("TestService");
      expect(testService.implementation).toHaveProperty("getData");
      expect(testService.implementation).toHaveProperty("saveData");
      expect(testService.implementation.getData).toBeFunction();
      expect(testService.implementation.saveData).toBeFunction();
    });

    it("should support sync and async methods", async () => {
      const mixedService = service("MixedService", {
        syncMethod: (x: number) => x * 2,
        asyncMethod: async (x: number) => Promise.resolve(x * 3)
      });

      expect(mixedService.implementation.syncMethod(5)).toBe(10);
      expect(await mixedService.implementation.asyncMethod(5)).toBe(15);
    });

    it("should handle methods with no parameters", () => {
      const noParamService = service("NoParamService", {
        getConstant: () => 42,
        getPromise: async () => "async result"
      });

      expect(noParamService.implementation.getConstant()).toBe(42);
      expect(noParamService.implementation.getPromise()).toBeInstanceOf(Promise);
    });

    it("should handle methods with multiple parameters", () => {
      const multiParamService = service("MultiParamService", {
        add: (a: number, b: number) => a + b,
        format: (template: string, ...args: any[]) => template.replace(/%s/g, () => args.shift())
      });

      expect(multiParamService.implementation.add(2, 3)).toBe(5);
      expect(multiParamService.implementation.format("Hello %s, age %s", "John", 25))
        .toBe("Hello John, age 25");
    });
  });

  describe("createServiceRegistry()", () => {
    it("should create registry from empty services array", () => {
      const registry = createServiceRegistry([]);
      expect(registry).toEqual({});
    });

    it("should create registry from single service", () => {
      const testService = service("TestService", {
        test: () => "result"
      });

      const registry = createServiceRegistry([testService]);
      
      expect(registry).toHaveProperty("TestService");
      expect(registry.TestService).toBe(testService.implementation);
      expect(registry.TestService.test()).toBe("result");
    });

    it("should create registry from multiple services", () => {
      const service1 = service("Service1", { method1: () => 1 });
      const service2 = service("Service2", { method2: () => 2 });
      const service3 = service("Service3", { method3: () => 3 });

      const registry = createServiceRegistry([service1, service2, service3]);

      expect(registry).toHaveProperty("Service1");
      expect(registry).toHaveProperty("Service2");
      expect(registry).toHaveProperty("Service3");
      expect(registry.Service1.method1()).toBe(1);
      expect(registry.Service2.method2()).toBe(2);
      expect(registry.Service3.method3()).toBe(3);
    });

    it("should handle services with same methods", () => {
      const service1 = service("Database", { query: () => "db1 result" });
      const service2 = service("Cache", { query: () => "cache result" });

      const registry = createServiceRegistry([service1, service2]);

      expect(registry.Database.query()).toBe("db1 result");
      expect(registry.Cache.query()).toBe("cache result");
    });
  });

  describe("validateServices()", () => {
    const mockServices: SemanticService[] = [
      service("Database", { query: () => "result" }),
      service("Logger", { log: () => undefined }),
      service("Cache", { get: () => null })
    ];

    it("should pass validation when all required services are available", () => {
      expect(() => {
        validateServices(["Database", "Logger"], mockServices);
      }).not.toThrow();
    });

    it("should pass validation with empty required services", () => {
      expect(() => {
        validateServices([], mockServices);
      }).not.toThrow();
    });

    it("should pass validation with empty available services and no requirements", () => {
      expect(() => {
        validateServices([], []);
      }).not.toThrow();
    });

    it("should throw error when required service is missing", () => {
      expect(() => {
        validateServices(["MissingService"], mockServices);
      }).toThrow("Missing required services: MissingService");
    });

    it("should throw error when multiple required services are missing", () => {
      expect(() => {
        validateServices(["MissingService1", "MissingService2"], mockServices);
      }).toThrow("Missing required services: MissingService1, MissingService2");
    });

    it("should throw error with available services listed", () => {
      expect(() => {
        validateServices(["MissingService"], mockServices);
      }).toThrow("Available services: Database, Logger, Cache");
    });

    it("should handle partial matches correctly", () => {
      expect(() => {
        validateServices(["Database", "MissingService", "Logger"], mockServices);
      }).toThrow("Missing required services: MissingService");
    });
  });

  describe("extractServicesForNode()", () => {
    const mockRegistry = {
      Database: { query: () => "db result" },
      Logger: { log: () => "logged" },
      Cache: { get: () => "cached" },
      Auth: { verify: () => true }
    };

    it("should extract no services for empty requirements", () => {
      const extracted = extractServicesForNode([], mockRegistry);
      expect(extracted).toEqual({});
    });

    it("should extract single required service", () => {
      const extracted = extractServicesForNode(["Database"], mockRegistry);
      
      expect(extracted).toHaveProperty("Database");
      expect(extracted.Database).toBe(mockRegistry.Database);
      expect(Object.keys(extracted)).toHaveLength(1);
    });

    it("should extract multiple required services", () => {
      const extracted = extractServicesForNode(["Database", "Logger", "Cache"], mockRegistry);
      
      expect(extracted).toHaveProperty("Database");
      expect(extracted).toHaveProperty("Logger");
      expect(extracted).toHaveProperty("Cache");
      expect(extracted).not.toHaveProperty("Auth");
      expect(Object.keys(extracted)).toHaveLength(3);
    });

    it("should extract services in the same order as required", () => {
      const extracted = extractServicesForNode(["Cache", "Database", "Logger"], mockRegistry);
      const keys = Object.keys(extracted);
      
      expect(keys).toEqual(["Cache", "Database", "Logger"]);
    });

    it("should handle duplicate service requirements", () => {
      const extracted = extractServicesForNode(["Database", "Database", "Logger"], mockRegistry);
      
      expect(extracted).toHaveProperty("Database");
      expect(extracted).toHaveProperty("Logger");
      expect(Object.keys(extracted).filter(k => k === "Database")).toHaveLength(1);
    });

    it("should maintain service functionality", () => {
      const extracted = extractServicesForNode(["Database", "Logger"], mockRegistry);
      
      expect(extracted.Database.query()).toBe("db result");
      expect(extracted.Logger.log()).toBe("logged");
    });
  });
}); 