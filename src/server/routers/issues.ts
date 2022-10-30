import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, t } from "../trpc";
import cuid from "cuid";
import { prisma } from "../../services/prisma";
import { LinearClient } from "@linear/sdk";
import { ActionType, ActorType } from "@prisma/client";
import { acknowledgeAttachmentTitle } from "../../utils/linear";

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
        const actor = await prisma.account.findFirstOrThrow({
          where: {
            provider: {
              equals: "linear",
            },
            user: {
              id: ctx.session.user.id,
            },
          },
          include: {
            user: true,
            organization: true,
          },
        });

        if (!actor.organization.apiKey) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Organization API key not set",
          });
        }

        const linear = new LinearClient({
          accessToken: ctx.session.account.accessToken,
        });
        const linearUser = await linear.viewer;

        if (!linearUser.admin) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User is not an admin",
          });
        }

        const rewardId = cuid();

        const issue = await linear.issue(input.issueId);

        const { attachment } = await linear.attachmentCreate({
          issueId: input.issueId,
          title: acknowledgeAttachmentTitle,
          subtitle: `${input.points} points`,
          url:
            process.env.TARGET_ENV === "production"
              ? `https://acknowledge.gg/issue/${input.issueId}`
              : process.env.TARGET_ENV === "staging"
              ? `https://staging.acknowledge.gg/issue/${input.issueId}`
              : `http://localhost:3000/issue/${input.issueId}`,
          metadata: {
            rewardId,
            points: input.points,
            targetStateId: input.targetStateId,
            claimed: false,
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
            issueIdentifier: `${issue.identifier}`,
            targetStateId: input.targetStateId,
            value: input.points,
            attachmentId,
            organization: {
              connect: {
                id: ctx.session.account.organizationId,
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
            type: ActionType.REWARD_CREATE,
            actor: {
              connect: {
                id: actor.id,
              },
            },
            organization: {
              connect: {
                id: ctx.session.account.organizationId,
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
        throw err;
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
        const actor = await prisma.account.findFirstOrThrow({
          where: {
            provider: {
              equals: "linear",
            },
            user: {
              id: ctx.session.user.id,
            },
          },
          include: {
            user: true,
            organization: true,
          },
        });

        if (!actor.organization.apiKey) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Organization API key not set",
          });
        }

        const reward = await prisma.reward.findUniqueOrThrow({
          where: {
            id: input.rewardId,
          },
        });

        const linear = new LinearClient({
          accessToken: ctx.session.account.accessToken,
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
            title: acknowledgeAttachmentTitle,
            subtitle: reward.claimed
              ? `${input.points} points (claimed)`
              : `${input.points} points`,
            metadata: {
              rewardId: reward.id,
              points: input.points,
              targetStateId: input.targetStateId,
              claimed: reward.claimed,
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

        await prisma.action.create({
          data: {
            actorType: ActorType.USER,
            type: ActionType.REWARD_UPDATE,
            actor: {
              connect: {
                id: actor.id,
              },
            },
            organization: {
              connect: {
                id: ctx.session.account.organizationId,
              },
            },
            metadata: {},
            reward: {
              connect: {
                id: reward.id,
              },
            },
          },
        });

        return updatedReward;
      } catch (err) {
        throw err;
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
        const actor = await prisma.account.findFirstOrThrow({
          where: {
            provider: {
              equals: "linear",
            },
            user: {
              id: ctx.session.user.id,
            },
          },
          include: {
            user: true,
            organization: true,
          },
        });

        if (!actor.organization.apiKey) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Organization API key not set",
          });
        }

        const reward = await prisma.reward.findUniqueOrThrow({
          where: {
            id: input.rewardId,
          },
        });

        const linear = new LinearClient({
          accessToken: ctx.session.account.accessToken,
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

        await prisma.action.create({
          data: {
            actorType: ActorType.USER,
            type: ActionType.REWARD_DELETE,
            actor: {
              connect: {
                id: actor.id,
              },
            },
            organization: {
              connect: {
                id: ctx.session.account.organizationId,
              },
            },
            metadata: {
              issueIdentifier: reward.issueIdentifier,
              value: reward.value,
            },
          },
        });

        return reward;
      } catch (err) {
        throw err;
      }
    }),
});
