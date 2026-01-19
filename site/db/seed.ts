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
    { game: "pong", playerIds: [userIds[0], userIds[1]], scores: [3, 1], completedAt: new Date() },
    { game: "pong", playerIds: [userIds[0], userIds[2]], scores: [2, 3], completedAt: new Date() },
    { game: "pong", playerIds: [userIds[1], userIds[3]], scores: [1, 3], completedAt: new Date() },
    { game: "pong", playerIds: [userIds[2], userIds[4]], scores: [0, 3], completedAt: new Date() },
    { game: "pong", playerIds: [userIds[0], userIds[4]], scores: [3, 2], completedAt: new Date() },
    { game: "pong", playerIds: [userIds[1], userIds[2]], scores: [3, 0], completedAt: new Date() },
    { game: "pong", playerIds: [userIds[3], userIds[0]], scores: [4, 2], completedAt: new Date() },
    { game: "pong", playerIds: [userIds[4], userIds[1]], scores: [3, 1], completedAt: new Date() },
    { game: "pong", playerIds: [userIds[5], userIds[6]], scores: [2, 1], completedAt: new Date() },
    { game: "pong", playerIds: [userIds[6], userIds[7]], scores: [1, 3], completedAt: new Date() },
    { game: "web3d", playerIds: [userIds[0], userIds[1], userIds[2], userIds[3]], scores: [15, 12, 8, 5], completedAt: new Date() },
    { game: "web3d", playerIds: [userIds[4], userIds[5], userIds[6]], scores: [20, 14, 10], completedAt: new Date() },
    { game: "web3d", playerIds: [userIds[0], userIds[4], userIds[5], userIds[6], userIds[7]], scores: [12, 18, 9, 7, 11], completedAt: new Date() },
    { game: "web3d", playerIds: [userIds[1], userIds[2]], scores: [8, 13], completedAt: new Date() },
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
