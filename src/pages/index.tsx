import styled from "@emotion/styled";
import { Button, Center, Group, Stack, Text } from "@mantine/core";
import { GetServerSideProps } from "next";
import { getSession, signIn } from "next-auth/react";
import { NextPageWithLayout } from "./_app";
import Image from "next/future/image";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (session) {
    return {
      redirect: {
        permanent: false,
        destination: "/issues",
      },
      props: {},
    };
  }

  return {
    props: {},
  };
};

const Home: NextPageWithLayout = () => {
  return (
    <Center
      sx={{
        height: "100vh",
        background: "linear-gradient(rgb(44, 45, 60) 0%, rgb(25, 26, 35) 50%)",
      }}
    >
      <Stack align="center">
        <AcknowledgeLogo
          src="/logo-light.svg"
          width="0"
          height="0"
          alt="Acknowledge"
        />
        <Text color="rgb(210, 211, 224)" weight={500} size="xl" mb="sm" mt="lg">
          Log in to Acknowledge
        </Text>
        <Button
          sx={{
            background: "rgb(87, 91, 199)",
            "&:hover": {
              background: "rgb(102, 107, 226)",
            },
          }}
          onClick={() => signIn("linear")}
          size="lg"
          styles={{
            inner: {
              paddingInline: "2rem",
            },
          }}
        >
          <Group spacing={12}>
            <LinearLogo src="/linear.svg" />
            <Text size="sm">Continue with Linear</Text>
          </Group>
        </Button>
      </Stack>
    </Center>
  );
};

const LinearLogo = styled.img({
  height: "24px",
});
const AcknowledgeLogo = styled(Image)({
  height: "50px",
  width: "auto",
});

export default Home;
