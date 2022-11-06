import { Box, Title, Group, Center, Pagination, Select } from "@mantine/core";
import { DateRangePicker, DateRangePickerValue } from "@mantine/dates";
import { IconCalendar } from "@tabler/icons";
import dayjs from "dayjs";
import { ReactElement, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import useInfiniteScroll from "react-infinite-scroll-hook";
import DefaultLayout from "../components/layouts/default/default-layout";
import UserCard from "../components/leaderboard/user-card";
import { limitSelectOptions } from "../server/pagination";
import { showErrorNotification } from "../utils/errors";
import { trpc } from "../utils/trpc";

interface FilterFormValues {
  range: DateRangePickerValue;
}

const Leaderboard = () => {
  const [pagination, setPagination] = useState({
    limit: 10,
    skip: 0,
  });

  const filterForm = useForm<FilterFormValues>({
    defaultValues: {
      range: [dayjs().startOf("month").toDate(), dayjs().endOf("day").toDate()],
    },
  });

  const filterDateRange = filterForm.watch("range");

  const { data, isLoading, isError } = trpc.pointLogs.leaderboard.useQuery(
    {
      filter: {
        createdAt: {
          gte: filterDateRange[0]!.toISOString(),
          lt: filterDateRange[1]!.toISOString(),
        },
      },
      limit: pagination.limit,
      skip: pagination.skip,
    },
    {
      onError: showErrorNotification,
    }
  );

  const [sentryRef] = useInfiniteScroll({
    loading: isLoading,
    hasNextPage: false,
    onLoadMore: () => {},
    disabled: isError,
    rootMargin: "0px 0px 400px 0px",
  });

  return (
    <Box p="lg">
      <Title
        order={2}
        weight={500}
        mb="xl"
        sx={(theme) => ({
          [theme.fn.smallerThan("sm")]: {
            fontSize: "1.4rem",
          },
        })}
      >
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
              clearable={false}
            />
          )}
        />
      </Group>
      <Box mt="xl">
        {data?.items.map((item, index) => (
          <UserCard key={index} account={item} ref={sentryRef} />
        ))}
      </Box>
      <Group mt="xl" position="apart">
        <Box
          sx={(theme) => ({
            [theme.fn.smallerThan("sm")]: {
              display: "none",
            },
          })}
        />
        <Pagination
          total={
            data?.totalCount ? Math.ceil(data.totalCount / pagination.limit) : 0
          }
          page={pagination.skip / pagination.limit + 1}
          onChange={(page) => {
            setPagination((prev) => ({ ...prev, skip: page * prev.limit - 1 }));
          }}
          size="sm"
        />
        <Select
          value={pagination.limit.toString()}
          onChange={(value) =>
            setPagination((prev) => ({ ...prev, limit: parseInt(value!) }))
          }
          data={limitSelectOptions}
          clearable={false}
          size="xs"
        />
      </Group>
    </Box>
  );
};

export default Leaderboard;

Leaderboard.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
