import { Button, Menu, useMantineTheme } from "@mantine/core";
import type { ReactNode } from "react";
import { IconFilter } from "@tabler/icons";
import {
  FilterInput,
  type FilterInputOption,
  type FilterValue,
} from "./filter-input";
import { useMediaQuery } from "@mantine/hooks";

export interface FilterMenuProps {
  onOpen: () => void;
  onClose: () => void;
  onSubmit: (value: FilterValue) => void;
  opened: boolean;
  options: FilterInputOption[];
  target?: (onOpen: () => void) => ReactNode;
}

const FilterMenu = ({
  onClose,
  onOpen,
  onSubmit,
  opened,
  options,
  target,
}: FilterMenuProps) => {
  const theme = useMantineTheme();
  const smallMedia = useMediaQuery(`(max-width: ${theme.breakpoints.sm}px)`);

  return (
    <Menu
      opened={opened}
      onClose={onClose}
      width={smallMedia ? 350 : 450}
      position="bottom"
      withArrow
    >
      <Menu.Target>
        {target ? (
          target(onOpen)
        ) : (
          <Button
            onClick={onOpen}
            variant="light"
            leftIcon={<IconFilter size="16px" />}
          >
            Filter
          </Button>
        )}
      </Menu.Target>
      <Menu.Dropdown>
        <FilterInput
          onSubmit={(value) => {
            onSubmit(value);
            onClose();
          }}
          options={options}
        />
      </Menu.Dropdown>
    </Menu>
  );
};

export { FilterMenu };
