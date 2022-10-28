import { protectedProcedure, t } from "../trpc";
import { prisma } from "../../services/prisma";

export const accountsRouter = t.router({
  me: protectedProcedure.query(async ({ ctx }) => {
    try {
      const account = await prisma.account.findUniqueOrThrow({
        where: {
          id: ctx.session.account.id,
        },
      });

      return account;
    } catch (err) {
      throw err;
    }
  }),
});
