import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { gqlClient } from "../services/graphql";
import {
  getSdk,
  IssuesQuery,
  IssuesQueryVariables,
  WorkflowStatesQuery,
} from "../__generated__/graphql-operations";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { ReactElement, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { trpc } from "../utils/trpc";
import DefaultLayout from "../components/layouts/default/default-layout";
import { NextPageWithLayout } from "./_app";
import {
  convertPriorityNumberToIcon,
  convertPriorityNumberToLabel,
} from "../utils/linear";
import { IconMedal, IconPencil, IconPlus, IconTrophy } from "@tabler/icons";
import { useAuthStore } from "../stores/auth";
import { showErrorNotification } from "../utils/errors";
import { showNotification } from "@mantine/notifications";
import Filter, {
  FilterInputOption,
  FilterValue,
  InputType,
  QueryType,
  removeFilterFromFilterList,
} from "../components/filter";
import { mergeWith } from "lodash";
import { SelectItem } from "../components/filter/filter-input";

const filterOptions: FilterInputOption[] = [
  {
    label: "Title",
    accessor: "title",
    input: InputType.TEXT,
    queries: [QueryType.CONTAINS, QueryType.EQUALS],
    valueTransformer: (val, query) => ({
      title: {
        ...(query === QueryType.CONTAINS
          ? {
              containsIgnoreCase: val,
            }
          : {}),
        ...(query === QueryType.EQUALS
          ? {
              eqIgnoreCase: val,
            }
          : {}),
      },
    }),
  },
  {
    label: "Reward",
    accessor: "reward",
    input: InputType.SELECT,
    queries: [QueryType.EQUALS],
    options: [
      {
        label: "Has Reward",
        value: {
          attachments: { some: { title: { eq: "Acknowledge" } } },
        },
      },
      {
        label: "No Reward",
        value: {
          attachments: {
            or: [
              { every: { title: { neq: "Acknowledge" } } },
              { length: { eq: 0 } },
            ],
          },
        },
      },
      {
        label: "Claimed",
        value: {
          attachments: {
            some: {
              title: { startsWith: "Acknowledge", endsWith: "(claimed)" },
            },
          },
        },
      },
      {
        label: "Unclaimed",
        value: {
          attachments: {
            some: {
              title: { startsWith: "Acknowledge", notEndsWith: "(claimed)" },
            },
          },
        },
      },
    ],
  },
];

const Issues: NextPageWithLayout = () => {
  const { data: session } = useSession();
  const gql = getSdk(gqlClient);
  const [filterMenuOpened, setFilterMenuOpened] = useState(false);
  const [filters, setFilters] = useState<FilterValue[]>([]);
  const [issuesQueryVariables, setIssuesQueryVariables] =
    useState<IssuesQueryVariables>({
      filter: {},
    });

  const {
    data: issuesData,
    refetch: refetchIssues,
    isFetched: issuesIsFetched,
  } = useQuery(
    ["issues", issuesQueryVariables],
    async () => {
      const data = await gql.Issues(issuesQueryVariables, {
        Authorization: session?.accessToken || "",
      });

      return data;
    },
    {
      enabled: !!session?.accessToken,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );
  const { data: workflowStatesData } = useQuery(
    ["workflowStates"],
    async () => {
      const data = await gql.WorkflowStates(
        {},
        { Authorization: session?.accessToken || "" }
      );

      return data;
    },
    {
      enabled: !!session?.accessToken,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (issuesIsFetched) {
      console.log(filters);
      setIssuesQueryVariables((prev) => ({
        ...prev,
        filter: mergeWith(
          {},
          ...filters.map(
            (item) => item.transformedValue ?? (item.value as SelectItem)?.value
          )
        ),
      }));
    }
  }, [filters, refetchIssues, issuesIsFetched]);

  return (
    <Box p="lg">
      <Title order={2} weight={500} mb="sm">
        Issues
      </Title>
      <Group mb="xl">
        <Filter.Menu
          target={(onOpen) => (
            <Button
              size="xs"
              variant="outline"
              color="gray"
              sx={{ borderStyle: "dotted" }}
              leftIcon={<IconPlus size="14px" />}
              onClick={onOpen}
            >
              Add Filter
            </Button>
          )}
          opened={filterMenuOpened}
          onClose={() => setFilterMenuOpened(false)}
          onOpen={() => setFilterMenuOpened(true)}
          onSubmit={(value) => setFilters((prev) => [...prev, value])}
          options={filterOptions}
        />
        {filters.map((filter, index) => (
          <Filter.Badge
            key={index}
            onRemove={(filter) =>
              setFilters((prev) => removeFilterFromFilterList(filter, prev))
            }
            value={filter}
          />
        ))}
      </Group>
      {issuesData?.issues.nodes.map((item, index) => (
        <IssueCard
          key={index}
          issue={item}
          workflowStates={workflowStatesData?.workflowStates.edges}
          actionCallback={() => {
            refetchIssues();
          }}
        />
      ))}
    </Box>
  );
};

interface IssueCardProps {
  issue: IssuesQuery["issues"]["nodes"][0];
  workflowStates?: WorkflowStatesQuery["workflowStates"]["edges"];
  defaultEditable?: boolean;
  actionCallback?: () => void;
}

interface IssueCardFormValues {
  points: number;
  targetStateId: string;
}

const IssueCard = ({
  defaultEditable = false,
  issue,
  workflowStates,
  actionCallback,
}: IssueCardProps) => {
  const auth = useAuthStore();

  const acknowledgeMetadata = issue.attachments?.nodes.find(
    (item) => item.title === "Acknowledge"
  )?.metadata;
  const points = acknowledgeMetadata?.points;
  const claimed = acknowledgeMetadata?.claimed;

  const form = useForm<IssueCardFormValues>({
    defaultValues: {
      points: points || undefined,
      targetStateId: acknowledgeMetadata?.targetStateId || undefined,
    },
  });

  const [editable, setEditable] = useState(defaultEditable);

  const { mutate: createRewardMutate, isLoading: createRewardLoading } =
    trpc.issues.createReward.useMutation({
      onSuccess: () => {
        if (actionCallback) {
          actionCallback();
        }
        setEditable(false);
        form.reset({ points: 0, targetStateId: "" });
        showNotification({
          color: "green",
          title: "Success",
          message: "Reward set!",
        });
      },
      onError: showErrorNotification,
    });
  const { mutate: updateRewardMutate, isLoading: updateRewardLoading } =
    trpc.issues.updateReward.useMutation({
      onSuccess: () => {
        if (actionCallback) {
          actionCallback();
        }
        setEditable(false);
        form.reset({ points: 0, targetStateId: "" });
        showNotification({
          color: "green",
          title: "Success",
          message: "Reward set!",
        });
      },
      onError: showErrorNotification,
    });
  const { mutate: deleteRewardMutate, isLoading: deleteRewardLoading } =
    trpc.issues.deleteReward.useMutation({
      onSuccess: () => {
        if (actionCallback) {
          actionCallback();
        }
        setEditable(false);
        form.reset({ points: 0, targetStateId: "" });
        showNotification({
          color: "green",
          title: "Success",
          message: "Reward deleted!",
        });
      },
      onError: showErrorNotification,
    });

  const PriorityIcon = convertPriorityNumberToIcon(issue?.priority || 0);

  const handleSubmission = (values: IssueCardFormValues) => {
    if (points) {
      updateRewardMutate({
        points: values.points,
        targetStateId: values.targetStateId,
        rewardId: acknowledgeMetadata.rewardId,
      });
    } else {
      createRewardMutate({
        issueId: issue.id,
        points: values.points,
        targetStateId: values.targetStateId,
      });
    }
  };

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
      {!editable && auth.linearUser?.admin && (
        <Box sx={{ position: "absolute", right: "16px", top: "16px" }}>
          <ActionIcon
            variant="outline"
            size="lg"
            onClick={() => setEditable(true)}
            sx={(theme) => ({ borderColor: theme.colors.gray[3] })}
            disabled={claimed}
          >
            <IconPencil size="16px" />
          </ActionIcon>
        </Box>
      )}
      <Stack p="md">
        <Text weight={600}>{issue?.title}</Text>
        <Group>
          <Badge px={4} py="md" radius="md" color="gray">
            <Group align="center" spacing={4}>
              <PriorityIcon size="16px" />
              <Text sx={{ fontSize: "12px" }} transform="none" weight={600}>
                {convertPriorityNumberToLabel(issue.priority)}
              </Text>
            </Group>
          </Badge>
          {!!points && (
            <Badge px={4} py="md" radius="md" color="gray">
              <Group align="center" spacing={4}>
                <IconTrophy size="16px" />
                <Text sx={{ fontSize: "12px" }} transform="none" weight={600}>
                  {points} points
                </Text>
              </Group>
            </Badge>
          )}
          {claimed && (
            <Badge px={4} py="md" radius="md" color="gray">
              <Group align="center" spacing={4}>
                <IconMedal size="16px" />
                <Text sx={{ fontSize: "12px" }} transform="none" weight={600}>
                  Reward claimed
                </Text>
              </Group>
            </Badge>
          )}
        </Group>
      </Stack>
      {editable && (
        <>
          <Divider orientation="horizontal" />
          <Box
            component="form"
            p="md"
            onSubmit={form.handleSubmit(handleSubmission)}
          >
            <Group>
              <Group sx={{ flex: "1" }}>
                <Group>
                  <Controller
                    control={form.control}
                    name="points"
                    render={({
                      field: { value, onChange },
                      fieldState: { error },
                    }) => (
                      <NumberInput
                        value={value}
                        onChange={onChange}
                        placeholder="0"
                        styles={{ input: { maxWidth: "70px" } }}
                        size="xs"
                        error={!!error}
                        min={1}
                        max={100}
                        disabled={claimed}
                      />
                    )}
                    rules={{ required: true }}
                  />
                  <Text color="dimmed" size="xs">
                    points
                  </Text>
                </Group>
                <Controller
                  control={form.control}
                  name="targetStateId"
                  render={({
                    field: { value, onChange },
                    fieldState: { error },
                  }) => (
                    <Select
                      value={value}
                      onChange={onChange}
                      placeholder="Select target"
                      data={
                        workflowStates?.map((item) => ({
                          label: item.node.name,
                          value: item.node.id,
                        })) || []
                      }
                      size="xs"
                      required
                      error={!!error}
                      disabled={claimed}
                    />
                  )}
                  rules={{ required: true }}
                />
              </Group>
              <Button
                type="submit"
                variant="outline"
                color="gray"
                onClick={() => setEditable(false)}
                sx={(theme) => ({ borderColor: theme.colors.gray[4] })}
                size="xs"
              >
                Cancel
              </Button>
              {!!points && !claimed && (
                <Button
                  size="xs"
                  color="red"
                  disabled={createRewardLoading || updateRewardLoading}
                  loading={deleteRewardLoading}
                  onClick={() => {
                    deleteRewardMutate({
                      rewardId: acknowledgeMetadata.rewardId,
                    });
                  }}
                >
                  Remove Reward
                </Button>
              )}
              <Button
                type="submit"
                size="xs"
                loading={createRewardLoading || updateRewardLoading}
                disabled={deleteRewardLoading || claimed}
              >
                Assign
              </Button>
            </Group>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Issues;

Issues.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
