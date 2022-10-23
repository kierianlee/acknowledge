import { FilterBadge } from "./filter-badge";
import { FilterMenu } from "./filter-menu";
import { FilterInput, FilterValue } from "./filter-input";
import { isEqual } from "lodash";

const Filter = {
  Badge: FilterBadge,
  Menu: FilterMenu,
  Input: FilterInput,
};

const removeFilterFromFilterList = (
  value: FilterValue,
  list: FilterValue[]
) => {
  return list.filter((item) => {
    return !isEqual(value, item);
  });
};

export default Filter;
export {
  DataType,
  type FilterInputOption,
  type FilterValue,
  InputType,
  QueryType,
} from "./filter-input";
export { removeFilterFromFilterList };
