import { LinearClient } from "@linear/sdk";
import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import { prisma } from "../../../services/prisma";

const handler = nc<NextApiRequest, NextApiResponse>({
  onError: (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).end("Something broke!");
  },
  onNoMatch: (req, res) => {
    res.status(404).end("Page is not found");
  },
}).post(async (req, res) => {
  const payload = req.body;
  const { action, data, type, updatedFrom, organizationId } = payload;

  if (type === "Issue") {
    if (action === "update") {
      if (updatedFrom?.stateId) {
        if (data.assignee?.id) {
          const reward = await prisma.reward.findUnique({
            where: { issueId: payload.data.id },
          });

          if (!reward) {
            return res.status(200);
          }

          let organization = await prisma.organization.findFirst({
            where: {
              linearId: organizationId,
            },
          });

          if (!organization) {
            organization = await prisma.organization.create({
              data: {
                linearId: organizationId,
              },
            });
          }

          let account = await prisma.account.findFirst({
            where: {
              provider: "linear",
              providerAccountId: payload.data.assignee.id,
            },
            include: {
              user: true,
            },
          });

          if (!account) {
            account = await prisma.account.create({
              data: {
                provider: "linear",
                providerAccountId: payload.data.assignee.id,
                type: "oauth",
                user: {
                  create: {
                    organization: {
                      connect: {
                        linearId: organizationId,
                      },
                    },
                  },
                },
              },
              include: {
                user: true,
              },
            });
          }

          const { user } = account;

          if (organization.apiKey) {
            if (!reward.claimed) {
              if (data.stateId === reward.targetStateId) {
                const newPoints = user.points + reward.value;

                await prisma.$transaction([
                  prisma.reward.update({
                    where: { id: reward.id },
                    data: { claimed: true, claimedAt: new Date() },
                  }),
                  prisma.user.update({
                    where: {
                      id: user.id,
                    },
                    data: {
                      points: newPoints,
                    },
                  }),
                  prisma.transaction.create({
                    data: {
                      newPoints,
                      previousPoints: user.points,
                      organization: {
                        connect: {
                          linearId: organizationId,
                        },
                      },
                      beneficiary: {
                        connect: {
                          id: user.id,
                        },
                      },
                      reward: {
                        connect: {
                          id: reward.id,
                        },
                      },
                    },
                  }),
                ]);

                const linear = new LinearClient({
                  apiKey: organization.apiKey,
                });

                await linear.attachmentUpdate(reward.attachmentId, {
                  title: "Acknowledge",
                  subtitle: `${reward.value} points`,
                  metadata: {
                    rewardId: reward.id,
                    points: reward.value,
                    targetStateId: reward.targetStateId,
                    claimed: true,
                  },
                });
              }
            }
          }
        }
      }
    }
  }

  res.status(200);
});

export default handler;
