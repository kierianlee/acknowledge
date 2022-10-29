import { SpotlightAction } from "@mantine/spotlight";
import {
  IconCheckbox,
  IconHeartHandshake,
  IconMessage,
  IconPodium,
  IconSettings,
} from "@tabler/icons";
import { NextRouter } from "next/router";

const spotlightActions: (router: NextRouter) => SpotlightAction[] = (
  router
) => [
  {
    title: "Issues",
    description: "View and manage rewards for issues",
    onTrigger: () => router.push("/issues"),
    icon: <IconCheckbox size={18} />,
  },
  {
    title: "Leaderboard",
    description: "View points amongst teammates",
    onTrigger: () => router.push("/leaderboard"),
    icon: <IconPodium size={18} />,
  },
  {
    title: "Acknowledge",
    description: "View given or received acknowledgement from teammates",
    onTrigger: () => router.push("/acknowledge"),
    icon: <IconHeartHandshake size={18} />,
  },
  {
    title: "Feed",
    description: "View a timeline of team activity",
    onTrigger: () => router.push("/feed"),
    icon: <IconMessage size={18} />,
  },
  {
    title: "Settings",
    description: "Manage organization settings",
    onTrigger: () => router.push("/settings"),
    icon: <IconSettings size={18} />,
  },
];

export { spotlightActions };
