import { Box, Title, Group } from "@mantine/core";
import { DateRangePicker, DateRangePickerValue } from "@mantine/dates";
import { IconCalendar } from "@tabler/icons";
import dayjs from "dayjs";
import { ReactElement } from "react";
import { Controller, useForm } from "react-hook-form";
import DefaultLayout from "../components/layouts/default/default-layout";
import UserCard from "../components/leaderboard/user-card";
import { showErrorNotification } from "../utils/errors";
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

export default Leaderboard;

Leaderboard.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
