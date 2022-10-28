import { z } from "zod";
import { protectedProcedure, t } from "../trpc";
import { prisma } from "../../services/prisma";

export const organizationRouter = t.router({
  apiKeySet: protectedProcedure.query(async ({ ctx }) => {
    try {
      const organization = await prisma.organization.findUniqueOrThrow({
        where: {
          id: ctx.session.account.organizationId,
        },
      });

      return !!organization.apiKey;
    } catch (err) {
      throw err;
    }
  }),
  setApiKey: protectedProcedure
    .input(
      z.object({
        apiKey: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const organization = await prisma.organization.update({
          where: {
            id: ctx.session.account.organizationId,
          },
          data: {
            apiKey: input.apiKey,
          },
        });

        return organization;
      } catch (err) {
        throw err;
      }
    }),
  accounts: protectedProcedure
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
        const accounts = await prisma.account.findMany({
          orderBy: {
            [input.orderBy.field]: input.orderBy.direction,
          },
          where: {
            organization: {
              id: ctx.session.account.organizationId,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return accounts;
      } catch (err) {
        throw err;
      }
    }),
});
