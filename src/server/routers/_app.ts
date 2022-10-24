import { router } from "../trpc";
import { issuesRouter } from "./issues";
import { organizationRouter } from "./organization";
import { transactionsRouter } from "./transactions";
import { usersRouter } from "./users";

export const appRouter = router({
  issues: issuesRouter,
  users: usersRouter,
  organization: organizationRouter,
  transactions: transactionsRouter,
});

export type AppRouter = typeof appRouter;
