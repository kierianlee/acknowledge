import { z } from "zod";
import { protectedProcedure, t } from "../trpc";
import { prisma } from "../../services/prisma";

export const organizationRouter = t.router({
  apiKeySet: protectedProcedure.query(async ({ ctx }) => {
    try {
      const organization = await prisma.organization.findUniqueOrThrow({
        where: {
          id: ctx.session.organizationId,
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
            id: ctx.session.organizationId,
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
});
