import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { Effect } from "effect";
import { sqliteEgress, sqliteInsert, sqliteUpdate } from "./sqlite";
import { NodeKind } from "../../core/node";

describe("SQLite Egress Nodes", () => {
  const testDbPath = "test-egress.db";
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
    db.close();
  });

  describe("sqliteEgress", () => {
    it("should create a node with correct properties", () => {
      const node = sqliteEgress("test-sqlite-egress", {
        dbPath: testDbPath,
        query: "INSERT INTO users (name, email, age) VALUES (?, ?, ?)"
      });

      expect(node.kind).toBe(NodeKind.Egress);
      expect(node.name).toBe("test-sqlite-egress");
      expect(typeof node.run).toBe("function");
    });

    it("should insert single record", async () => {
      const node = sqliteEgress("test-insert", {
        dbPath: testDbPath,
        query: "INSERT INTO users (name, email, age) VALUES (?, ?, ?)"
      });

      const input = ["Alice", "alice@example.com", 30];
      const effect = node.run(input);
      const result = await Effect.runPromise(effect);

      expect(result.success).toBe(true);
      expect(result.changes).toBe(1);
      expect(result.lastInsertRowid).toBe(1);

      // Verify the record was inserted
      const verifyDb = new Database(testDbPath);
      const rows = verifyDb.prepare("SELECT * FROM users").all();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual({
        id: 1,
        name: "Alice",
        email: "alice@example.com",
        age: 30
      });
      verifyDb.close();
    });

    it("should insert multiple records in batch", async () => {
      const node = sqliteEgress("test-batch-insert", {
        dbPath: testDbPath,
        query: "INSERT INTO users (name, email, age) VALUES (?, ?, ?)"
      });

      const input = [
        ["Alice", "alice@example.com", 30],
        ["Bob", "bob@example.com", 25],
        ["Charlie", "charlie@example.com", 35]
      ];
      const effect = node.run(input);
      const result = await Effect.runPromise(effect);

      expect(result.success).toBe(true);
      expect(result.changes).toBe(3);

      // Verify all records were inserted
      const verifyDb = new Database(testDbPath);
      const rows = verifyDb.prepare("SELECT * FROM users ORDER BY id").all();
      expect(rows).toHaveLength(3);
      expect(rows[0].name).toBe("Alice");
      expect(rows[1].name).toBe("Bob");
      expect(rows[2].name).toBe("Charlie");
      verifyDb.close();
    });

    it("should handle UPDATE queries", async () => {
      // First insert a record
      const insertDb = new Database(testDbPath);
      insertDb.prepare("INSERT INTO users (name, email, age) VALUES (?, ?, ?)").run("Alice", "alice@example.com", 30);
      insertDb.close();

      const node = sqliteEgress("test-update", {
        dbPath: testDbPath,
        query: "UPDATE users SET age = ? WHERE name = ?"
      });

      const input = [35, "Alice"];
      const effect = node.run(input);
      const result = await Effect.runPromise(effect);

      expect(result.success).toBe(true);
      expect(result.changes).toBe(1);

      // Verify the update
      const verifyDb = new Database(testDbPath);
      const row = verifyDb.prepare("SELECT age FROM users WHERE name = ?").get("Alice");
      expect(row).toEqual({ age: 35 });
      verifyDb.close();
    });

    it("should handle errors gracefully", async () => {
      const node = sqliteEgress("test-error", {
        dbPath: testDbPath,
        query: "INSERT INTO nonexistent_table (col) VALUES (?)"
      });

      const effect = node.run(["value"]);
      
      await expect(Effect.runPromise(effect)).rejects.toThrow("SQLite egress error");
    });
  });

  describe("sqliteInsert", () => {
    it("should insert record from object", async () => {
      const node = sqliteInsert("test-object-insert", {
        dbPath: testDbPath,
        table: "users"
      });

      const input = {
        name: "Alice",
        email: "alice@example.com",
        age: 30
      };
      const effect = node.run(input);
      const result = await Effect.runPromise(effect);

      expect(result.success).toBe(true);
      expect(result.changes).toBe(1);

      // Verify the record
      const verifyDb = new Database(testDbPath);
      const row = verifyDb.prepare("SELECT * FROM users").get();
      expect(row).toEqual({
        id: 1,
        name: "Alice",
        email: "alice@example.com",
        age: 30
      });
      verifyDb.close();
    });

    it("should insert multiple records from array of objects", async () => {
      const node = sqliteInsert("test-array-insert", {
        dbPath: testDbPath,
        table: "users"
      });

      const input = [
        { name: "Alice", email: "alice@example.com", age: 30 },
        { name: "Bob", email: "bob@example.com", age: 25 }
      ];
      const effect = node.run(input);
      const result = await Effect.runPromise(effect);

      expect(result.success).toBe(true);
      expect(result.changes).toBe(2);

      // Verify the records
      const verifyDb = new Database(testDbPath);
      const rows = verifyDb.prepare("SELECT * FROM users ORDER BY id").all();
      expect(rows).toHaveLength(2);
      expect(rows[0].name).toBe("Alice");
      expect(rows[1].name).toBe("Bob");
      verifyDb.close();
    });

    it("should handle specified columns", async () => {
      const node = sqliteInsert("test-columns", {
        dbPath: testDbPath,
        table: "users",
        columns: ["name", "age"]
      });

      const input = {
        name: "Alice",
        email: "alice@example.com", // This should be ignored
        age: 30,
        extra: "ignored" // This should be ignored
      };
      const effect = node.run(input);
      const result = await Effect.runPromise(effect);

      expect(result.success).toBe(true);
      expect(result.changes).toBe(1);

      // Verify only specified columns were inserted
      const verifyDb = new Database(testDbPath);
      const row = verifyDb.prepare("SELECT * FROM users").get();
      expect(row).toEqual({
        id: 1,
        name: "Alice",
        email: null, // Not inserted
        age: 30
      });
      verifyDb.close();
    });

    it("should handle conflict resolution", async () => {
      // First insert a record
      const insertDb = new Database(testDbPath);
      insertDb.prepare("INSERT INTO users (name, email, age) VALUES (?, ?, ?)").run("Alice", "alice@example.com", 30);
      insertDb.close();

      const node = sqliteInsert("test-conflict", {
        dbPath: testDbPath,
        table: "users",
        onConflict: "REPLACE"
      });

      const input = {
        name: "Alice Updated",
        email: "alice@example.com", // This will conflict
        age: 35
      };
      const effect = node.run(input);
      const result = await Effect.runPromise(effect);

      expect(result.success).toBe(true);
      expect(result.changes).toBe(1);

      // Verify the record was replaced
      const verifyDb = new Database(testDbPath);
      const row = verifyDb.prepare("SELECT * FROM users").get();
      expect(row.name).toBe("Alice Updated");
      expect(row.age).toBe(35);
      verifyDb.close();
    });
  });

  describe("sqliteUpdate", () => {
    beforeEach(() => {
      // Insert test data
      const setupDb = new Database(testDbPath);
      const stmt = setupDb.prepare("INSERT INTO users (name, email, age) VALUES (?, ?, ?)");
      stmt.run("Alice", "alice@example.com", 30);
      stmt.run("Bob", "bob@example.com", 25);
      setupDb.close();
    });

    it("should update records", async () => {
      const node = sqliteUpdate("test-update", {
        dbPath: testDbPath,
        table: "users",
        setClause: "age = ?",
        whereClause: "name = ?"
      });

      const input = [35, "Alice"];
      const effect = node.run(input);
      const result = await Effect.runPromise(effect);

      expect(result.success).toBe(true);
      expect(result.changes).toBe(1);

      // Verify the update
      const verifyDb = new Database(testDbPath);
      const alice = verifyDb.prepare("SELECT age FROM users WHERE name = ?").get("Alice");
      const bob = verifyDb.prepare("SELECT age FROM users WHERE name = ?").get("Bob");
      expect(alice).toEqual({ age: 35 });
      expect(bob).toEqual({ age: 25 }); // Unchanged
      verifyDb.close();
    });

    it("should update multiple records", async () => {
      const node = sqliteUpdate("test-bulk-update", {
        dbPath: testDbPath,
        table: "users",
        setClause: "age = age + ?",
        whereClause: "age > ?"
      });

      const input = [5, 20]; // Add 5 to age where age > 20
      const effect = node.run(input);
      const result = await Effect.runPromise(effect);

      expect(result.success).toBe(true);
      expect(result.changes).toBe(2); // Both records match

      // Verify the updates
      const verifyDb = new Database(testDbPath);
      const rows = verifyDb.prepare("SELECT name, age FROM users ORDER BY name").all();
      expect(rows).toEqual([
        { name: "Alice", age: 35 }, // 30 + 5
        { name: "Bob", age: 30 }    // 25 + 5
      ]);
      verifyDb.close();
    });
  });
});