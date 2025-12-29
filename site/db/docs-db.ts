import { initializeDatabase } from "./index";
import { users, matches } from "./schema";

const testDatabase = async () => {
  // init db
  const db = await initializeDatabase();

  // create user
  const testUser = await db
    .insert(users)
    .values({
      username: "testuser",
      password: "hashedpassword123",
      email: "test@example.com",
    })
    .returning();

  // create match
  const testMatch = await db
    .insert(matches)
    .values({
      game: "pong",
      player1Id: testUser[0].id,
      player2Id: testUser[0].id,
      winnerId: testUser[0].id,
      score: "5-3",
      startedAt: new Date(),
      completedAt: new Date(),
    })
    .returning();
  const allUsers = await db.select().from(users);
  const allMatches = await db.select().from(matches);
};

testDatabase();
