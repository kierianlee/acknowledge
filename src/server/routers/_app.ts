import { router } from "../trpc";
import { actionsRouter } from "./actions";
import { issuesRouter } from "./issues";
import { organizationRouter } from "./organization";
import { transactionsRouter } from "./transactions";
import { usersRouter } from "./users";

export const appRouter = router({
  issues: issuesRouter,
  users: usersRouter,
  organization: organizationRouter,
  transactions: transactionsRouter,
  actions: actionsRouter,
});

export type AppRouter = typeof appRouter;
