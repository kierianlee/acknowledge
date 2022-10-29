import { protectedProcedure, t } from "../trpc";
import { prisma } from "../../services/prisma";

export const usersRouter = t.router({
  me: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = await prisma.user.findUniqueOrThrow({
        where: {
          id: ctx.session.user.id,
        },
      });

      return user;
    } catch (err) {
      throw err;
    }
  }),
});
