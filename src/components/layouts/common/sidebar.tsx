import {
  createStyles,
  Navbar,
  TextInput,
  Code,
  UnstyledButton,
  Text,
  Group,
  Avatar,
  Stack,
  Menu,
} from "@mantine/core";
import {
  IconCheckbox,
  IconSearch,
  IconPodium,
  IconHeartHandshake,
  IconMessage,
  IconLogout,
  IconSettings,
} from "@tabler/icons";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useAuthStore } from "../../../stores/auth";
import { getInitials } from "../../../utils/string";
import Image from "next/future/image";
import { useRouter } from "next/router";
import { useMemo } from "react";

const useStyles = createStyles((theme) => ({
  navbar: {
    paddingTop: 0,
  },

  logo: {
    height: "30px",
    width: "auto",
  },

  section: {
    marginLeft: -theme.spacing.md,
    marginRight: -theme.spacing.md,
    marginBottom: theme.spacing.md,

    "&:not(:last-of-type)": {
      borderBottom: `1px solid ${
        theme.colorScheme === "dark"
          ? theme.colors.dark[4]
          : theme.colors.gray[3]
      }`,
    },
  },

  searchCode: {
    fontWeight: 700,
    fontSize: 10,
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.dark[7]
        : theme.colors.gray[0],
    border: `1px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[2]
    }`,
  },

  mainLinks: {
    paddingLeft: theme.spacing.md - theme.spacing.xs,
    paddingRight: theme.spacing.md - theme.spacing.xs,
    paddingBottom: theme.spacing.md,
  },

  mainLink: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    fontSize: theme.fontSizes.xs,
    padding: `8px ${theme.spacing.xs}px`,
    borderRadius: theme.radius.sm,
    fontWeight: 500,
  },

  mainLinkInner: {
    display: "flex",
    alignItems: "center",
    flex: 1,
  },

  mainLinkIcon: {
    marginRight: theme.spacing.sm,
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[2]
        : theme.colors.gray[6],
  },

  mainLinkBadge: {
    padding: 0,
    width: 20,
    height: 20,
    pointerEvents: "none",
  },
}));

export function Sidebar() {
  const { classes } = useStyles();
  const auth = useAuthStore();
  const router = useRouter();

  const links = useMemo(
    () => [
      { icon: IconCheckbox, label: "Issues", path: "/issues" },
      { icon: IconPodium, label: "Leaderboard", path: "/leaderboard" },
      { icon: IconHeartHandshake, label: "Acknowledge", path: "/acknowledge" },
      { icon: IconMessage, label: "Feed", path: "/feed" },
      ...(auth.linearUser?.admin
        ? [{ icon: IconSettings, label: "Settings", path: "/settings" }]
        : []),
    ],
    [auth.linearUser]
  );

  const mainLinks = links.map((link) => (
    <Link passHref href={link.path} key={link.label}>
      <UnstyledButton
        className={classes.mainLink}
        component="a"
        sx={(theme) => ({
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[6]
              : router.pathname === link.path
              ? theme.colors.gray[2]
              : "#fff",
          color:
            theme.colorScheme === "dark"
              ? theme.colors.dark[0]
              : router.pathname === link.path
              ? theme.black
              : theme.colors.gray[7],
          "&:hover": {
            backgroundColor:
              theme.colorScheme === "dark"
                ? theme.colors.dark[6]
                : router.pathname === link.path
                ? theme.colors.gray[2]
                : theme.colors.gray[0],
            color: theme.colorScheme === "dark" ? theme.white : theme.black,
          },
        })}
      >
        <div className={classes.mainLinkInner}>
          <link.icon size={20} className={classes.mainLinkIcon} stroke={1.5} />
          <span>{link.label}</span>
        </div>
        {/* {link.notifications && (
          <Badge size="sm" variant="filled" className={classes.mainLinkBadge}>
            {link.notifications}
          </Badge>
        )} */}
      </UnstyledButton>
    </Link>
  ));

  return (
    <Navbar width={{ sm: 300 }} p="md" className={classes.navbar}>
      <Navbar.Section className={classes.section} p="md" pt={0}>
        <Link href="/" passHref>
          <a>
            <Image
              src="/logo.svg"
              width="0"
              height="0"
              className={classes.logo}
              alt="Acknowledge"
            />
          </a>
        </Link>
      </Navbar.Section>

      <TextInput
        placeholder="Search"
        size="xs"
        icon={<IconSearch size={12} stroke={1.5} />}
        rightSectionWidth={70}
        rightSection={<Code className={classes.searchCode}>Ctrl + K</Code>}
        styles={{ rightSection: { pointerEvents: "none" } }}
        mb="sm"
      />

      <Navbar.Section className={classes.section} sx={{ flex: "1" }}>
        <div className={classes.mainLinks}>{mainLinks}</div>
      </Navbar.Section>

      <Navbar.Section className={classes.section} px="md" mb={0}>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <UnstyledButton>
              <Group>
                <Avatar size={40} color="blue" radius="xl">
                  {getInitials(auth.linearUser?.name || "")}
                </Avatar>
                <Stack spacing={4}>
                  <Text size="sm" inline weight={500}>
                    {auth.linearUser?.name}
                  </Text>
                  <Text size="xs" color="dark" inline>
                    {auth.linearUser?.organization.name}
                  </Text>
                  <Text size="xs" color="dimmed" inline>
                    {auth.account?.points} points
                  </Text>
                </Stack>
              </Group>
            </UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              color="red"
              icon={<IconLogout size={14} />}
              onClick={() => {
                signOut();
              }}
            >
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Navbar.Section>
    </Navbar>
  );
}
