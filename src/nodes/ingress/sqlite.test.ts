import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { Effect } from "effect";
import { sqliteIngress, sqliteSelect } from "./sqlite";
import { NodeKind } from "../../core/node";

describe("SQLite Ingress Nodes", () => {
  const testDbPath = "test.db";
  let db: Database;

  beforeEach(() => {
    db = new Database(testDbPath);
    // Drop and recreate table to ensure clean state
    db.exec("DROP TABLE IF EXISTS users");
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        age INTEGER
      )
    `);
    
    const insertStmt = db.prepare("INSERT INTO users (name, email, age) VALUES (?, ?, ?)");
    insertStmt.run("Alice", "alice@example.com", 30);
    insertStmt.run("Bob", "bob@example.com", 25);
    insertStmt.run("Charlie", "charlie@example.com", 35);
    db.close();
  });

  describe("sqliteIngress", () => {
    it("should create a node with correct properties", () => {
      const node = sqliteIngress("test-sqlite", {
        dbPath: testDbPath,
        query: "SELECT * FROM users"
      });

      expect(node.kind).toBe(NodeKind.Ingress);
      expect(node.name).toBe("test-sqlite");
      expect(typeof node.run).toBe("function");
    });

    it("should execute SELECT query and return results", async () => {
      const node = sqliteIngress("test-select", {
        dbPath: testDbPath,
        query: "SELECT * FROM users ORDER BY id"
      });

      const effect = node.run(undefined);
      const result = await Effect.runPromise(effect);

      expect(result.rows).toHaveLength(3);
      expect(result.rows[0]).toEqual({
        id: 1,
        name: "Alice",
        email: "alice@example.com",
        age: 30
      });
    });

    it("should execute parameterized query", async () => {
      const node = sqliteIngress("test-params", {
        dbPath: testDbPath,
        query: "SELECT * FROM users WHERE age > ?",
        params: [30]
      });

      const effect = node.run(undefined);
      const result = await Effect.runPromise(effect);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe("Charlie");
    });

    it("should handle named parameters", async () => {
      const node = sqliteIngress("test-named-params", {
        dbPath: testDbPath,
        query: "SELECT * FROM users WHERE name = $name",
        params: { $name: "Bob" }
      });

      const effect = node.run(undefined);
      const result = await Effect.runPromise(effect);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe("Bob");
    });

    it("should handle errors gracefully", async () => {
      const node = sqliteIngress("test-error", {
        dbPath: testDbPath,
        query: "SELECT * FROM nonexistent_table"
      });

      const effect = node.run(undefined);
      
      await expect(Effect.runPromise(effect)).rejects.toThrow("SQLite ingress error");
    });
  });

  describe("sqliteSelect", () => {
    it("should return just the rows array", async () => {
      const node = sqliteSelect("test-select-simple", {
        dbPath: testDbPath,
        query: "SELECT name, age FROM users ORDER BY age"
      });

      const effect = node.run(undefined);
      const result = await Effect.runPromise(effect);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ name: "Bob", age: 25 });
      expect(result[1]).toEqual({ name: "Alice", age: 30 });
      expect(result[2]).toEqual({ name: "Charlie", age: 35 });
    });

    it("should work with parameters", async () => {
      const node = sqliteSelect("test-select-params", {
        dbPath: testDbPath,
        query: "SELECT name FROM users WHERE age BETWEEN ? AND ?",
        params: [25, 30]
      });

      const effect = node.run(undefined);
      const result = await Effect.runPromise(effect);

      expect(result).toHaveLength(2);
      expect(result.map(r => r.name)).toEqual(["Alice", "Bob"]);
    });

    it("should return empty array for no results", async () => {
      const node = sqliteSelect("test-empty", {
        dbPath: testDbPath,
        query: "SELECT * FROM users WHERE age > 100"
      });

      const effect = node.run(undefined);
      const result = await Effect.runPromise(effect);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });
});