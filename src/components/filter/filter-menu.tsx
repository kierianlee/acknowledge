import { Button, Menu } from "@mantine/core";
import type { ReactNode } from "react";
import { IconFilter } from "@tabler/icons";
import {
  FilterInput,
  type FilterInputOption,
  type FilterValue,
} from "./filter-input";

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
  return (
    <Menu
      opened={opened}
      onClose={onClose}
      width={150 + 150 + 30 + 16 * 2 + 16 * 2 + 2}
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
