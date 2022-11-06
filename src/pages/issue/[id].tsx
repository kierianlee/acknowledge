import { Box, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { ReactElement } from "react";
import DefaultLayout from "../../components/layouts/default/default-layout";
import IssueCard from "../../components/issues/issue-card";
import { gqlClient } from "../../services/graphql";
import { getSdk } from "../../__generated__/graphql-operations";

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (!context.params?.id) {
    return {
      redirect: {
        permanent: false,
        destination: "/issues",
      },
      props: {},
    };
  }

  return {
    props: {
      id: context.params.id,
    },
  };
};

interface IssuePageProps {
  id: string;
}

const IssuePage = ({ id }: IssuePageProps) => {
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

  const { data: issueData, refetch: issueRefetch } = useQuery(
    ["issue"],
    async () => {
      const data = await gql.Issue(
        {
          id,
        },
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

  const issue = issueData?.issue;

  return (
    <Box p="lg">
      <Title order={2} weight={500} mb="xl">
        Issue
      </Title>
      {!!issue && (
        <IssueCard
          issue={issue}
          workflowStates={workflowStatesData?.workflowStates.edges}
          actionCallback={() => {
            issueRefetch();
          }}
        />
      )}
    </Box>
  );
};

export default IssuePage;

IssuePage.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
