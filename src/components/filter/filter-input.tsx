import {
  Box,
  Button,
  Group,
  Menu,
  Text,
  TextInput,
  Stack,
  useMantineTheme,
} from "@mantine/core";
import { useMemo, useState } from "react";
import { BlankIcon } from "./icons/blank";
import { ContainsIcon } from "./icons/contains";
import { EqualsIcon } from "./icons/equals";
import Select, { SingleValue, StylesConfig, ThemeConfig } from "react-select";

enum InputType {
  TEXT = "text",
  SELECT = "selecf",
}

enum QueryType {
  CONTAINS = "contains",
  EQUALS = "equals",
}

enum DataType {
  ID = "id",
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
  DATE = "date",
  OBJECT = "object",
}

export type SelectItem = SingleValue<{
  label: string;
  value: any;
  valueDisplay?: string;
}>;

export interface FilterInputOption {
  label: string;
  accessor: string;
  input: InputType;
  options?: SelectItem[];
  queries: QueryType[];
  type: DataType;
}

export interface FilterValue {
  label: string;
  accessor: string;
  query: QueryType;
  value: string | SelectItem;
  valueDisplay?: string;
  type: DataType;
}

interface FilterInputProps {
  options: FilterInputOption[];
  onSubmit: (value: FilterValue) => void;
}

const getQueryIcon = (type?: QueryType) => {
  const style = {
    fill: "#768191",
    width: "16px",
    height: "16px",
  };

  switch (type) {
    case QueryType.CONTAINS: {
      return <ContainsIcon style={style} />;
    }
    case QueryType.EQUALS: {
      return <EqualsIcon style={style} />;
    }
    default:
      return <BlankIcon style={style} />;
  }
};

const FilterInput = ({ options, onSubmit }: FilterInputProps) => {
  const [selectedOption, setSelectedOption] = useState<FilterInputOption>();
  const [value, setValue] = useState<FilterValue["value"]>("");
  const [query, setQuery] = useState<QueryType>();
  const theme = useMantineTheme();

  const selectStyles: StylesConfig<SelectItem, false> = useMemo(
    () => ({
      option: (provided) => ({
        ...provided,
        fontSize: "13px",
        padding: "6px 12px",
      }),
      container: (provided) => ({
        ...provided,
        flex: "1",
      }),
      control: (provided) => ({
        ...provided,
        borderColor: theme.colors.gray[3],
        fontSize: "13px",
        width: "100%",
        minHeight: "0px",
      }),
      input: (provided) => ({ ...provided, margin: 0 }),
      noOptionsMessage: (provided) => ({ ...provided, fontSize: "13px" }),
      dropdownIndicator: (provided) => ({
        ...provided,
        paddingBlock: 0,
      }),
    }),
    [theme]
  );

  const selectTheme: ThemeConfig = (selectTheme) => ({
    ...selectTheme,
    colors: {
      ...selectTheme.colors,
      primary: theme.colors[theme.primaryColor][6],
      primary75: theme.colors[theme.primaryColor][3],
      primary50: theme.colors[theme.primaryColor][2],
      primary25: theme.colors[theme.primaryColor][1],
    },
  });

  return (
    <Stack spacing={4}>
      <Group noWrap>
        <Select
          styles={selectStyles}
          theme={selectTheme}
          options={options.map(({ label, accessor }) => ({
            label,
            value: accessor,
          }))}
          onChange={(val) => {
            const option = options.find((item) => item.accessor === val?.value);

            setSelectedOption(option);
            setQuery(option?.queries[0]);
          }}
          placeholder="Select"
        />
        <Menu withinPortal={false}>
          <Menu.Target>
            <Button
              size="xs"
              styles={{ root: { width: "30px", padding: "0" } }}
              disabled={!selectedOption}
              variant="light"
            >
              {getQueryIcon(query)}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            {selectedOption?.queries.map((query, index) => (
              <Menu.Item onClick={() => setQuery(query)} key={index}>
                <Group align="center">
                  <Box>{getQueryIcon(query)}</Box>
                  <Text size="xs">{query}</Text>
                </Group>
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
        {selectedOption ? (
          <>
            {selectedOption.input === InputType.TEXT && (
              <TextInput
                placeholder="Enter value"
                size="xs"
                value={value as string}
                onChange={(event) => setValue(event.currentTarget.value)}
              />
            )}
            {selectedOption.input === InputType.SELECT && (
              <Select
                placeholder="Select value"
                theme={selectTheme}
                styles={selectStyles}
                options={selectedOption?.options || []}
                onChange={(val) => setValue(val!)}
              />
            )}
          </>
        ) : (
          <TextInput disabled size="xs" />
        )}
      </Group>
      <Button
        size="xs"
        fullWidth
        onClick={() => {
          if (selectedOption) {
            onSubmit({
              label: selectedOption.label,
              accessor: selectedOption.accessor,
              ...(selectedOption.input === InputType.SELECT
                ? {
                    valueDisplay: selectedOption.options?.find(
                      (item) => item?.value === value
                    )?.label,
                  }
                : {}),
              value,
              query: query!,
              type: selectedOption.type,
            });
          }
        }}
      >
        Submit
      </Button>
    </Stack>
  );
};

export { FilterInput, InputType, QueryType, DataType };
