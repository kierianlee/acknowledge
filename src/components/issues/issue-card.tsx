import {
  IssuesQuery,
  WorkflowStatesQuery,
} from "../../__generated__/graphql-operations";
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
} from "@mantine/core";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { trpc } from "../../utils/trpc";
import {
  acknowledgeAttachmentTitle,
  convertPriorityNumberToIcon,
  convertPriorityNumberToLabel,
} from "../../utils/linear";
import { IconMedal, IconPencil, IconTrophy } from "@tabler/icons";
import { useAuthStore } from "../../stores/auth";
import { showErrorNotification } from "../../utils/errors";
import { showNotification } from "@mantine/notifications";
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

  const acknowledgeMetadata = issue.attachments?.nodes.find(
    (item) => item.title === acknowledgeAttachmentTitle
  )?.metadata;
  const points = acknowledgeMetadata?.points;
  const claimed = acknowledgeMetadata?.claimed;

  const form = useForm<IssueCardFormValues>({
    defaultValues: {
      points: points !== undefined && points !== null ? points : undefined,
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
      onSettled: () => {
        queryClient.invalidateQueries(["issues"]);
      },
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
      onSettled: () => {
        queryClient.invalidateQueries(["issues"]);
      },
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
      onSettled: () => {
        queryClient.invalidateQueries(["issues"]);
      },
    });

  const PriorityIcon = convertPriorityNumberToIcon(issue?.priority || 0);

  const handleSubmission = (values: IssueCardFormValues) => {
    if (!points && points !== 0) {
      createRewardMutate({
        issueId: issue.id,
        points: values.points,
        targetStateId: values.targetStateId,
      });
    } else {
      updateRewardMutate({
        points: values.points,
        targetStateId: values.targetStateId,
        rewardId: acknowledgeMetadata.rewardId,
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
        <Text weight={500}>{issue?.title}</Text>
        <Group>
          <Badge px={4} py="md" radius="md" color="gray">
            <Group align="center" spacing={4}>
              <PriorityIcon size="16px" />
              <Text sx={{ fontSize: "12px" }} transform="none" weight={600}>
                {convertPriorityNumberToLabel(issue.priority)}
              </Text>
            </Group>
          </Badge>
          {points !== undefined && points !== null && (
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
            <Group
              sx={(theme) => ({
                [theme.fn.smallerThan("sm")]: {
                  display: "block",
                },
              })}
            >
              <Group
                sx={(theme) => ({
                  flex: "1",
                  [theme.fn.smallerThan("sm")]: {
                    justifyContent: "space-between",
                  },
                })}
              >
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
                        min={0}
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
                        workflowStates
                          ?.filter(
                            (item) => item.node.team.id === issue.team.id
                          )
                          .map((item) => ({
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
              <Box
                sx={(theme) => ({
                  display: "flex",
                  gap: "12px",

                  [theme.fn.smallerThan("sm")]: {
                    marginTop: theme.spacing.md,
                    justifyContent: "space-between",
                  },
                })}
              >
                <Box>
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
                  {points !== undefined && points !== null && !claimed && (
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
                </Box>
                <Button
                  type="submit"
                  size="xs"
                  loading={createRewardLoading || updateRewardLoading}
                  disabled={deleteRewardLoading || claimed}
                >
                  Assign
                </Button>
              </Box>
            </Group>
          </Box>
        </>
      )}
    </Box>
  );
};

export default IssueCard;
