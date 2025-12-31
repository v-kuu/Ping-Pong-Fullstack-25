import { db, Users, Matches } from "astro:db";

const users = [
  { username: "maks", email: "maks@hive.fi", password: "maks@hive.fi", elo: 1200 },
  { username: "joonas", email: "joonas@hive.fi", password: "joonas@hive.fi", elo: 1150 },
  { username: "ville", email: "ville@hive.fi", password: "ville@hive.fi", elo: 1100 },
  { username: "vallu", email: "vallu@hive.fi", password: "vallu@hive.fi", elo: 1250 },
  { username: "axel", email: "axel@hive.fi", password: "axel@hive.fi", elo: 1300 },
];

export default async function seed() {
  for (const user of users) {
    const hashedPassword = await Bun.password.hash(user.password);
    await db.insert(Users).values({ ...user, password: hashedPassword });
  }

  const dbUsers = await db.select().from(Users);
  const userIds = dbUsers.map(u => u.id);

  const matches = [
    { game: "pong", player1Id: userIds[0], player2Id: userIds[1], winnerId: userIds[0], score: "3-1" },
    { game: "pong", player1Id: userIds[0], player2Id: userIds[2], winnerId: userIds[2], score: "2-3" },
    { game: "pong", player1Id: userIds[1], player2Id: userIds[3], winnerId: userIds[3], score: "1-3" },
    { game: "pong", player1Id: userIds[2], player2Id: userIds[4], winnerId: userIds[4], score: "0-3" },
    { game: "pong", player1Id: userIds[0], player2Id: userIds[4], winnerId: userIds[0], score: "3-2" },
    { game: "pong", player1Id: userIds[1], player2Id: userIds[2], winnerId: userIds[1], score: "3-0" },
    { game: "pong", player1Id: userIds[3], player2Id: userIds[0], winnerId: userIds[3], score: "4-2" },
    { game: "pong", player1Id: userIds[4], player2Id: userIds[1], winnerId: userIds[4], score: "3-1" },
  ];

  for (const match of matches) {
    await db.insert(Matches).values(match);
  }
}
