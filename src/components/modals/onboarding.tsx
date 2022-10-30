import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Group,
  Modal,
  TextInput,
  Text,
  Stack,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { Controller, useForm } from "react-hook-form";
import { useAuthStore } from "../../stores/auth";
import { useOrganizationStore } from "../../stores/organization";
import { showErrorNotification } from "../../utils/errors";
import { trpc } from "../../utils/trpc";

interface FormValues {
  apiKey: string;
}

interface OnboardingModalProps {
  opened: boolean;
}

const OnboardingModal = ({ opened }: OnboardingModalProps) => {
  const { setApiKeySet } = useOrganizationStore();
  const { linearUser } = useAuthStore();

  const form = useForm<FormValues>({
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
        form.reset();
        setApiKeySet(true);
      },
    });

  const handleFormSubmission = (values: FormValues) => {
    setApiKeyMutation({ apiKey: values.apiKey });
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {}}
      fullScreen
      withCloseButton={false}
      styles={{ body: { height: "100%" } }}
    >
      <Box
        component="form"
        onSubmit={form.handleSubmit(handleFormSubmission)}
        sx={{ height: "100%" }}
      >
        <Container size="xs" sx={{ height: "100%" }}>
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {!linearUser?.admin ? (
              <Box>
                <Text weight={500} size="xl" align="center">
                  Welcome to Acknowledge! 🤝
                </Text>
                <Text size="sm" color="dimmed" align="center">
                  Please log into Acknowledge as a Linear admin to setup the
                  app.
                </Text>
              </Box>
            ) : (
              <Box>
                <Stack align="center" mb="xl">
                  <Text weight={500} size="xl" align="center">
                    Welcome to Acknowledge! 🤝
                  </Text>
                  <Text size="sm" color="dimmed" align="center">
                    To begin, create a personal API key on your workspace and
                    add it below.
                  </Text>
                </Stack>
                <Grid>
                  <Grid.Col span={12}>
                    <Controller
                      control={form.control}
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
                          required
                        />
                      )}
                      rules={{ required: true }}
                    />
                  </Grid.Col>
                </Grid>
                <Divider my="xl" />
                <Group>
                  <Button
                    size="xs"
                    type="submit"
                    loading={setApiKeyLoading}
                    fullWidth
                  >
                    Save
                  </Button>
                </Group>
              </Box>
            )}
          </Box>
        </Container>
      </Box>
    </Modal>
  );
};

export default OnboardingModal;
