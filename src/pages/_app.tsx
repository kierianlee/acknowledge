import { SessionProvider, SessionProviderProps } from "next-auth/react";
import { AppProps } from "next/app";
import { trpc } from "../utils/trpc";
import { MantineProvider } from "@mantine/core";

const App = ({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<SessionProviderProps>) => {
  return (
    <SessionProvider session={session}>
      <MantineProvider withGlobalStyles withNormalizeCSS>
        <Component {...pageProps} />
      </MantineProvider>
    </SessionProvider>
  );
};

export default trpc.withTRPC(App);
