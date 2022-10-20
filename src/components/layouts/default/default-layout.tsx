import { ReactNode } from "react";
import styled from "@emotion/styled";
import { Group } from "@mantine/core";
import { Sidebar } from "../common/sidebar";

const DefaultLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <Root>
      <Group spacing={0} align="flex-start" sx={{ flex: "1" }}>
        <Sidebar />
        <Content>{children}</Content>
      </Group>
    </Root>
  );
};

export default DefaultLayout;

const Root = styled.div({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
});
const Content = styled.div({
  flex: "1",
  display: "flex",
  flexDirection: "column",
});
