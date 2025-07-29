import { Effect } from "effect";
import {
  sqliteIngress,
  sqliteSelect,
  sqliteEgress,
  sqliteInsert,
  sqliteUpdate,
} from "../src/nodes/index";

// Example: Using SQLite nodes with Bun's native SQLite API

async function sqliteNodesExample() {
  console.log("🗃️  SQLite Nodes Example using Bun's native SQLite API");

  const dbPath = "example.db";

  // 1. Create a database and some test data
  console.log("\n1. Setting up database with test data...");
  const setupEgress = sqliteEgress("setup", {
    dbPath,
    query: `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        age INTEGER
      )
    `,
  });

  await Effect.runPromise(setupEgress.run([]));

  // 2. Insert some users using sqliteInsert
  console.log("\n2. Inserting users with sqliteInsert...");
  const insertUsers = sqliteInsert("insert-users", {
    dbPath,
    table: "users",
  });

  const userData = [
    { name: "Alice", email: "alice@example.com", age: 30 },
    { name: "Bob", email: "bob@example.com", age: 25 },
    { name: "Charlie", email: "charlie@example.com", age: 35 },
  ];

  const insertResult = await Effect.runPromise(insertUsers.run(userData));
  console.log(`Inserted ${insertResult.changes} users`);

  // 3. Query users using sqliteSelect
  console.log("\n3. Querying all users with sqliteSelect...");
  const selectAllUsers = sqliteSelect("select-all", {
    dbPath,
    query: "SELECT * FROM users ORDER BY name",
  });

  const allUsers = await Effect.runPromise(selectAllUsers.run(undefined));
  console.log("All users:", allUsers);

  // 4. Query with parameters using sqliteIngress
  console.log("\n4. Querying users over 30 with sqliteIngress...");
  const selectOlderUsers = sqliteIngress("select-older", {
    dbPath,
    query: "SELECT name, age FROM users WHERE age > ? ORDER BY age",
    params: [30],
  });

  const olderUsersResult = await Effect.runPromise(
    selectOlderUsers.run(undefined)
  );
  console.log("Users over 30:", olderUsersResult.rows);

  // 5. Update a user using sqliteUpdate
  console.log("\n5. Updating Alice's age with sqliteUpdate...");
  const updateUser = sqliteUpdate("update-alice", {
    dbPath,
    table: "users",
    setClause: "age = ?",
    whereClause: "name = ?",
  });

  const updateResult = await Effect.runPromise(updateUser.run([31, "Alice"]));
  console.log(`Updated ${updateResult.changes} record(s)`);

  // 6. Verify the update
  console.log("\n6. Verifying update...");
  const selectUpdatedUser = sqliteSelect("select-alice", {
    dbPath,
    query: "SELECT name, age FROM users WHERE name = 'Alice'",
  });

  const updatedUser = await Effect.runPromise(
    selectUpdatedUser.run(undefined)
  );
  console.log("Updated user:", updatedUser[0]);

  // 7. Insert with custom query using sqliteEgress
  console.log("\n7. Inserting a new user with custom query...");
  const customInsert = sqliteEgress("custom-insert", {
    dbPath,
    query: "INSERT INTO users (name, email, age) VALUES (?, ?, ?)",
  });

  const customInsertResult = await Effect.runPromise(
    customInsert.run(["David", "david@example.com", 28])
  );
  console.log(
    `Inserted user with ID: ${customInsertResult.lastInsertRowid}`
  );

  // 8. Final count
  console.log("\n8. Final user count...");
  const countUsers = sqliteSelect("count-users", {
    dbPath,
    query: "SELECT COUNT(*) as count FROM users",
  });

  const countResult = await Effect.runPromise(countUsers.run(undefined));
  console.log(`Total users: ${countResult[0].count}`);

  console.log("\n✅ SQLite nodes example completed successfully!");
}

// Run the example
sqliteNodesExample().catch(console.error);