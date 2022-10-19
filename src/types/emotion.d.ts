import "@emotion/react";
import { MantineTheme } from "@mantine/core";
import { themeOverride } from "../styles/theme";

type MergedTheme = MantineTheme & typeof themeOverride;

declare module "@emotion/react" {
  export interface Theme extends MergedTheme {}
}
