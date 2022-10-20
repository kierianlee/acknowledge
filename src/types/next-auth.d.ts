import NextAuth, { DefaultSession, Profile as DefaultProfile } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      organizationId: string;
    } & DefaultSession["user"];
    token: JWT;
    accessToken?: string;
    organizationId?: string;
  }

  interface Profile extends DefaultProfile {
    organizationId: string;
  }
}
