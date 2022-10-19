import { router } from "../trpc";
import { issuesRouter } from "./issues";

export const appRouter = router({
  issues: issuesRouter,
});

export type AppRouter = typeof appRouter;
