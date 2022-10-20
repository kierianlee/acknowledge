import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { gqlClient } from "../../services/graphql";
import {
  getSdk,
  IssuesWithoutRewardsQuery,
  WorkflowStatesQuery,
} from "../../__generated__/graphql-operations";
import { Button, Modal, NumberInput, Select, Text, Title } from "@mantine/core";
import { ReactElement, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { trpc } from "../../utils/trpc";
import DefaultLayout from "../../components/layouts/default/default-layout";
import { NextPageWithLayout } from "../_app";

const Issues: NextPageWithLayout = () => {
  const { data: session } = useSession();
  const gql = getSdk(gqlClient);
  const { data: issuesWithoutRewardsData } = useQuery(
    ["issuesWithoutRewards"],
    async () => {
      const data = await gql.IssuesWithoutRewards(
        {},
        { Authorization: session?.accessToken || "" }
      );

      return data;
    },
    { enabled: !!session?.accessToken }
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
    { enabled: !!session?.accessToken }
  );

  const { mutate: createRewardMutate } = trpc.issues.createReward.useMutation(
    {}
  );

  const [addRewardModalOpened, setAddRewardModalOpened] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<
    IssuesWithoutRewardsQuery["issues"]["nodes"][0] | null
  >(null);

  return (
    <>
      <div>
        <Title order={1} weight={500}>Issues</Title>
        {issuesWithoutRewardsData?.issues.nodes.map((item, index) => (
          <div
            key={index}
            onClick={() => {
              setSelectedIssue(item);
              setAddRewardModalOpened(true);
            }}
          >
            {item.title}
          </div>
        ))}
      </div>
      <AddRewardModal
        opened={addRewardModalOpened}
        onClose={() => {
          setAddRewardModalOpened(false);
          setSelectedIssue(null);
        }}
        issue={selectedIssue}
        onSubmit={(values) => {
          console.log(values);
          setAddRewardModalOpened(false);
          createRewardMutate({
            issueId: selectedIssue!.id,
            points: values.points,
            targetStateId: values.targetStateId,
          });
        }}
        workflowStates={workflowStatesData?.workflowStates.edges}
      />
    </>
  );
};

interface AddRewardModalProps {
  onClose: () => void;
  opened: boolean;
  issue: IssuesWithoutRewardsQuery["issues"]["nodes"][0] | null;
  onSubmit: (values: AddRewardModalFormValues) => void;
  workflowStates?: WorkflowStatesQuery["workflowStates"]["edges"];
}

interface AddRewardModalFormValues {
  points: number;
  targetStateId: string;
}

const AddRewardModal = (props: AddRewardModalProps) => {
  const form = useForm<AddRewardModalFormValues>({
    defaultValues: {
      points: 0,
      targetStateId: "",
    },
  });

  const handleSubmission = (values: AddRewardModalFormValues) => {
    props.onSubmit(values);
    form.reset({ points: 0 });
  };
  return (
    <Modal
      onClose={props.onClose}
      opened={props.opened}
      closeOnClickOutside={false}
    >
      <form onSubmit={form.handleSubmit(handleSubmission)}>
        <Text>Add points to {props.issue?.title}</Text>
        <Controller
          control={form.control}
          name="points"
          render={({ field: { value, onChange } }) => (
            <NumberInput
              value={value}
              onChange={onChange}
              placeholder="Enter value"
              required
            />
          )}
          rules={{ required: true }}
        />
        <Controller
          control={form.control}
          name="targetStateId"
          render={({ field: { value, onChange } }) => (
            <Select
              value={value}
              onChange={onChange}
              placeholder="Select value"
              data={
                props.workflowStates?.map((item) => ({
                  label: item.node.name,
                  value: item.node.id,
                })) || []
              }
              required
            />
          )}
          rules={{ required: true }}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Modal>
  );
};

export default Issues;

Issues.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
