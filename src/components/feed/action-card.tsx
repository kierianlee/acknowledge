import { Avatar, Box, Group, Stack, Text } from "@mantine/core";
import { ActionType } from "@prisma/client";
import { inferProcedureOutput } from "@trpc/server";
import dayjs from "dayjs";
import { forwardRef, useMemo } from "react";
import { JSONObject } from "superjson/dist/types";
import { AppRouter } from "../../server/routers/_app";
import { getInitials } from "../../utils/string";
import { WorkflowStatesQuery } from "../../__generated__/graphql-operations";

interface ActionCardProps {
  action: inferProcedureOutput<AppRouter["actions"]["feed"]>["items"][0];
  workflowStates?: WorkflowStatesQuery["workflowStates"]["edges"];
}

const ActionCard = forwardRef<HTMLDivElement, ActionCardProps>(
  function ActionCard({ action, workflowStates }, ref) {
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
        ref={ref}
      >
        <Box>
          <Group
            mb="sm"
            sx={(theme) => ({
              minWidth: 0,
            })}
            noWrap
          >
            <Avatar size="sm" radius="xl" color="indigo">
              {getInitials(title || "")}
            </Avatar>
            <Text
              weight={500}
              sx={(theme) => ({
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              })}
            >
              {title}
            </Text>
          </Group>
          <Text
            size="sm"
            color="dark"
            mb="sm"
            sx={(theme) => ({ overflowWrap: "break-word" })}
          >
            {message}
          </Text>
          <Text size="xs" color="dimmed">
            {dayjs(action.createdAt).format("hh:mm A, DD MMM YYYY")}
          </Text>
        </Box>
      </Box>
    );
  }
);

export default ActionCard;
