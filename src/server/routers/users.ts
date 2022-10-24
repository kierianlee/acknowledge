import { z } from "zod";
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
  organizationUsers: protectedProcedure
    .input(
      z.object({
        filter: z.object({}),
        orderBy: z.object({
          field: z.enum(["points"]),
          direction: z.enum(["asc", "desc"]),
        }),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const users = await prisma.user.findMany({
          orderBy: {
            [input.orderBy.field]: input.orderBy.direction,
          },
          where: {
            organization: {
              id: ctx.session.organizationId,
            },
          },
        });

        return users;
      } catch (err) {
        throw err;
      }
    }),
});
