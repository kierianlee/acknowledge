import { z } from "zod";
import { protectedProcedure, t } from "../trpc";
import { prisma } from "../../services/prisma";
import { TRPCError } from "@trpc/server";
import { ActionType, ActorType } from "@prisma/client";
import { getSdk } from "../../__generated__/graphql-operations";
import { gqlClient } from "../../services/graphql";

export const transactionsRouter = t.router({
  myTransactions: protectedProcedure
    .input(
      z.object({
        filter: z.object({
          createdAt: z
            .object({
              gt: z.string().optional(),
              gte: z.string().optional(),
              lt: z.string().optional(),
              lte: z.string().optional(),
              equals: z.string().optional(),
            })
            .optional(),
        }),
        orderBy: z.object({
          field: z.enum(["createdAt"]),
          direction: z.enum(["asc", "desc"]),
        }),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const transactions = await prisma.transaction.findMany({
          orderBy: {
            [input.orderBy.field]: input.orderBy.direction,
          },
          where: {
            organization: {
              id: ctx.session.account.organizationId,
            },
            OR: [
              { benefactor: { id: { equals: ctx.session.user.id } } },
              { beneficiary: { id: { equals: ctx.session.user.id } } },
            ],
            ...(input.filter.createdAt
              ? {
                  createdAt: input.filter.createdAt,
                }
              : {}),
          },
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
        });

        return transactions;
      } catch (err) {
        throw err;
      }
    }),
  createTransaction: protectedProcedure
    .input(
      z.object({
        beneficiaryId: z.string(),
        value: z.number().min(1),
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const benefactor = await prisma.account.findUniqueOrThrow({
          where: { id: ctx.session.account.id },
        });
        const beneficiary = await prisma.account.findUniqueOrThrow({
          where: { id: input.beneficiaryId },
        });

        if (benefactor.points < input.value) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient points",
          });
        }

        const [, , transaction] = await prisma.$transaction([
          prisma.account.update({
            where: { id: benefactor.id },
            data: {
              points: benefactor.points - input.value,
            },
          }),
          prisma.account.update({
            where: { id: beneficiary.id },
            data: {
              points: beneficiary.points + input.value,
            },
          }),
          prisma.transaction.create({
            data: {
              value: input.value,
              benefactor: { connect: { id: ctx.session.user.id } },
              beneficiary: { connect: { id: beneficiary.id } },
              organization: {
                connect: { id: ctx.session.account.organizationId },
              },
              message: input.message,
            },
          }),
        ]);
        await prisma.$transaction([
          prisma.pointLog.create({
            data: {
              account: { connect: { id: benefactor.id } },
              organization: {
                connect: { id: ctx.session.account.organizationId },
              },
              newPoints: benefactor.points - input.value,
              previousPoints: benefactor.points,
            },
          }),
          prisma.pointLog.create({
            data: {
              account: { connect: { id: ctx.session.user.id } },
              organization: {
                connect: { id: ctx.session.account.organizationId },
              },
              newPoints: beneficiary.points + input.value,
              previousPoints: beneficiary.points,
            },
          }),
          prisma.action.create({
            data: {
              actorType: ActorType.USER,
              organization: {
                connect: {
                  id: ctx.session.account.organizationId,
                },
              },
              transaction: {
                connect: {
                  id: transaction.id,
                },
              },
              type: ActionType.TRANSACTION,
              metadata: {},
            },
          }),
        ]);

        return transaction;
      } catch (err) {
        throw err;
      }
    }),
  createTransactionByLinearUserId: protectedProcedure
    .input(
      z.object({
        linearUserId: z.string(),
        value: z.number(),
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const benefactor = await prisma.account.findUniqueOrThrow({
          where: { id: ctx.session.user.id },
        });

        if (benefactor.points < input.value) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient points",
          });
        }

        let beneficiaryAccount = await prisma.account.findFirst({
          where: {
            provider: "linear",
            providerAccountId: input.linearUserId,
          },
          include: {
            user: true,
          },
        });

        if (!beneficiaryAccount) {
          const gql = getSdk(gqlClient);

          const linearUser = await gql.User(
            {
              id: input.linearUserId,
            },
            { Authorization: ctx.session.account.accessToken || "" }
          );

          if (!linearUser.user) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Linear user not found",
            });
          }

          beneficiaryAccount = await prisma.account.create({
            data: {
              provider: "linear",
              providerAccountId: input.linearUserId,
              type: "oauth",
              user: {
                create: {
                  name: linearUser.user.name,
                  email: linearUser.user.email,
                },
              },
              organization: {
                connect: {
                  id: ctx.session.account.organizationId,
                },
              },
            },
            include: {
              user: true,
            },
          });
        }

        const [, , transaction] = await prisma.$transaction([
          prisma.account.update({
            where: { id: benefactor.id },
            data: {
              points: benefactor.points - input.value,
            },
          }),
          prisma.account.update({
            where: { id: beneficiaryAccount.user.id },
            data: {
              points: beneficiaryAccount.points + input.value,
            },
          }),
          prisma.transaction.create({
            data: {
              value: input.value,
              benefactor: { connect: { id: ctx.session.user.id } },
              beneficiary: { connect: { id: beneficiaryAccount.user.id } },
              organization: {
                connect: { id: ctx.session.account.organizationId },
              },
              message: input.message,
            },
          }),
        ]);
        await prisma.$transaction([
          prisma.pointLog.create({
            data: {
              account: { connect: { id: benefactor.id } },
              organization: {
                connect: { id: ctx.session.account.organizationId },
              },
              newPoints: benefactor.points - input.value,
              previousPoints: benefactor.points,
            },
          }),
          prisma.pointLog.create({
            data: {
              account: { connect: { id: beneficiaryAccount.user.id } },
              organization: {
                connect: { id: ctx.session.account.organizationId },
              },
              newPoints: beneficiaryAccount.points + input.value,
              previousPoints: beneficiaryAccount.points,
            },
          }),
          prisma.action.create({
            data: {
              actorType: ActorType.USER,
              organization: {
                connect: {
                  id: ctx.session.account.organizationId,
                },
              },
              transaction: {
                connect: {
                  id: transaction.id,
                },
              },
              type: ActionType.TRANSACTION,
              metadata: {},
            },
          }),
        ]);

        return transaction;
      } catch (err) {
        throw err;
      }
    }),
});
