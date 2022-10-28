import {
  Box,
  Button,
  Divider,
  Grid,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  Textarea,
  ThemeIcon,
  Title,
  Text,
  Stack,
  Avatar,
  useMantineTheme,
} from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconHeartHandshake } from "@tabler/icons";
import { ReactElement, useMemo, useState } from "react";
import DefaultLayout from "../components/layouts/default/default-layout";
import { DateRangePicker, DateRangePickerValue } from "@mantine/dates";
import { Controller, useForm } from "react-hook-form";
import dayjs from "dayjs";
import { trpc } from "../utils/trpc";
import { showErrorNotification } from "../utils/errors";
import { showNotification } from "@mantine/notifications";
import { getSdk, UsersQuery } from "../__generated__/graphql-operations";
import { useQuery } from "@tanstack/react-query";
import { gqlClient } from "../services/graphql";
import { useSession } from "next-auth/react";
import { useAuthStore } from "../stores/auth";
import { inferProcedureOutput } from "@trpc/server";
import { AppRouter } from "../server/routers/_app";
import { getInitials } from "../utils/string";

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

  const [
    createAcknowledgementModalOpened,
    setCreateAcknowledgementModalOpened,
  ] = useState(false);

  const filterForm = useForm<FilterFormValues>({
    defaultValues: {
      filter: ControlFilter.None,
      range: [dayjs().startOf("month").toDate(), new Date()],
    },
  });

  const filterDateRange = filterForm.watch("range");

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

  const { data: myTransactionsData, refetch: myTransactionsRefetch } =
    trpc.transactions.myTransactions.useQuery(
      {
        filter: {
          createdAt: {
            gte: filterDateRange[0]?.toISOString(),
            lte: filterDateRange[1]?.toISOString(),
          },
        },
        orderBy: {
          direction: "desc",
          field: "createdAt",
        },
      },
      {
        onError: showErrorNotification,
      }
    );

  const {
    mutate: createTransactionMutation,
    isLoading: createTransactionLoading,
  } = trpc.transactions.createTransactionByLinearUserId.useMutation({
    onError: showErrorNotification,
    onSuccess: () => {
      showNotification({
        title: "Success",
        message: "You have acknowledged your teammate!",
      });
      setCreateAcknowledgementModalOpened(false);
      filterForm.setValue("range.1", new Date());
      myTransactionsRefetch();
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
        <SegmentedControl
          data={[
            { label: "Show All", value: ControlFilter.None },
            { label: "Received", value: ControlFilter.Received },
            { label: "Given", value: ControlFilter.Given },
          ]}
          size="xs"
        />
        <Controller
          control={filterForm.control}
          name="range"
          render={({ field: { onChange, value } }) => (
            <DateRangePicker
              size="xs"
              onChange={onChange}
              value={value}
              maxDate={new Date()}
            />
          )}
        />
      </Group>
      <Box mt="xl">
        {myTransactionsData?.map((transaction, index) => (
          <AcknowledgementCard transaction={transaction} key={index} />
        ))}
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

interface AcknowledgementCardProps {
  transaction: inferProcedureOutput<
    AppRouter["transactions"]["myTransactions"]
  >[0];
}

const AcknowledgementCard = ({ transaction }: AcknowledgementCardProps) => {
  const auth = useAuthStore();
  const isBeneficiary = transaction.beneficiary.id === auth.account?.id;
  const theme = useMantineTheme();

  const title = useMemo(
    () =>
      isBeneficiary
        ? `Received +${transaction.value} points from ${transaction.benefactor.user.name}`
        : `Gave -${transaction.value} points to ${transaction.beneficiary.user.name}`,
    [transaction, isBeneficiary]
  );

  return (
    <Box
      sx={(theme) => ({
        borderRadius: theme.radius.md,
        marginBottom: "1rem",
        position: "relative",
        background: "#fff",
        shadow: theme.shadows.xl,
      })}
      p="xl"
    >
      <Group>
        {isBeneficiary ? (
          <ThemeIcon color="grape" variant="light">
            <IconArrowUp />
          </ThemeIcon>
        ) : (
          <ThemeIcon color="gray" variant="light">
            <IconArrowDown />
          </ThemeIcon>
        )}
        <Box sx={{ flex: "1" }}>
          <Stack spacing={6}>
            <Text weight={500} size="md">
              {title}
            </Text>
            <Text color="dimmed" size="xs">
              {transaction.message}
            </Text>
            <Group mt="md">
              <Group>
                <Avatar size="sm" radius="xl">
                  {getInitials(transaction.benefactor.user.name || "")}
                </Avatar>
                <Text size="xs">{transaction.benefactor.user.name}</Text>
              </Group>
              <IconHeartHandshake color={theme.colors.gray[5]} />
              <Group>
                <Avatar size="sm" radius="xl">
                  {getInitials(transaction.beneficiary.user.name || "")}
                </Avatar>
                <Text size="xs">{transaction.beneficiary.user.name}</Text>
              </Group>
            </Group>
          </Stack>
        </Box>
        <Box>
          <Text color="dimmed" size="xs">
            {dayjs(transaction.createdAt).format("hh:mm A, DD MMM YYYY")}
          </Text>
        </Box>
      </Group>
    </Box>
  );
};

interface CreateAcknowledgementModalProps {
  onClose: () => void;
  opened: boolean;
  onSubmit: (values: CreateAcknowledgementModalFormValues) => void;
  users?: UsersQuery["users"]["nodes"];
  loading: boolean;
}

interface CreateAcknowledgementModalFormValues {
  message: string;
  value: number;
  linearUserId: string;
}

const CreateAcknowledgementModal = ({
  opened,
  onClose,
  onSubmit,
  users,
  loading,
}: CreateAcknowledgementModalProps) => {
  const auth = useAuthStore();

  const form = useForm<CreateAcknowledgementModalFormValues>({
    defaultValues: {
      linearUserId: "",
      message: "",
      value: undefined,
    },
  });

  return (
    <Modal
      opened={opened}
      onClose={() => {
        onClose();
        form.reset();
      }}
      title="Acknowledge teammate"
    >
      <Box component="form" onSubmit={form.handleSubmit(onSubmit)}>
        <Grid>
          <Grid.Col span={12}>
            <Controller
              control={form.control}
              name="linearUserId"
              render={({
                field: { value, onChange },
                fieldState: { error },
              }) => (
                <Select
                  label="Teammate"
                  value={value}
                  onChange={onChange}
                  placeholder="Select user..."
                  data={
                    users?.map((item) => ({
                      label: item.name,
                      value: item.id,
                    })) || []
                  }
                  size="xs"
                  required
                  error={!!error}
                />
              )}
              rules={{ required: true }}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Controller
              control={form.control}
              name="value"
              render={({
                field: { value, onChange },
                fieldState: { error },
              }) => (
                <NumberInput
                  label="Points"
                  value={value}
                  onChange={onChange}
                  placeholder="Enter points..."
                  size="xs"
                  required
                  error={!!error}
                  min={1}
                  max={auth.account?.points || 0}
                />
              )}
              rules={{ required: true }}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Controller
              control={form.control}
              name="message"
              render={({
                field: { value, onChange },
                fieldState: { error },
              }) => (
                <Textarea
                  label="Message"
                  value={value}
                  onChange={onChange}
                  placeholder="Enter message..."
                  size="xs"
                  required
                  error={!!error}
                />
              )}
              rules={{ required: true }}
            />
          </Grid.Col>
        </Grid>
        <Divider my="lg" />
        <Group position="right">
          <Button size="xs" loading={loading} type="submit">
            Submit
          </Button>
        </Group>
      </Box>
    </Modal>
  );
};

export default Acknowledge;

Acknowledge.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
