import { useQuery } from "@tanstack/react-query";
import type { NextPage } from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import { gqlClient } from "../services/graphql";
import {
  getSdk,
  IssuesWithoutRewardsQuery,
  WorkflowStatesQuery,
} from "../__generated__/graphql-operations";
import { Button, Modal, NumberInput, Select, Text } from "@mantine/core";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  const { data: session } = useSession();
  const gql = getSdk(gqlClient);
  const { data: issuesWithoutRewardsData } = useQuery(
    ["issuesWithoutRewards"],
    async () => {
      const data = await gql.IssuesWithoutRewards(
        {},
        { Authorization: session?.token.accessToken || "" }
      );

      return data;
    },
    { enabled: !!session?.token.accessToken }
  );
  const { data: workflowStatesData } = useQuery(
    ["workflowStates"],
    async () => {
      const data = await gql.WorkflowStates(
        {},
        { Authorization: session?.token.accessToken || "" }
      );

      return data;
    },
    { enabled: !!session?.token.accessToken }
  );

  const { mutate: createRewardMutate } = trpc.issues.createReward.useMutation(
    {}
  );

  const [addRewardModalOpened, setAddRewardModalOpened] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<
    IssuesWithoutRewardsQuery["issues"]["nodes"][0] | null
  >(null);

  if (session) {
    return (
      <>
        Signed in as {session.user.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
        <div>
          <h1>Issues Without Points</h1>
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
  }
  return (
    <>
      Not signed in <br />
      <button onClick={() => signIn()}>Sign in</button>
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

export default Home;
