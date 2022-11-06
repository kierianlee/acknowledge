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
import useInfiniteScroll from "react-infinite-scroll-hook";

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
  const { data, hasNextPage, fetchNextPage, isLoading, error } =
    trpc.actions.organizationActions.useInfiniteQuery(
      {
        filter: {},
        limit: 10,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        onError: showErrorNotification,
      }
    );

  const [sentryRef] = useInfiniteScroll({
    loading: isLoading,
    hasNextPage: hasNextPage ?? false,
    onLoadMore: fetchNextPage,
    disabled: !!error,
    rootMargin: "0px 0px 400px 0px",
  });

  console.log(data);

  return (
    <Box p="lg">
      <Title order={2} weight={500} mb="xl">
        Feed
      </Title>
      <Box mt="xl">
        {data?.pages.flatMap((page, index) =>
          page.items.map((item) => (
            <ActionCard
              action={item}
              workflowStates={workflowStatesData?.workflowStates.edges}
              key={item.id}
              ref={sentryRef}
            />
          ))
        )}
      </Box>
    </Box>
  );
};

export default Feed;

Feed.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
