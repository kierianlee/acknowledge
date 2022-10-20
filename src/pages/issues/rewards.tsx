import { useQuery } from "@tanstack/react-query";
import type { NextPage } from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import { gqlClient } from "../../services/graphql";
import {
  getSdk,
  IssuesWithRewardsQuery,
  WorkflowStatesQuery,
} from "../../__generated__/graphql-operations";
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Text,
} from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { trpc } from "../../utils/trpc";
import { IconPencil, IconTrash } from "@tabler/icons";

const Rewards: NextPage = () => {
  const { data: session } = useSession();
  const gql = getSdk(gqlClient);
  const { data: issuesWithRewardsData } = useQuery(
    ["issuesWithRewards"],
    async () => {
      const data = await gql.IssuesWithRewards(
        {},
        { Authorization: session?.accessToken || "" }
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
        { Authorization: session?.accessToken || "" }
      );

      return data;
    },
    { enabled: !!session?.token.accessToken }
  );

  const { mutate: updateRewardMutate } = trpc.issues.updateReward.useMutation(
    {}
  );
  const { mutate: deleteRewardMutate } = trpc.issues.deleteReward.useMutation(
    {}
  );

  const [updateRewardModalOpened, setUpdateRewardModalOpened] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<
    IssuesWithRewardsQuery["issues"]["nodes"][0] | null
  >(null);

  if (session) {
    return (
      <>
        Signed in as {session.user.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
        <div>
          <h1>Issues With Rewards</h1>
          {issuesWithRewardsData?.issues.nodes.map((item, index) => (
            <Group key={index}>
              <Text>{item.title}</Text>
              <ActionIcon
                onClick={() => {
                  setSelectedIssue(item);
                  setUpdateRewardModalOpened(true);
                }}
              >
                <IconPencil />
              </ActionIcon>
              <ActionIcon
                onClick={() => {
                  const rewardId = item.attachments.nodes.find(
                    (item) => item.title === "Acknowledge"
                  )?.metadata.rewardId;

                  deleteRewardMutate({ rewardId });
                }}
              >
                <IconTrash />
              </ActionIcon>
            </Group>
          ))}
        </div>
        <UpdateRewardModal
          opened={updateRewardModalOpened}
          onClose={() => {
            setUpdateRewardModalOpened(false);
            setSelectedIssue(null);
          }}
          issue={selectedIssue}
          onSubmit={(values) => {
            setUpdateRewardModalOpened(false);
            const rewardId = selectedIssue!.attachments.nodes.find(
              (item) => item.title === "Acknowledge"
            )?.metadata.rewardId;

            if (rewardId) {
              updateRewardMutate({
                rewardId,
                points: values.points,
                targetStateId: values.targetStateId,
              });
            }
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

interface UpdateRewardModalProps {
  onClose: () => void;
  opened: boolean;
  issue: IssuesWithRewardsQuery["issues"]["nodes"][0] | null;
  onSubmit: (values: UpdateRewardModalFormValues) => void;
  workflowStates?: WorkflowStatesQuery["workflowStates"]["edges"];
}

interface UpdateRewardModalFormValues {
  points: number;
  targetStateId: string;
}

const UpdateRewardModal = (props: UpdateRewardModalProps) => {
  const form = useForm<UpdateRewardModalFormValues>({
    defaultValues: {
      points: 0,
      targetStateId: "",
    },
  });
  const { reset } = form;

  const handleSubmission = (values: UpdateRewardModalFormValues) => {
    props.onSubmit(values);
    form.reset({ points: 0 });
  };

  const metadata = useMemo(
    () =>
      props.issue?.attachments.nodes.find(
        (item) => item.title === "Acknowledge"
      )?.metadata,
    [props.issue]
  );

  useEffect(() => {
    if (props.issue && metadata) {
      reset({
        points: metadata!.points,
        targetStateId: metadata.targetStateId,
      });
    }
  }, [props.issue, metadata, reset]);

  return (
    <Modal
      onClose={props.onClose}
      opened={props.opened}
      closeOnClickOutside={false}
    >
      <form onSubmit={form.handleSubmit(handleSubmission)}>
        <Text>Update reward for: {props.issue?.title}</Text>
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

export default Rewards;
