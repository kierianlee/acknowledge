import {
  Box,
  Group,
  ThemeIcon,
  Text,
  Stack,
  Avatar,
  useMantineTheme,
} from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconHeartHandshake } from "@tabler/icons";
import { forwardRef, useMemo } from "react";
import dayjs from "dayjs";
import { useAuthStore } from "../../stores/auth";
import { inferProcedureOutput } from "@trpc/server";
import { AppRouter } from "../../server/routers/_app";
import { getInitials } from "../../utils/string";

interface AcknowledgementCardProps {
  transaction: inferProcedureOutput<
    AppRouter["transactions"]["myTransactions"]
  >["items"][0];
}

const AcknowledgementCard = forwardRef<
  HTMLDivElement,
  AcknowledgementCardProps
>(function AcknowledgementCard({ transaction }, ref) {
  const auth = useAuthStore();
  const isBeneficiary = transaction.beneficiary.id === auth.account?.id;
  const theme = useMantineTheme();

  const title = useMemo(
    () =>
      isBeneficiary
        ? `Received +${transaction.value} points from ${transaction.benefactor.user.name}`
        : `Gave -${transaction.value} points to ${transaction.beneficiary.user.name}`,
    [transaction, isBeneficiary]
  );

  return (
    <Box
      sx={(theme) => ({
        borderRadius: theme.radius.md,
        marginBottom: "1rem",
        position: "relative",
        background: "#fff",
        shadow: theme.shadows.xl,
      })}
      p="xl"
      ref={ref}
    >
      <Group>
        {isBeneficiary ? (
          <ThemeIcon color="grape" variant="light">
            <IconArrowUp />
          </ThemeIcon>
        ) : (
          <ThemeIcon color="gray" variant="light">
            <IconArrowDown />
          </ThemeIcon>
        )}
        <Box sx={{ flex: "1" }}>
          <Stack spacing={6}>
            <Text weight={500} size="md">
              {title}
            </Text>
            <Text color="dimmed" size="xs">
              {transaction.message}
            </Text>
            <Group mt="md">
              <Group>
                <Avatar size="sm" radius="xl">
                  {getInitials(transaction.benefactor.user.name || "")}
                </Avatar>
                <Text size="xs">{transaction.benefactor.user.name}</Text>
              </Group>
              <IconHeartHandshake color={theme.colors.gray[5]} />
              <Group>
                <Avatar size="sm" radius="xl">
                  {getInitials(transaction.beneficiary.user.name || "")}
                </Avatar>
                <Text size="xs">{transaction.beneficiary.user.name}</Text>
              </Group>
            </Group>
          </Stack>
        </Box>
        <Box>
          <Text color="dimmed" size="xs">
            {dayjs(transaction.createdAt).format("hh:mm A, DD MMM YYYY")}
          </Text>
        </Box>
      </Group>
    </Box>
  );
});

export default AcknowledgementCard;
