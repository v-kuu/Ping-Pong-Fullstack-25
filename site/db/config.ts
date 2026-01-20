import { defineDb, defineTable, column, NOW } from 'astro:db';

const Users = defineTable({
    columns: {
        id: column.number({ primaryKey: true, autoIncrement: true }),
        username: column.text({ unique: true }),
        password: column.text(),
        email: column.text({ unique: true }),
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
        createdAt: column.date({ default: NOW }),
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

const Messages = defineTable({
    columns: {
        id: column.number({ primaryKey: true, autoIncrement: true }),
        fromId: column.number({ references: () => Users.columns.id }),
        toId: column.number({ references: () => Users.columns.id }),
        content: column.text(),
        createdAt: column.date({ default: NOW }),
        read: column.boolean({ default: false }),
    }
});

export default defineDb({
    tables: { Users, Matches, Sessions, Friendships, Messages }
});
