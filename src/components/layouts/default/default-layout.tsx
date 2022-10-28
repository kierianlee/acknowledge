import { ReactNode } from "react";
import styled from "@emotion/styled";
import { Sidebar } from "../common/sidebar";
import OnboardingModal from "../../modals/onboarding";
import { useOrganizationStore } from "../../../stores/organization";
import { trpc } from "../../../utils/trpc";
import { showErrorNotification } from "../../../utils/errors";
import { Loader } from "@mantine/core";
import { useSession } from "next-auth/react";

const DefaultLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const session = useSession();
  const { setApiKeySet, apiKeySet } = useOrganizationStore();

  const { isLoading: organizationApiKeySetLoading } =
    trpc.organization.apiKeySet.useQuery(undefined, {
      onError: showErrorNotification,
      onSuccess: (apiKeySet) => setApiKeySet(apiKeySet),
    });

  if (organizationApiKeySetLoading) {
    return (
      <LoadingContainer>
        <Loader size="xl" />
      </LoadingContainer>
    );
  }

  return (
    <Root>
      <OnboardingModal
        opened={!apiKeySet && session.status === "authenticated"}
      />
      <Container>
        <Sidebar />
        <Content>{children}</Content>
      </Container>
    </Root>
  );
};

export default DefaultLayout;

const Root = styled.div({
  position: "relative",
  display: "flex",
  flexDirection: "column",
});
const Container = styled.div({
  flex: "1",
  display: "flex",
});
const Content = styled.div({
  flex: "1",
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  overflowY: "scroll",
  background: "#F4F5F8",
});
const LoadingContainer = styled.div({
  height: "100vh",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});
