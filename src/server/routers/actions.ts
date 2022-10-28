import { z } from "zod";
import { protectedProcedure, t } from "../trpc";
import { prisma } from "../../services/prisma";

export const actionsRouter = t.router({
  organizationActions: protectedProcedure
    .input(
      z.object({
        filter: z.object({}),
        orderBy: z.object({
          field: z.enum(["createdAt"]),
          direction: z.enum(["asc", "desc"]),
        }),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const actions = await prisma.action.findMany({
          orderBy: {
            [input.orderBy.field]: input.orderBy.direction,
          },
          where: {
            organization: {
              id: ctx.session.account.organizationId,
            },
          },
          include: {
            actor: {
              include: {
                user: true,
              },
            },
            reward: {
              include: {
                claimedBy: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            transaction: {
              include: {
                benefactor: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                        name: true,
                      },
                    },
                  },
                },
                beneficiary: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        return actions;
      } catch (err) {
        throw err;
      }
    }),
});
