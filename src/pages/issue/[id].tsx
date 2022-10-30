import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Stack,
  Title,
  Text,
} from "@mantine/core";
import { IconMedal, IconPencil, IconTrophy } from "@tabler/icons";
import { useQuery } from "@tanstack/react-query";
import { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { ReactElement, useState } from "react";
import DefaultLayout from "../../components/layouts/default/default-layout";
import { gqlClient } from "../../services/graphql";
import { useAuthStore } from "../../stores/auth";
import {
  acknowledgeAttachmentTitle,
  convertPriorityNumberToIcon,
  convertPriorityNumberToLabel,
} from "../../utils/linear";
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
  const auth = useAuthStore();

  const [editable, setEditable] = useState(false);

  const { data: issueData } = useQuery(
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

  const acknowledgeMetadata = issue?.attachments?.nodes.find(
    (item) => item.title === acknowledgeAttachmentTitle
  )?.metadata;
  const points = acknowledgeMetadata?.points;
  const claimed = acknowledgeMetadata?.claimed;

  const PriorityIcon = convertPriorityNumberToIcon(issue?.priority || 0);

  return (
    <Box p="lg">
      <Title order={2} weight={500} mb="xl">
        Issue
      </Title>
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
                  {convertPriorityNumberToLabel(issue?.priority || 0)}
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
      </Box>
    </Box>
  );
};

export default IssuePage;

IssuePage.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
