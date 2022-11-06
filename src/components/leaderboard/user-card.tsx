import { Box, Stack, Text, Group, Avatar, Badge } from "@mantine/core";
import { IconMedal } from "@tabler/icons";
import { inferProcedureOutput } from "@trpc/server";
import { forwardRef } from "react";
import { AppRouter } from "../../server/routers/_app";
import { getInitials } from "../../utils/string";

interface UserCardProps {
  account: inferProcedureOutput<
    AppRouter["pointLogs"]["leaderboard"]
  >["items"][0];
}

const UserCard = forwardRef<HTMLDivElement, UserCardProps>(function UserCard(
  { account: { name, points, rank, totalPoints } },
  ref
) {
  return (
    <Box
      sx={(theme) => ({
        borderRadius: theme.radius.md,
        marginBottom: "1rem",
        position: "relative",
        background: "#fff",
        shadow: theme.shadows.xl,
      })}
    >
      <Box
        sx={(theme) => ({
          display: "flex",
          gap: "16px",
          alignItems: "center",
          flexWrap: "nowrap",
          minWidth: 0,
        })}
        p="md"
      >
        <Avatar color="indigo" radius="xl">
          {getInitials(name || "Organization User")}
        </Avatar>
        <Box
          sx={{
            flexGrow: 1,
            overflow: "hidden",
          }}
        >
          <Box sx={{ flex: "1" }}>
            <Text
              weight={500}
              sx={() => ({
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              })}
              lineClamp={1}
            >
              {name}
            </Text>
          </Box>
          <Group spacing={4}>
            <IconMedal size="16px" />
            <Text color="dimmed" size="xs">
              {points} points ({totalPoints} all time)
            </Text>
          </Group>
        </Box>
        <Badge
          radius="md"
          py="xl"
          px="xl"
          color={
            rank === 1
              ? "orange"
              : rank === 2
              ? "gray"
              : rank === 3
              ? "indigo"
              : "gray"
          }
          variant={rank === 1 || rank === 2 || rank === 3 ? "light" : "outline"}
        >
          <Text size="sm">#{rank}</Text>
        </Badge>
      </Box>
    </Box>
  );
});

export default UserCard;
