import {
  Box,
  Button,
  Divider,
  Grid,
  Group,
  Modal,
  NumberInput,
  Select,
  Textarea,
} from "@mantine/core";
import { Controller, useForm } from "react-hook-form";
import { useAuthStore } from "../../stores/auth";
import { UsersQuery } from "../../__generated__/graphql-operations";

interface CreateAcknowledgementModalProps {
  onClose: () => void;
  opened: boolean;
  onSubmit: (values: CreateAcknowledgementModalFormValues) => void;
  users?: UsersQuery["users"]["nodes"];
  loading: boolean;
}

export interface CreateAcknowledgementModalFormValues {
  message: string;
  value: number;
  linearUserId: string;
}

const CreateAcknowledgementModal = ({
  opened,
  onClose,
  onSubmit,
  users,
  loading,
}: CreateAcknowledgementModalProps) => {
  const auth = useAuthStore();

  const form = useForm<CreateAcknowledgementModalFormValues>({
    defaultValues: {
      linearUserId: "",
      message: "",
      value: undefined,
    },
  });

  return (
    <Modal
      opened={opened}
      onClose={() => {
        onClose();
        form.reset();
      }}
      title="Acknowledge teammate"
    >
      <Box component="form" onSubmit={form.handleSubmit(onSubmit)}>
        <Grid>
          <Grid.Col span={12}>
            <Controller
              control={form.control}
              name="linearUserId"
              render={({
                field: { value, onChange },
                fieldState: { error },
              }) => (
                <Select
                  label="Teammate"
                  value={value}
                  onChange={onChange}
                  placeholder="Select user..."
                  data={
                    users?.map((item) => ({
                      label: item.name,
                      value: item.id,
                    })) || []
                  }
                  size="xs"
                  required
                  error={!!error}
                />
              )}
              rules={{ required: true }}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Controller
              control={form.control}
              name="value"
              render={({
                field: { value, onChange },
                fieldState: { error },
              }) => (
                <NumberInput
                  label="Points"
                  value={value}
                  onChange={onChange}
                  placeholder="Enter points..."
                  size="xs"
                  required
                  error={!!error}
                  min={1}
                  max={auth.account?.points || 0}
                />
              )}
              rules={{ required: true }}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Controller
              control={form.control}
              name="message"
              render={({
                field: { value, onChange },
                fieldState: { error },
              }) => (
                <Textarea
                  label="Message"
                  value={value}
                  onChange={onChange}
                  placeholder="Enter message..."
                  size="xs"
                  required
                  error={!!error}
                />
              )}
              rules={{ required: true }}
            />
          </Grid.Col>
        </Grid>
        <Divider my="lg" />
        <Group position="right">
          <Button size="xs" loading={loading} type="submit">
            Submit
          </Button>
        </Group>
      </Box>
    </Modal>
  );
};

export default CreateAcknowledgementModal;
