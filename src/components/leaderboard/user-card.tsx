import { Box, Stack, Text, Group, Avatar, Badge } from "@mantine/core";
import { IconMedal } from "@tabler/icons";
import { inferProcedureOutput } from "@trpc/server";
import { AppRouter } from "../../server/routers/_app";
import { getInitials } from "../../utils/string";

interface UserCardProps {
  account: inferProcedureOutput<AppRouter["pointLogs"]["leaderboard"]>[0];
  rank: number;
}

const UserCard = ({ account: { account, points }, rank }: UserCardProps) => {
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
      <Group p="md">
        <Avatar color="indigo" radius="xl">
          {getInitials(account.user.name || "Organization User")}
        </Avatar>
        <Stack sx={{ flex: "1" }} spacing={0}>
          <Box sx={{ flex: "1" }}>
            <Text weight={500}>{account.user.name}</Text>
          </Box>
          <Group spacing={4}>
            <IconMedal size="16px" />
            <Text color="dimmed" size="xs">
              {points} points
            </Text>
          </Group>
        </Stack>
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
      </Group>
    </Box>
  );
};

export default UserCard;
