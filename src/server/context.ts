import { inferAsyncReturnType } from "@trpc/server";
import { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";

interface CreateContextOptions {
  session: Session | null;
}

export async function createContextInner(_opts: CreateContextOptions) {
  return { session: _opts.session };
}

export type Context = inferAsyncReturnType<typeof createContextInner>;

export async function createContext(
  opts: CreateNextContextOptions
): Promise<Context> {
  const session = await getSession({ req: opts.req });

  return await createContextInner({ session });
}
