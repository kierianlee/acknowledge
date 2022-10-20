import {
  IconAntennaBars2,
  IconAntennaBars3,
  IconAntennaBars4,
  IconAntennaBars5,
  IconAntennaBarsOff,
} from "@tabler/icons";

export const convertPriorityNumberToLabel = (number: number) => {
  switch (number) {
    case 1:
      return "Urgent";
    case 2:
      return "High";
    case 3:
      return "Medium";
    case 4:
      return "Low";
    default:
      "No priority";
  }
};

export const convertPriorityNumberToIcon = (number: number) => {
  switch (number) {
    case 1:
      return IconAntennaBars5;
    case 2:
      return IconAntennaBars4;
    case 3:
      return IconAntennaBars3;
    case 4:
      return IconAntennaBars2;
    default:
      return IconAntennaBarsOff;
  }
};
