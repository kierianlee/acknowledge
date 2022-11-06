import { protectedProcedure, t } from "../trpc";
import { prisma } from "../../services/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { offsetPaginationInput } from "../pagination";

export const pointLogsRouter = t.router({
  leaderboard: protectedProcedure
    .input(
      z.object({
        filter: z.object({
          createdAt: z.object({
            gte: z.string(),
            lt: z.string(),
          }),
        }),
        ...offsetPaginationInput,
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const results = await prisma.$queryRaw<
          {
            rank: number;
            points: number;
            totalPoints: number;
            accountId: string;
            name: string;
            email: string;
          }[]
        >(Prisma.sql`
          SELECT
            RANK() OVER (ORDER BY points DESC)::int AS rank,
            SUM(p.difference)::int AS points,
            a.points AS "totalPoints",
            p. "accountId",
            u.name,
            u.email
          FROM
            "PointLog" p
            INNER JOIN "Account" a ON p. "accountId" = a.id
            INNER JOIN "User" u ON a. "userId" = u.id
          WHERE
            p. "createdAt" >= ${input.filter.createdAt.gte}::timestamp
            AND p. "createdAt" < ${input.filter.createdAt.lt}::timestamp
            AND p. "organizationId" = ${ctx.session.account.organizationId}
          GROUP BY
            p. "accountId",
            u.id,
            a.points
          ORDER BY
            points DESC
          LIMIT ${input.limit ?? 50} OFFSET ${input.skip ?? 0}; `);

        const totalCount = await prisma.$queryRaw<
          { count: number }[]
        >(Prisma.sql`
          SELECT
            COUNT(DISTINCT p. "accountId")::int
          FROM
            "PointLog" p
          WHERE
            p. "createdAt" >= ${input.filter.createdAt.gte}::timestamp
            AND p. "createdAt" < ${input.filter.createdAt.lt}::timestamp
            AND p. "organizationId" = ${ctx.session.account.organizationId};`);

        return { items: results, totalCount: totalCount[0].count };
      } catch (err) {
        throw err;
      }
    }),
});
