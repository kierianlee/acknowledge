import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { gqlClient } from "../services/graphql";
import {
  getSdk,
  IssuesQueryVariables,
} from "../__generated__/graphql-operations";
import { Box, Button, Group, Title } from "@mantine/core";
import { ReactElement, useEffect, useMemo, useState } from "react";
import DefaultLayout from "../components/layouts/default/default-layout";
import { NextPageWithLayout } from "./_app";
import { acknowledgeAttachmentTitle } from "../utils/linear";
import { IconPlus } from "@tabler/icons";
import Filter, {
  FilterInputOption,
  FilterValue,
  InputType,
  QueryType,
  removeFilterFromFilterList,
} from "../components/filter";
import { mergeWith } from "lodash";
import { SelectItem } from "../components/filter/filter-input";
import IssueCard from "../components/issues/issue-card";

const Issues: NextPageWithLayout = () => {
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

  const filterOptions: FilterInputOption[] = useMemo(
    () => [
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
              attachments: { some: { title: { startsWith: "Acknowledge" } } },
            },
          },
          {
            label: "No Reward",
            value: {
              attachments: {
                or: [
                  { every: { title: { neq: acknowledgeAttachmentTitle } } },
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
                  title: { eq: acknowledgeAttachmentTitle },
                  subtitle: {
                    endsWith: "(claimed)",
                  },
                },
              },
            },
          },
          {
            label: "Unclaimed",
            value: {
              attachments: {
                some: {
                  title: {
                    eq: acknowledgeAttachmentTitle,
                  },
                  subtitle: {
                    notEndsWith: "(claimed)",
                  },
                },
              },
            },
          },
        ],
      },
      {
        label: "Status",
        accessor: "status",
        input: InputType.SELECT,
        queries: [QueryType.EQUALS],
        options: [
          ...(workflowStatesData?.workflowStates.edges.map((item) => ({
            label: `${item.node.name} (${item.node.team.name})`,
            value: {
              state: {
                id: { eq: item.node.id },
              },
            },
          })) || []),
          ...(workflowStatesData?.workflowStates.edges.map((item) => ({
            label: `Not ${item.node.name} (${item.node.team.name})`,
            value: {
              state: {
                id: { neq: item.node.id },
              },
            },
          })) || []),
        ],
      },
    ],
    [workflowStatesData]
  );

  const [filterMenuOpened, setFilterMenuOpened] = useState(false);
  const [filters, setFilters] = useState<FilterValue[]>([
    {
      label: "Reward",
      accessor: "reward",
      query: QueryType.EQUALS,
      value: {
        label: "No Reward",
        value: {
          attachments: {
            or: [
              { every: { title: { neq: acknowledgeAttachmentTitle } } },
              { length: { eq: 0 } },
            ],
          },
        },
      },
    },
  ]);
  const [issuesQueryVariables, setIssuesQueryVariables] =
    useState<IssuesQueryVariables>({
      filter: {
        attachments: {
          or: [
            { every: { title: { neq: acknowledgeAttachmentTitle } } },
            { length: { eq: 0 } },
          ],
        },
      },
    });

  const { data: issuesData, isFetched: issuesIsFetched } = useQuery(
    ["issues", issuesQueryVariables],
    async () => {
      const data = await gql.Issues(issuesQueryVariables, {
        Authorization: session?.account?.accessToken || "",
      });

      return data;
    },
    {
      enabled: !!session?.account?.accessToken,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (issuesIsFetched) {
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
  }, [filters, issuesIsFetched]);

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
      {issuesData?.issues.nodes.map((item) => (
        <IssueCard
          key={item.id}
          issue={item}
          workflowStates={workflowStatesData?.workflowStates.edges}
        />
      ))}
    </Box>
  );
};

export default Issues;

Issues.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
