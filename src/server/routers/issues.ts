import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, t } from "../trpc";
import cuid from "cuid";
import { prisma } from "../../services/prisma";
import { LinearClient } from "@linear/sdk";
import { ActionType, ActorType } from "@prisma/client";

export const issuesRouter = t.router({
  createReward: protectedProcedure
    .input(
      z.object({
        issueId: z.string(),
        targetStateId: z.string(),
        points: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const account = await prisma.account.findUniqueOrThrow({
          where: {
            provider_providerAccountId: {
              provider: "linear",
              providerAccountId: ctx.session.user.id,
            },
          },
          include: {
            user: true,
          },
        });
        const { user: actor } = account;

        const linear = new LinearClient({
          apiKey: ctx.session.accessToken,
        });
        const linearUser = await linear.viewer;

        if (!linearUser.admin) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User is not an admin",
          });
        }

        const rewardId = cuid();

        const { attachment } = await linear.attachmentCreate({
          issueId: input.issueId,
          title: "Acknowledge",
          subtitle: `${input.points} points`,
          url: `https://acknowledge.gg/issue/${input.issueId}`,
          metadata: {
            rewardId,
            points: input.points,
            targetStateId: input.targetStateId,
          },
        });

        if (!attachment) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Couldn't create attachment",
          });
        }

        const { id: attachmentId } = await attachment;

        const createdReward = await prisma.reward.create({
          data: {
            id: rewardId,
            issueId: input.issueId,
            targetStateId: input.targetStateId,
            value: input.points,
            attachmentId,
            organization: {
              connect: {
                id: ctx.session.organizationId,
              },
            },
            createdBy: {
              connect: {
                id: actor.id,
              },
            },
          },
        });

        await prisma.action.create({
          data: {
            actorType: ActorType.USER,
            type: ActionType.REWARD_CREATION,
            actor: {
              connect: {
                id: actor.id,
              },
            },
            organization: {
              connect: {
                id: ctx.session.organizationId,
              },
            },
            metadata: {},
            reward: {
              connect: {
                id: rewardId,
              },
            },
          },
        });

        return createdReward;
      } catch (err) {
        console.log(err);
      }
    }),
  updateReward: protectedProcedure
    .input(
      z.object({
        rewardId: z.string(),
        targetStateId: z.string(),
        points: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const reward = await prisma.reward.findUniqueOrThrow({
          where: {
            id: input.rewardId,
          },
        });

        const linear = new LinearClient({
          apiKey: ctx.session.accessToken,
        });
        const linearUser = await linear.viewer;

        if (!linearUser.admin) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User is not an admin",
          });
        }

        const { attachment } = await linear.attachmentUpdate(
          reward.attachmentId,
          {
            title: "Acknowledge",
            subtitle: `${input.points} points`,
            metadata: {
              rewardId: reward.id,
              points: input.points,
              targetStateId: input.targetStateId,
            },
          }
        );

        if (!attachment) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Couldn't update attachment",
          });
        }

        const { id: attachmentId } = await attachment;

        const updatedReward = await prisma.reward.update({
          where: {
            id: reward.id,
          },
          data: {
            targetStateId: input.targetStateId,
            value: input.points,
            attachmentId,
          },
        });

        return updatedReward;
      } catch (err) {
        console.log(err);
      }
    }),
  deleteReward: protectedProcedure
    .input(
      z.object({
        rewardId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const reward = await prisma.reward.findUniqueOrThrow({
          where: {
            id: input.rewardId,
          },
        });

        const linear = new LinearClient({
          apiKey: ctx.session.accessToken,
        });
        const linearUser = await linear.viewer;

        if (!linearUser.admin) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User is not an admin",
          });
        }

        await linear.attachmentDelete(reward.attachmentId);

        await prisma.reward.delete({
          where: {
            id: reward.id,
          },
        });

        return reward;
      } catch (err) {
        console.log(err);
      }
    }),
});
