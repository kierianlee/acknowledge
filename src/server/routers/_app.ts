import { router } from "../trpc";
import { issuesRouter } from "./issues";
import { usersRouter } from "./users";

export const appRouter = router({
  issues: issuesRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
