import { protectedProcedure, t } from "../trpc";
import { prisma } from "../../services/prisma";
import { z } from "zod";
import { Account, User } from "@prisma/client";

export const pointLogsRouter = t.router({
  leaderboard: protectedProcedure
    .input(
      z.object({
        filter: z.object({
          createdAt: z
            .object({
              gt: z.string().optional(),
              gte: z.string().optional(),
              lt: z.string().optional(),
              lte: z.string().optional(),
            })
            .optional(),
        }),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const pointLogs = await prisma.pointLog.findMany({
          where: {
            ...(input.filter?.createdAt
              ? {
                  createdAt: input.filter.createdAt,
                }
              : {}),
            organization: {
              id: {
                equals: ctx.session.account.organizationId,
              },
            },
          },
          include: {
            account: {
              include: {
                user: true,
              },
            },
          },
        });

        let accounts: {
          account: Account & {
            user: User;
          };
          points: number;
        }[] = [];

        for (const log of pointLogs) {
          const accountIndex = accounts.findIndex(
            (item) => item.account.id === log.accountId
          );

          if (accountIndex !== -1) {
            accounts[accountIndex].points =
              accounts[accountIndex].points + log.difference;
          } else {
            accounts.push({ account: log.account, points: log.difference });
          }
        }

        accounts = accounts.sort((a, b) => b.points - a.points);

        return accounts;
      } catch (err) {
        throw err;
      }
    }),
});
