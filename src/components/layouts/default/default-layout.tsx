import { ReactNode } from "react";
import styled from "@emotion/styled";
import { Sidebar } from "../common/sidebar";

const DefaultLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <Root>
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
