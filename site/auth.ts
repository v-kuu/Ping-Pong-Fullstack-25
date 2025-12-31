import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "astro:db";
import { username } from "better-auth/plugins";
import { betterAuth } from "better-auth";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite",
    }),
    appName: "ft_transcendence",
    plugins: [username()],
});
