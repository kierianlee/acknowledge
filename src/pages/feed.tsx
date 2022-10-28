import { Avatar, Box, Group, Stack, Title, Text } from "@mantine/core";
import { ActionType } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { inferProcedureOutput } from "@trpc/server";
import dayjs from "dayjs";
import { useSession } from "next-auth/react";
import { ReactElement, useMemo } from "react";
import { JSONObject } from "superjson/dist/types";
import DefaultLayout from "../components/layouts/default/default-layout";
import { AppRouter } from "../server/routers/_app";
import { gqlClient } from "../services/graphql";
import { showErrorNotification } from "../utils/errors";
import { getInitials } from "../utils/string";
import { trpc } from "../utils/trpc";
import {
  getSdk,
  WorkflowStatesQuery,
} from "../__generated__/graphql-operations";

const Feed = () => {
  const { data: session } = useSession();
  const gql = getSdk(gqlClient);

  const { data: workflowStatesData } = useQuery(
    ["workflowStates"],
    async () => {
      const data = await gql.WorkflowStates(
        {},
        { Authorization: session?.account?.accessToken || "" }
      );

      return data;
    },
    {
      enabled: !!session?.account?.accessToken,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );
  const { data: actionsData } = trpc.actions.organizationActions.useQuery(
    {
      filter: {},
      orderBy: {
        direction: "desc",
        field: "createdAt",
      },
    },
    {
      onError: showErrorNotification,
    }
  );

  return (
    <Box p="lg">
      <Title order={2} weight={500} mb="xl">
        Feed
      </Title>
      <Box mt="xl">
        {actionsData?.map((action, index) => (
          <ActionCard
            action={action}
            workflowStates={workflowStatesData?.workflowStates.edges}
            key={index}
          />
        ))}
      </Box>
    </Box>
  );
};

interface ActionCardProps {
  action: inferProcedureOutput<AppRouter["actions"]["organizationActions"]>[0];
  workflowStates?: WorkflowStatesQuery["workflowStates"]["edges"];
}

const ActionCard = ({ action, workflowStates }: ActionCardProps) => {
  const title = useMemo(() => {
    switch (action.type) {
      case ActionType.TRANSACTION:
        return `${action.transaction?.beneficiary.user.name}`;
      case ActionType.REWARD_CLAIM:
        return `${action.reward?.claimedBy?.user.name}`;
      case ActionType.REWARD_CREATE:
        return `${action.actor?.user.name}`;
      case ActionType.REWARD_UPDATE:
        return `${action.actor?.user.name}`;
      case ActionType.REWARD_DELETE:
        return `${action.actor?.user.name}`;
      default:
        return "Error";
    }
  }, [action]);

  const message = useMemo(() => {
    switch (action.type) {
      case ActionType.TRANSACTION:
        return `Received ${action.transaction?.value} points from ${action.transaction?.benefactor.user.name}.`;
      case ActionType.REWARD_CLAIM:
        return `${action.reward?.claimedBy?.user.name} claims ${action.reward?.value} point reward for ${action.reward?.issueIdentifier}.`;
      case ActionType.REWARD_CREATE:
        return `Assigned ${action.reward?.value} points to ${
          action.reward?.issueIdentifier
        } on ${
          workflowStates?.find(
            (item) => item.node.id === action.reward?.targetStateId
          )?.node.name
        }.`;
      case ActionType.REWARD_UPDATE:
        return `Updated ${action.reward?.issueIdentifier} reward to ${
          action.reward?.value
        } points on ${
          workflowStates?.find(
            (item) => item.node.id === action.reward?.targetStateId
          )?.node.name
        }.`;
      case ActionType.REWARD_DELETE:
        return `Deleted reward on ${
          (action.metadata as JSONObject)?.issueIdentifier
        }.`;
      default:
        return "Error";
    }
  }, [action, workflowStates]);

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
      <Stack spacing={8}>
        <Group>
          <Group>
            <Avatar size="sm" radius="xl" color="indigo">
              {getInitials(title || "")}
            </Avatar>
            <Text weight={500}>{title}</Text>
          </Group>
        </Group>
        <Text size="sm" color="dark">
          {message}
        </Text>
        <Text size="xs" color="dimmed">
          {dayjs(action.createdAt).format("hh:mm A, DD MMM YYYY")}
        </Text>
      </Stack>
    </Box>
  );
};

export default Feed;

Feed.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
