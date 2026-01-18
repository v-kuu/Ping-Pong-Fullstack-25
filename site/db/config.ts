import { defineDb, defineTable, column, NOW } from 'astro:db';

const Users = defineTable({
    columns: {
        id: column.number({ primaryKey: true, autoIncrement: true }),
        username: column.text({ unique: true }),
        password: column.text(),
        email: column.text({ unique: true }),
        createdAt: column.date({ default: NOW }),
        updatedAt: column.date({ default: NOW }),
        elo: column.number({ default: 1000 }),
        lastSeen: column.date({ optional: true }),
    }
});

const Matches = defineTable({
    columns: {
        id: column.number({ primaryKey: true, autoIncrement: true }),
        game: column.text(),
        playerIds: column.json(),
        scores: column.json(),
        winnerId: column.number({ references: () => Users.columns.id, optional: true }),
        startedAt: column.date({ default: NOW }),
        completedAt: column.date({ optional: true }),
    }
});

const Sessions = defineTable({
    columns: {
        id: column.text({ primaryKey: true }),
        userId: column.number({ references: () => Users.columns.id }),
    }
});

const Friendships = defineTable({
    columns: {
        id: column.number({ primaryKey: true, autoIncrement: true }),
        userId: column.number({ references: () => Users.columns.id }),
        friendId: column.number({ references: () => Users.columns.id }),
        status: column.text(),
    }
});

export default defineDb({
    tables: { Users, Matches, Sessions, Friendships }
});
