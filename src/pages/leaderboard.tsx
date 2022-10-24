import { Box, Stack, Title, Text, Group, Avatar, Badge } from "@mantine/core";
import { IconMedal } from "@tabler/icons";
import { inferProcedureOutput } from "@trpc/server";
import { ReactElement } from "react";
import DefaultLayout from "../components/layouts/default/default-layout";
import { AppRouter } from "../server/routers/_app";
import { showErrorNotification } from "../utils/errors";
import { getInitials } from "../utils/string";
import { trpc } from "../utils/trpc";

const Leaderboard = () => {
  const { data: organizationUsersData, isLoading: organizationUsersLoading } =
    trpc.users.organizationUsers.useQuery(
      {
        filter: {},
        orderBy: {
          direction: "desc",
          field: "points",
        },
      },
      {
        onError: showErrorNotification,
      }
    );

  return (
    <Box p="lg">
      <Title order={2} weight={500} mb="xl">
        Leaderboard
      </Title>
      {organizationUsersData?.map((item, index) => (
        <UserCard key={index} rank={index + 1} user={item} />
      ))}
    </Box>
  );
};

interface UserCardProps {
  user: inferProcedureOutput<AppRouter["users"]["organizationUsers"]>[0];
  rank: number;
}

const UserCard = ({ user, rank }: UserCardProps) => {
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
          {getInitials(user.name || "Organization User")}
        </Avatar>
        <Stack sx={{ flex: "1" }} spacing={0}>
          <Box sx={{ flex: "1" }}>
            <Text weight={500}>{user.name}</Text>
          </Box>
          <Group spacing={4}>
            <IconMedal size="16px" />
            <Text color="dimmed" size="xs">
              {user.points} points
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

export default Leaderboard;

Leaderboard.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
