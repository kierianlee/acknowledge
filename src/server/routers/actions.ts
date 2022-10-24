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
              id: ctx.session.organizationId,
            },
          },
          include: {
            actor: true,
            reward: {
              include: {
                claimedBy: true,
              },
            },
            transaction: {
              include: {
                benefactor: true,
                beneficiary: true,
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
