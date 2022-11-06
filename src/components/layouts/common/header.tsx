import {
  createStyles,
  Header as MantineHeader,
  Container,
  UnstyledButton,
  Stack,
  Burger,
  Collapse,
  useMantineTheme,
} from "@mantine/core";
import {
  IconCheckbox,
  IconHeartHandshake,
  IconLogout,
  IconMessage,
  IconPodium,
  IconSettings,
} from "@tabler/icons";
import { signOut } from "next-auth/react";
import Image from "next/future/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { Fragment, useMemo, useState } from "react";
import { useAuthStore } from "../../../stores/auth";

const HEADER_HEIGHT = 60;

const useStyles = createStyles((theme) => ({
  root: {
    position: "relative",
    zIndex: 1,

    [theme.fn.largerThan("sm")]: {
      display: "none",
    },
  },

  logo: {
    height: "25px",
    width: "auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
  },

  menu: {
    background: "#fff",
    shadow: theme.shadows.xl,

    [theme.fn.largerThan("sm")]: {
      display: "none",
    },
  },

  menuButton: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    fontSize: theme.fontSizes.xs,
    padding: `8px ${theme.spacing.xs}px`,
    borderRadius: theme.radius.sm,
    fontWeight: 500,
    "&:not(:last-child)": {
      borderBottom: `1px solid ${theme.colors.gray[3]}`,
    },
  },

  menuButtonInner: {
    display: "flex",
    alignItems: "center",
    flex: 1,
  },

  menuButtonIcon: {
    marginRight: theme.spacing.sm,
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[2]
        : theme.colors.gray[6],
  },
}));

interface HeaderResponsiveProps {}

const Header = ({}: HeaderResponsiveProps) => {
  const { classes } = useStyles();
  const [menuOpened, setMenuOpened] = useState(false);
  const theme = useMantineTheme();
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

  return (
    <Fragment>
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

          <Burger
            opened={menuOpened}
            onClick={() => setMenuOpened((prev) => !prev)}
          />
        </Container>
      </MantineHeader>
      <Collapse in={menuOpened}>
        <Stack className={classes.menu} spacing={0}>
          {links.map((link) => (
            <Link passHref href={link.path} key={link.label}>
              <UnstyledButton
                className={classes.menuButton}
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
                    color:
                      theme.colorScheme === "dark" ? theme.white : theme.black,
                  },
                })}
              >
                <div className={classes.menuButtonInner}>
                  <link.icon
                    size={20}
                    className={classes.menuButtonIcon}
                    stroke={1.5}
                  />
                  <span>{link.label}</span>
                </div>
              </UnstyledButton>
            </Link>
          ))}
          <UnstyledButton
            className={classes.menuButton}
            sx={(theme) => ({
              backgroundColor:
                theme.colorScheme === "dark" ? theme.colors.dark[6] : "#fff",
              color:
                theme.colorScheme === "dark"
                  ? theme.colors.dark[0]
                  : theme.colors.gray[7],
              "&:hover": {
                backgroundColor:
                  theme.colorScheme === "dark"
                    ? theme.colors.dark[6]
                    : theme.colors.gray[0],
                color: theme.colorScheme === "dark" ? theme.white : theme.black,
              },
            })}
            onClick={() => signOut()}
          >
            <div className={classes.menuButtonInner}>
              <IconLogout
                size={20}
                className={classes.menuButtonIcon}
                stroke={1.5}
                style={{ color: theme.colors.red[5] }}
              />
              <span style={{ color: theme.colors.red[5] }}>Logout</span>
            </div>
          </UnstyledButton>
        </Stack>
      </Collapse>
    </Fragment>
  );
};

export default Header;
