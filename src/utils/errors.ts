import { showNotification } from "@mantine/notifications";

export const showErrorNotification = (error: unknown) => {
  if (error instanceof Error) {
    showNotification({
      title: "Error",
      message: error.message,
      color: "red",
    });
  }
};
