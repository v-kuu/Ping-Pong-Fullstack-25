import { createAuthClient } from "better-auth/client";
import type { auth } from "./auth.ts";
import {
    inferAdditionalFields,
    usernameClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: "http://localhost:3000",
    plugins: [inferAdditionalFields<typeof auth>(), usernameClient()],
});
