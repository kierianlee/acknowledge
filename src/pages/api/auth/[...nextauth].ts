import NextAuth, { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
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
            query: `query Me { viewer { id name email } }`,
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
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
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
      return { ...session, token };
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      if (account) {
        token.accessToken = account.access_token;
        token.id = profile?.sub;
      }
      return token;
    },
  },
};
export default NextAuth(authOptions);
