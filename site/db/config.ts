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
    }
});

const Matches = defineTable({
    columns: {
        id: column.number({ primaryKey: true, autoIncrement: true }),
        game: column.text(),
        player1Id: column.number({ references: () => Users.columns.id }),
        player2Id: column.number({ references: () => Users.columns.id }),
        winnerId: column.number({ references: () => Users.columns.id, optional: true }),
        startedAt: column.date({ default: NOW }),
        completedAt: column.date({ optional: true }),
        score: column.text({ optional: true }),
    }
});

const Sessions = defineTable({
    columns: {
        id: column.text({ primaryKey: true }),
        userId: column.number({ references: () => Users.columns.id }),
    }
});

export default defineDb({
    tables: { Users, Matches, Sessions }
});
