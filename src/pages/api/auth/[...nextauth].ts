import NextAuth, { NextAuthOptions, Session, User } from "next-auth";
import { prisma } from "../../../services/prisma";
import { CustomPrismaAdapter } from "../../../utils/custom-prisma-adapter";

export const authOptions: NextAuthOptions = {
  adapter: CustomPrismaAdapter(prisma),
  providers: [
    {
      id: "linear",
      name: "Linear",
      type: "oauth",
      version: "2.0",
      checks: "state",
      authorization: {
        url: "https://linear.app/oauth/authorize",
        params: {
          response_type: "code",
          scope: "read,write",
          actor: "user",
        },
      },
      allowDangerousEmailAccountLinking: true,
      token: "https://api.linear.app/oauth/token",
      clientId: process.env.NEXT_PUBLIC_LINEAR_CLIENT_ID,
      clientSecret: process.env.LINEAR_CLIENT_SECRET,
      userinfo: {
        async request({ tokens }) {
          const endpoint = "https://api.linear.app/graphql";
          const headers = {
            "content-type": "application/json",
            Authorization: tokens.access_token!,
          };
          const graphqlQuery = {
            operationName: "Me",
            query: `query Me { viewer { id name email admin organization { id } } }`,
            variables: {},
          };

          const options = {
            method: "POST",
            headers: headers,
            body: JSON.stringify(graphqlQuery),
          };

          const response = await fetch(endpoint, options);
          const payload = await response.json();

          return {
            sub: payload.data.viewer.id,
            name: payload.data.viewer.name,
            email: payload.data.viewer.email,
          };
        },
      },
      profile: (profile) => {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
        };
      },
    },
  ],
  callbacks: {
    async signIn(params) {
      if (params.account) {
        const account = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: params.account.provider,
              providerAccountId: params.account.providerAccountId,
            },
          },
          include: {
            user: true,
          },
        });

        if (account) {
          await prisma.account.update({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            data: {
              access_token: params.account.access_token,
              expires_at: params.account.expires_at,
              scope: params.account.scope,
              token_type: params.account.token_type,
            },
          });
        }

        if (account && !params.user.email && params.profile) {
          await prisma.user.update({
            where: {
              id: account.user.id,
            },
            data: {
              email: params.profile.email,
              name: params.profile.name,
            },
          });
        }

        return true;
      }

      return false;
    },
    async redirect({ url, baseUrl }) {
      return baseUrl;
    },
    async session({ session, user, token }) {
      const typedUser = user as User & {
        account: {
          id: string;
          accessToken: string;
          providerAccountId: string;
          organizationId: string;
        };
      };

      return {
        user: {
          id: user.id,
          email: user.email,
          image: user.image,
          name: user.name,
        },
        account: typedUser.account,
        token,
      } as Session;
    },
  },
};
export default NextAuth(authOptions);
