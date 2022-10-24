import { LinearClient } from "@linear/sdk";
import { ActionType, ActorType } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import { gqlClient } from "../../../services/graphql";
import { prisma } from "../../../services/prisma";
import { getSdk } from "../../../__generated__/graphql-operations";

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
            if (!organization.apiKey) {
              return res.status(400);
            }

            const gql = getSdk(gqlClient);

            const linearUser = await gql.User(
              {
                id: payload.data.assignee.id,
              },
              { Authorization: organization.apiKey }
            );

            if (!linearUser.user) {
              return res.status(400);
            }

            account = await prisma.account.create({
              data: {
                provider: "linear",
                providerAccountId: payload.data.assignee.id,
                type: "oauth",
                user: {
                  create: {
                    name: linearUser.user.name,
                    email: linearUser.user.email,
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
                  prisma.pointLog.create({
                    data: {
                      newPoints,
                      previousPoints: user.points,
                      organization: {
                        connect: {
                          linearId: organizationId,
                        },
                      },
                      user: {
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
                  prisma.action.create({
                    data: {
                      actorType: ActorType.SYSTEM,
                      organization: {
                        connect: {
                          linearId: organizationId,
                        },
                      },
                      reward: {
                        connect: {
                          id: reward.id,
                        },
                      },
                      type: ActionType.REWARD_CLAIM,
                      metadata: {},
                    },
                  }),
                ]);

                const linear = new LinearClient({
                  apiKey: organization.apiKey,
                });

                await linear.attachmentUpdate(reward.attachmentId, {
                  title: "Acknowledge",
                  subtitle: `${reward.value} points (claimed)`,
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
