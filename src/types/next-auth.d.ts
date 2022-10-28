import NextAuth, { DefaultSession, Profile as DefaultProfile } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    account: {
      id: string;
      accessToken: string;
      providerAccountId: string;
      organizationId: string;
    };
    token: JWT;
  }

  interface Profile extends DefaultProfile {}
}
