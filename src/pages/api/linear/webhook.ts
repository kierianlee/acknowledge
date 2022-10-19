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
  const { action, data, type, updatedFrom } = payload;

  if (type === "Issue") {
    if (action === "update") {
      if (updatedFrom?.stateId) {
        if (data.assignee?.id) {
          const reward = await prisma.reward.findUniqueOrThrow({
            where: { issueId: payload.data.id },
          });
          let player = await prisma.player.findUnique({
            where: { linearId: payload.data.assignee.id },
          });

          if (!player) {
            player = await prisma.player.create({
              data: {
                linearId: data.assignee.id,
                points: 0,
              },
            });
          }

          if (!reward.claimed) {
            if (data.stateId === reward.targetStateId) {
              const newPoints = player.points + reward.value;

              await prisma.$transaction([
                prisma.reward.update({
                  where: { id: reward.id },
                  data: { claimed: true, claimedAt: new Date() },
                }),
                prisma.player.update({
                  where: {
                    id: player.id,
                  },
                  data: {
                    points: newPoints,
                  },
                }),
                prisma.transaction.create({
                  data: {
                    newPoints,
                    previousPoints: player.points,
                    player: {
                      connect: { id: player.id },
                    },
                    reward: {
                      connect: {
                        id: reward.id,
                      },
                    },
                  },
                }),
              ]);
            }
          }
        }
      }
    }
  }

  res.status(200);
});

export default handler;
