import type { PrismaClient, Prisma } from "@prisma/client";
import { Profile } from "next-auth";
import type { Adapter, AdapterAccount } from "next-auth/adapters";

export function CustomPrismaAdapter(p: PrismaClient): Adapter {
  return {
    createUser: async (data) => {
      const { organizationId, ...typedData } = data as unknown as Omit<
        Profile,
        "id"
      >;

      let organization = await p.organization.findUnique({
        where: {
          linearId: organizationId,
        },
      });
      if (!organization) {
        organization = await p.organization.create({
          data: {
            linearId: organizationId,
          },
        });
      }
      const user = await p.user.create({
        data: {
          ...typedData,
          organization: {
            connect: {
              id: organization.id,
            },
          },
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
    linkAccount: (data) =>
      p.account.create({ data }) as unknown as AdapterAccount,
    unlinkAccount: (provider_providerAccountId) =>
      p.account.delete({
        where: { provider_providerAccountId },
      }) as unknown as AdapterAccount,
    async getSessionAndUser(sessionToken) {
      const account = await p.account.findFirst({
        where: {
          user: {
            sessions: {
              some: {
                sessionToken: {
                  equals: sessionToken,
                },
              },
            },
          },
        },
      });
      const userAndSession = await p.session.findUnique({
        where: { sessionToken },
        include: { user: true },
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
          accessToken: account?.access_token,
          organizationId: user.organizationId,
        },
        session,
      };
    },
    createSession: (data) => p.session.create({ data }),
    updateSession: (data) =>
      p.session.update({ where: { sessionToken: data.sessionToken }, data }),
    deleteSession: (sessionToken) =>
      p.session.delete({ where: { sessionToken } }),
    async createVerificationToken(data) {
      const verificationToken = await p.verificationToken.create({ data });
      // @ts-expect-errors // MongoDB needs an ID, but we don't
      if (verificationToken.id) delete verificationToken.id;
      return verificationToken;
    },
    async useVerificationToken(identifier_token) {
      try {
        const verificationToken = await p.verificationToken.delete({
          where: { identifier_token },
        });
        // @ts-expect-errors // MongoDB needs an ID, but we don't
        if (verificationToken.id) delete verificationToken.id;
        return verificationToken;
      } catch (error) {
        // If token already used/deleted, just return null
        // https://www.prisma.io/docs/reference/api-reference/error-reference#p2025
        if ((error as Prisma.PrismaClientKnownRequestError).code === "P2025")
          return null;
        throw error;
      }
    },
  };
}
