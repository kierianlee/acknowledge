import {
  createStyles,
  Header as MantineHeader,
  Container,
  Group,
  UnstyledButton,
  Avatar,
  Text,
  Stack,
} from "@mantine/core";
import { signOut } from "next-auth/react";
import Image from "next/future/image";
import Link from "next/link";
import { useAuthStore } from "../../../stores/auth";
import { getInitials } from "../../../utils/string";

const HEADER_HEIGHT = 60;

const useStyles = createStyles((theme) => ({
  root: {
    position: "relative",
    zIndex: 1,
  },

  logo: {
    height: "30px",
    width: "auto",
  },

  dropdown: {
    position: "absolute",
    top: HEADER_HEIGHT,
    left: 0,
    right: 0,
    zIndex: 0,
    borderTopRightRadius: 0,
    borderTopLeftRadius: 0,
    borderTopWidth: 0,
    overflow: "hidden",

    [theme.fn.largerThan("sm")]: {
      display: "none",
    },
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
  },

  links: {
    [theme.fn.smallerThan("sm")]: {
      display: "none",
    },
  },

  burger: {
    [theme.fn.largerThan("sm")]: {
      display: "none",
    },
  },

  link: {
    display: "block",
    lineHeight: 1,
    padding: "8px 12px",
    borderRadius: theme.radius.sm,
    textDecoration: "none",
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[0]
        : theme.colors.gray[7],
    fontSize: theme.fontSizes.sm,
    fontWeight: 500,

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
    },

    [theme.fn.smallerThan("sm")]: {
      borderRadius: 0,
      padding: theme.spacing.md,
    },
  },

  linkActive: {
    "&, &:hover": {
      backgroundColor: theme.fn.variant({
        variant: "light",
        color: theme.primaryColor,
      }).background,
      color: theme.fn.variant({ variant: "light", color: theme.primaryColor })
        .color,
    },
  },
}));

interface HeaderResponsiveProps {}

const Header = ({}: HeaderResponsiveProps) => {
  const { classes } = useStyles();
  const auth = useAuthStore();

  return (
    <MantineHeader height={HEADER_HEIGHT} className={classes.root}>
      <Container className={classes.header} fluid>
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

        <UnstyledButton onClick={() => signOut()}>
          <Group>
            <Avatar size={40} color="blue" radius="xl">
              {getInitials(auth.user?.name || "")}
            </Avatar>
            <Stack spacing={4}>
              <Text size="sm" inline>
                {auth.user?.name}
              </Text>
              <Text size="xs" color="dimmed" inline>
                {auth.linearUser?.organization.name}
              </Text>
            </Stack>
          </Group>
        </UnstyledButton>

        {/*
            Mantine Bug: https://github.com/mantinedev/mantine/issues/2609

            Implement below when fixed.
        */}
        {/* <Menu shadow="md" width={200}>
          <Menu.Target>
            <UnstyledButton>
              <Group>
                <Avatar size={40} color="blue" radius="xl">
                  {getInitials(auth.user?.name || "")}
                </Avatar>
                <Stack spacing={4}>
                  <Text size="sm" inline>
                    {auth.user?.name}
                  </Text>
                  <Text size="xs" color="dimmed" inline>
                    {auth.user?.organization.name}
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
        </Menu> */}
      </Container>
    </MantineHeader>
  );
};

export default Header;
