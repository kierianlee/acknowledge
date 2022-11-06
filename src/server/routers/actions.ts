import { z } from "zod";
import { protectedProcedure, t } from "../trpc";
import { prisma } from "../../services/prisma";
import { paginationInput } from "../pagination";

export const actionsRouter = t.router({
  organizationActions: protectedProcedure
    .input(
      z.object({
        filter: z.object({}),
        ...paginationInput,
      })
    )
    .query(async ({ input, ctx }) => {
      console.log("triggered");
      try {
        const limit = input.limit ?? 50;
        const { cursor } = input;

        const items = await prisma.action.findMany({
          take: limit + 1,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { id: "desc" },
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

        let nextCursor: typeof cursor | undefined = undefined;
        if (items.length > limit) {
          const nextItem = items.pop();
          nextCursor = nextItem!.id;
        }
        return {
          items,
          nextCursor,
        };
      } catch (err) {
        throw err;
      }
    }),
});
