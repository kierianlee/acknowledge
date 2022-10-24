import { router } from "../trpc";
import { issuesRouter } from "./issues";
import { organizationRouter } from "./organization";
import { usersRouter } from "./users";

export const appRouter = router({
  issues: issuesRouter,
  users: usersRouter,
  organization: organizationRouter,
});

export type AppRouter = typeof appRouter;
