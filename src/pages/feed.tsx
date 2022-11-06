import { Box, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ReactElement } from "react";
import ActionCard from "../components/feed/action-card";
import DefaultLayout from "../components/layouts/default/default-layout";
import { gqlClient } from "../services/graphql";
import { showErrorNotification } from "../utils/errors";
import { trpc } from "../utils/trpc";
import { getSdk } from "../__generated__/graphql-operations";

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

export default Feed;

Feed.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
