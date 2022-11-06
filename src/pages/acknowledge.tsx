import { Box, Button, Group, SegmentedControl, Title } from "@mantine/core";
import { IconCalendar, IconHeartHandshake } from "@tabler/icons";
import { ReactElement, useState } from "react";
import DefaultLayout from "../components/layouts/default/default-layout";
import { DateRangePicker, DateRangePickerValue } from "@mantine/dates";
import { Controller, useForm } from "react-hook-form";
import dayjs from "dayjs";
import { trpc } from "../utils/trpc";
import { showErrorNotification } from "../utils/errors";
import { showNotification } from "@mantine/notifications";
import { getSdk } from "../__generated__/graphql-operations";
import { useQuery } from "@tanstack/react-query";
import { gqlClient } from "../services/graphql";
import { useSession } from "next-auth/react";
import AcknowledgementCard from "../components/acknowledge/acknowledgement-card";
import CreateAcknowledgementModal, {
  CreateAcknowledgementModalFormValues,
} from "../components/acknowledge/create-acknowledgement-modal";
import useInfiniteScroll from "react-infinite-scroll-hook";

enum ControlFilter {
  None = "none",
  Received = "received",
  Given = "given",
}

interface FilterFormValues {
  filter: ControlFilter;
  range: DateRangePickerValue;
}

const Acknowledge = () => {
  const { data: session } = useSession();
  const gql = getSdk(gqlClient);
  const utils = trpc.useContext();

  const [
    createAcknowledgementModalOpened,
    setCreateAcknowledgementModalOpened,
  ] = useState(false);

  const filterForm = useForm<FilterFormValues>({
    defaultValues: {
      filter: ControlFilter.None,
      range: [dayjs().startOf("month").toDate(), dayjs().endOf("day").toDate()],
    },
  });

  const filterDateRange = filterForm.watch("range");
  const filterFilter = filterForm.watch("filter");

  const { data: usersData } = useQuery(
    ["users"],
    async () => {
      const data = await gql.Users(
        { filter: { isMe: { eq: false } } },
        {
          Authorization: session?.account?.accessToken || "",
        }
      );

      return data;
    },
    {
      enabled: !!session?.account?.accessToken,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  const {
    data: myTransactionsData,
    isError: myTransactionsIsError,
    isLoading: myTransactionsIsLoading,
    hasNextPage: myTransactionsHasNextPage,
    fetchNextPage: myTransactionsFetchNextPage,
  } = trpc.transactions.myTransactions.useInfiniteQuery(
    {
      filter: {
        createdAt: {
          gte: filterDateRange[0]?.toISOString(),
          lt: filterDateRange[1]?.toISOString(),
        },
        ...(filterFilter === ControlFilter.Given
          ? {
              benefactor: {
                id: session!.account.id,
              },
            }
          : {}),
        ...(filterFilter === ControlFilter.Received
          ? {
              beneficiary: {
                id: session!.account.id,
              },
            }
          : {}),
      },
      limit: 10,
    },
    {
      onError: showErrorNotification,
      enabled: !!session?.account,
    }
  );

  const [sentryRef] = useInfiniteScroll({
    loading: myTransactionsIsLoading,
    hasNextPage: myTransactionsHasNextPage ?? false,
    onLoadMore: myTransactionsFetchNextPage,
    disabled: myTransactionsIsError,
    rootMargin: "0px 0px 400px 0px",
  });

  const {
    mutate: createTransactionMutation,
    isLoading: createTransactionLoading,
  } = trpc.transactions.createTransactionByLinearUserId.useMutation({
    onError: showErrorNotification,
    onSettled: () => {
      utils.transactions.myTransactions.invalidate();
    },
    onSuccess: () => {
      showNotification({
        title: "Success",
        message: "You have acknowledged your teammate!",
      });
      setCreateAcknowledgementModalOpened(false);
      filterForm.setValue("range.1", dayjs().endOf("day").toDate());
    },
  });

  const handleCreateAcknowledgementModalSubmission = (
    values: CreateAcknowledgementModalFormValues
  ) => {
    createTransactionMutation({
      linearUserId: values.linearUserId,
      message: values.message,
      value: values.value,
    });
  };

  return (
    <Box p="lg">
      <Group position="apart">
        <Title order={2} weight={500} mb="xl">
          Acknowledge
        </Title>
        <Button
          size="xs"
          leftIcon={<IconHeartHandshake />}
          onClick={() => setCreateAcknowledgementModalOpened(true)}
        >
          Acknowledge Teammate
        </Button>
      </Group>
      <Group>
        <Controller
          control={filterForm.control}
          name="filter"
          render={({ field: { value, onChange } }) => (
            <SegmentedControl
              onChange={onChange}
              value={value}
              data={[
                { label: "Show All", value: ControlFilter.None },
                { label: "Received", value: ControlFilter.Received },
                { label: "Given", value: ControlFilter.Given },
              ]}
              size="xs"
            />
          )}
        />
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
        {myTransactionsData?.pages.flatMap((page) =>
          page.items.map((item) => (
            <AcknowledgementCard
              transaction={item}
              key={item.id}
              ref={sentryRef}
            />
          ))
        )}
      </Box>
      <CreateAcknowledgementModal
        opened={createAcknowledgementModalOpened}
        onClose={() => setCreateAcknowledgementModalOpened(false)}
        onSubmit={handleCreateAcknowledgementModalSubmission}
        users={usersData?.users.nodes}
        loading={createTransactionLoading}
      />
    </Box>
  );
};

export default Acknowledge;

Acknowledge.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
