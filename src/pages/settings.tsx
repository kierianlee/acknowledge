import {
  Box,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  TextInput,
  Title,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { ReactElement } from "react";
import { Controller, useForm } from "react-hook-form";
import DefaultLayout from "../components/layouts/default/default-layout";
import { showErrorNotification } from "../utils/errors";
import { trpc } from "../utils/trpc";

interface ConfigFormValues {
  apiKey: string;
}

const Settings = () => {
  const configForm = useForm<ConfigFormValues>({
    defaultValues: { apiKey: "" },
  });

  const { mutate: setApiKeyMutation, isLoading: setApiKeyLoading } =
    trpc.organization.setApiKey.useMutation({
      onError: showErrorNotification,
      onSuccess: () => {
        showNotification({
          title: "Success",
          message: "API key successfully set",
          color: "green",
        });
        configForm.reset();
      },
    });

  const handleConfigFormSubmission = (values: ConfigFormValues) => {
    setApiKeyMutation({ apiKey: values.apiKey });
  };

  return (
    <Box p="lg">
      <Title order={2} weight={500} mb="xl">
        Settings
      </Title>
      <Card
        component="form"
        onSubmit={configForm.handleSubmit(handleConfigFormSubmission)}
      >
        <Title order={5} mb="xl" weight={500}>
          Configuration
        </Title>
        <Grid>
          <Grid.Col span={12}>
            <Controller
              control={configForm.control}
              name="apiKey"
              render={({
                field: { value, onChange },
                fieldState: { error },
              }) => (
                <TextInput
                  value={value}
                  onChange={onChange}
                  placeholder="Enter API Key..."
                  size="xs"
                  error={!!error}
                  label="API Key"
                  required
                />
              )}
              rules={{ required: true }}
            />
          </Grid.Col>
        </Grid>
        <Divider my="xl" />
        <Group>
          <Button size="xs" type="submit" loading={setApiKeyLoading}>
            Save
          </Button>
        </Group>
      </Card>
    </Box>
  );
};

export default Settings;

Settings.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
