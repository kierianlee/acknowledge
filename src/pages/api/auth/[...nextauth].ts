import NextAuth, { NextAuthOptions, User } from "next-auth";
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
            organizationId: payload.data.viewer.organization.id,
          };
        },
      },
      profile: (profile) => {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          organizationId: profile.organizationId,
        };
      },
    },
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      return true;
    },
    async redirect({ url, baseUrl }) {
      return baseUrl;
    },
    async session({ session, user, token }) {
      const typedUser = user as User & {
        accessToken: string;
        organizationId: string;
      };

      return {
        ...session,
        token,
        accessToken: typedUser.accessToken,
        organizationId: typedUser.organizationId,
      };
    },
    async jwt({ token }) {
      return token;
    },
  },
};
export default NextAuth(authOptions);
