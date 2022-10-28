import type { PrismaClient } from "@prisma/client";
import { Profile } from "next-auth";
import type { Adapter, AdapterAccount } from "next-auth/adapters";
import { gqlClient } from "../services/graphql";
import { getSdk } from "../__generated__/graphql-operations";

export function CustomPrismaAdapter(p: PrismaClient): Adapter {
  return {
    createUser: async (data) => {
      const { ...typedData } = data as unknown as Omit<Profile, "id">;

      const user = await p.user.create({
        data: {
          ...typedData,
        },
      });

      return {
        id: user.id,
        email: user.email!,
        emailVerified: user.emailVerified,
        image: user.image,
        name: user.name,
      };
    },
    getUser: async (id) => {
      const user = await p.user.findUniqueOrThrow({ where: { id } });

      return {
        id: user.id,
        email: user.email!,
        emailVerified: user.emailVerified,
        image: user.image,
        name: user.name,
      };
    },
    getUserByEmail: async (email) => {
      const user = await p.user.findUnique({ where: { email } });

      return user
        ? {
            id: user.id,
            email: user.email!,
            emailVerified: user.emailVerified,
            image: user.image,
            name: user.name,
          }
        : null;
    },
    async getUserByAccount(provider_providerAccountId) {
      const account = await p.account.findUnique({
        where: { provider_providerAccountId },
        select: { user: true },
      });

      return account?.user
        ? {
            id: account.user.id,
            email: account.user.email!,
            emailVerified: account.user.emailVerified,
            image: account.user.image,
            name: account.user.name,
          }
        : null;
    },
    updateUser: async ({ id, ...data }) => {
      const user = await p.user.update({ where: { id }, data });

      return {
        id: user.id,
        email: user.email!,
        emailVerified: user.emailVerified,
        image: user.image,
        name: user.name,
      };
    },
    deleteUser: async (id) => {
      const user = await p.user.delete({ where: { id } });

      return {
        id: user.id,
        email: user.email!,
        emailVerified: user.emailVerified,
        image: user.image,
        name: user.name,
      };
    },
    linkAccount: async (data) => {
      const gql = getSdk(gqlClient);

      const linearOrg = await gql.Organization(undefined, {
        Authorization: data.access_token!,
      });

      let organization = await p.organization.findUnique({
        where: {
          linearId: linearOrg.organization.id,
        },
      });
      if (!organization) {
        organization = await p.organization.create({
          data: {
            linearId: linearOrg.organization.id,
          },
        });
      }

      const account = (await p.account.create({
        data: {
          provider: data.provider,
          providerAccountId: data.providerAccountId,
          type: data.type,
          user: {
            connect: { id: data.userId },
          },
          organization: {
            connect: {
              id: organization.id,
            },
          },
          access_token: data.access_token,
          expires_at: data.expires_at,
          id_token: data.id_token,
          scope: data.scope,
          session_state: data.session_state,
          token_type: data.token_type,
          refresh_token: data.refresh_token,
        },
      })) as unknown as AdapterAccount;

      return account;
    },
    unlinkAccount: (provider_providerAccountId) =>
      p.account.delete({
        where: { provider_providerAccountId },
      }) as unknown as AdapterAccount,
    async getSessionAndUser(sessionToken) {
      const userAndSession = await p.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });

      const account = await p.account.findFirst({
        orderBy: { expires_at: "desc" },
        where: {
          user: {
            id: userAndSession?.user.id,
          },
        },
      });

      if (!userAndSession || !account) return null;

      const { user, ...session } = userAndSession;

      return {
        user: {
          id: user.id,
          email: user.email!,
          emailVerified: user.emailVerified,
          image: user.image,
          name: user.name,
          account: {
            id: account.id,
            accessToken: account.access_token,
            providerAccountId: account.providerAccountId,
            organizationId: account.organizationId,
          },
        },
        session,
      };
    },
    createSession: async (data) => {
      const session = await p.session.create({ data });

      return session;
    },
    updateSession: (data) =>
      p.session.update({ where: { sessionToken: data.sessionToken }, data }),
    deleteSession: (sessionToken) =>
      p.session.delete({ where: { sessionToken } }),
  };
}
