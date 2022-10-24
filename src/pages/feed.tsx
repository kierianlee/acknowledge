import { Box, Title } from "@mantine/core";
import { ReactElement } from "react";
import DefaultLayout from "../components/layouts/default/default-layout";

const Feed = () => {
  return (
    <Box p="lg">
      <Title order={2} weight={500} mb="xl">
        Feed
      </Title>
    </Box>
  );
};

export default Feed;

Feed.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
