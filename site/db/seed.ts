import { db, Users, Matches, Friendships } from "astro:db";

const users = [
  { username: "maks", email: "maks@hive.fi", password: "maks@hive.fi", elo: 1200 },
  { username: "joonas", email: "joonas@hive.fi", password: "joonas@hive.fi", elo: 1150 },
  { username: "ville", email: "ville@hive.fi", password: "ville@hive.fi", elo: 1100 },
  { username: "vallu", email: "vallu@hive.fi", password: "vallu@hive.fi", elo: 1250 },
  { username: "axel", email: "axel@hive.fi", password: "axel@hive.fi", elo: 1300 },
  { username: "teemu", email: "teemu@hive.fi", password: "teemu@hive.fi", elo: 1050 },
  { username: "juhani", email: "juhani@hive.fi", password: "juhani@hive.fi", elo: 1080 },
  { username: "aapeli", email: "aapeli@hive.fi", password: "aapeli@hive.fi", elo: 1120 },
  { username: "test", email: "test@test.com", password: "testtest", elo: 1000 },
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
    { game: "pong", player1Id: userIds[5], player2Id: userIds[6], winnerId: userIds[5], score: "2-1" },
    { game: "pong", player1Id: userIds[6], player2Id: userIds[7], winnerId: userIds[7], score: "1-3" },
  ];

  for (const match of matches) {
    await db.insert(Matches).values(match);
  }

  const friendships = [
    { userId: userIds[0], friendId: userIds[1], status: 'accepted' },
    { userId: userIds[0], friendId: userIds[4], status: 'accepted' },
    { userId: userIds[1], friendId: userIds[0], status: 'accepted' },
    { userId: userIds[1], friendId: userIds[2], status: 'accepted' },
    { userId: userIds[2], friendId: userIds[3], status: 'accepted' },
    { userId: userIds[3], friendId: userIds[4], status: 'accepted' },
    { userId: userIds[5], friendId: userIds[6], status: 'accepted' },
    { userId: userIds[6], friendId: userIds[7], status: 'accepted' },
    { userId: userIds[0], friendId: userIds[3], status: 'pending' },
    { userId: userIds[1], friendId: userIds[3], status: 'pending' },
    { userId: userIds[2], friendId: userIds[4], status: 'pending' },
    { userId: userIds[3], friendId: userIds[0], status: 'pending' },
    { userId: userIds[4], friendId: userIds[1], status: 'pending' },
    { userId: userIds[5], friendId: userIds[7], status: 'pending' },
    { userId: userIds[6], friendId: userIds[5], status: 'pending' },
    { userId: userIds[7], friendId: userIds[5], status: 'pending' },
    // test user friends with all other users
    { userId: userIds[8], friendId: userIds[0], status: 'accepted' },
    { userId: userIds[8], friendId: userIds[1], status: 'accepted' },
    { userId: userIds[8], friendId: userIds[2], status: 'accepted' },
    { userId: userIds[8], friendId: userIds[3], status: 'accepted' },
    { userId: userIds[8], friendId: userIds[4], status: 'accepted' },
    { userId: userIds[8], friendId: userIds[5], status: 'accepted' },
    { userId: userIds[8], friendId: userIds[6], status: 'accepted' },
    { userId: userIds[8], friendId: userIds[7], status: 'accepted' },
  ];

  for (const friendship of friendships) {
    await db.insert(Friendships).values(friendship);
  }

  const dbUsersAfterFriendships = await db.select().from(Users);
  const testUser = dbUsersAfterFriendships.find(u => u.username === "test");
  if (testUser) {
    const otherUserIds = dbUsersAfterFriendships
      .filter(u => u.username !== "test")
      .map(u => u.id);
    
    for (const friendId of otherUserIds) {
      await db.insert(Friendships).values({
        userId: testUser.id,
        friendId: friendId,
        status: "accepted",
      });
    }
  }
}
