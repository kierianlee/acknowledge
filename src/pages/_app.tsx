import {
  SessionProvider,
  SessionProviderProps,
  useSession,
} from "next-auth/react";
import { AppProps } from "next/app";
import { trpc } from "../utils/trpc";
import { MantineProvider } from "@mantine/core";
import { NextPage } from "next";
import { ReactElement, ReactNode, useEffect } from "react";
import { useAuthStore } from "../stores/auth";
import { useQuery } from "@tanstack/react-query";
import { getSdk } from "../__generated__/graphql-operations";
import { gqlClient } from "../services/graphql";
import { themeOverride } from "../styles/theme";
import { NotificationsProvider } from "@mantine/notifications";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps<SessionProviderProps> & {
  Component: NextPageWithLayout<SessionProviderProps>;
};

function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <SessionProvider session={session}>
      <AuthWrapper>
        <MantineProvider
          withGlobalStyles
          withNormalizeCSS
          withCSSVariables
          theme={themeOverride}
        >
          <NotificationsProvider>
            {getLayout(<Component {...pageProps} />)}
          </NotificationsProvider>
        </MantineProvider>
      </AuthWrapper>
    </SessionProvider>
  );
}

const AuthWrapper = ({ children }: { children: ReactElement }) => {
  const session = useSession();
  const { setLinearUser, setUser } = useAuthStore();
  const gql = getSdk(gqlClient);

  const { data: linearMeData } = useQuery(
    ["me"],
    async () => {
      const data = await gql.Me(
        {},
        { Authorization: session.data?.accessToken || "" }
      );

      return data;
    },
    {
      enabled: !!session.data?.accessToken,
      refetchOnWindowFocus: false,
      retry: false,
    }
  );
  const { data: meData } = trpc.users.me.useQuery(undefined, {
    enabled: !!session.data?.accessToken,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (session.status === "authenticated") {
      if (linearMeData) {
        setLinearUser(linearMeData.viewer);
      }
    }
  }, [session, linearMeData, setLinearUser]);
  useEffect(() => {
    if (session.status === "authenticated") {
      if (meData) {
        setUser(meData);
      }
    }
  }, [session, meData, setUser]);

  return children;
};

export default trpc.withTRPC(App);
