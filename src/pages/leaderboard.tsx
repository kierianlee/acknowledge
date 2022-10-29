import { Box, Stack, Title, Text, Group, Avatar, Badge } from "@mantine/core";
import { DateRangePicker, DateRangePickerValue } from "@mantine/dates";
import { IconCalendar, IconMedal } from "@tabler/icons";
import { inferProcedureOutput } from "@trpc/server";
import dayjs from "dayjs";
import { ReactElement } from "react";
import { Controller, useForm } from "react-hook-form";
import DefaultLayout from "../components/layouts/default/default-layout";
import { AppRouter } from "../server/routers/_app";
import { showErrorNotification } from "../utils/errors";
import { getInitials } from "../utils/string";
import { trpc } from "../utils/trpc";

interface FilterFormValues {
  range: DateRangePickerValue;
}

const Leaderboard = () => {
  const filterForm = useForm<FilterFormValues>({
    defaultValues: {
      range: [dayjs().startOf("month").toDate(), dayjs().endOf("day").toDate()],
    },
  });

  const filterDateRange = filterForm.watch("range");

  const { data: leaderboardData } = trpc.pointLogs.leaderboard.useQuery(
    {
      filter: {
        createdAt: {
          gte: filterDateRange[0]?.toISOString(),
          lte: filterDateRange[1]?.toISOString(),
        },
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
      <Group>
        <Controller
          control={filterForm.control}
          name="range"
          render={({ field: { onChange, value } }) => (
            <DateRangePicker
              size="xs"
              onChange={onChange}
              value={value}
              maxDate={dayjs().add(1, "day").endOf("day").toDate()}
              icon={<IconCalendar size={16} />}
            />
          )}
        />
      </Group>
      <Box mt="xl">
        {leaderboardData?.map((item, index) => (
          <UserCard key={index} rank={index + 1} account={item} />
        ))}
      </Box>
    </Box>
  );
};

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

export default Leaderboard;

Leaderboard.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
