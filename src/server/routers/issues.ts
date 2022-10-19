import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { linear } from "../../services/linear";
import { protectedProcedure, t } from "../trpc";
import cuid from "cuid";
import { prisma } from "../../services/prisma";
import { LinearClient } from "@linear/sdk";

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
        const linear = new LinearClient({
          apiKey: ctx.session.token.accessToken,
        });

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
          apiKey: ctx.session.token.accessToken,
        });

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
          apiKey: ctx.session.token.accessToken,
        });

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
