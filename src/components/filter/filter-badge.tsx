import { ActionIcon, Badge } from "@mantine/core";
import { IconX } from "@tabler/icons";
import { type FilterValue } from "./filter-input";

export interface FilterBadgeProps {
  value: FilterValue;
  onRemove: (value: FilterValue) => void;
}

const FilterBadge = ({ value, onRemove }: FilterBadgeProps) => {
  return (
    <Badge
      rightSection={
        <ActionIcon
          size="xs"
          color="blue"
          radius="xl"
          variant="transparent"
          onClick={() => onRemove(value)}
        >
          <IconX color="#fff" />
        </ActionIcon>
      }
      sx={(theme) => ({
        paddingRight: 3,
        paddingBlock: "14px",
      })}
      variant="filled"
      radius="sm"
    >
      {value.label} {value.query}{" "}
      {value.valueDisplay ?? typeof value.value === "string"
        ? value.value
        : value.value?.valueDisplay ?? value.value?.label ?? value.value?.value}
    </Badge>
  );
};

export { FilterBadge };
