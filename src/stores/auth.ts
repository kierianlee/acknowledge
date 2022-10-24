import { inferProcedureOutput } from "@trpc/server";
import create from "zustand";
import { devtools } from "zustand/middleware";
import { AppRouter } from "../server/routers/_app";
import { MeQuery } from "../__generated__/graphql-operations";

type Auth = MeQuery["viewer"];

interface AuthState {
  linearUser: Auth | null;
  setLinearUser: (auth: Auth) => void;
  user: inferProcedureOutput<AppRouter["users"]["me"]> | null;
  setUser: (auth: inferProcedureOutput<AppRouter["users"]["me"]>) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      linearUser: null,
      setLinearUser: (auth) => set((state) => ({ linearUser: auth })),
      user: null,
      setUser: (auth) => set((state) => ({ user: auth })),
    }),
    {
      name: "auth",
    }
  )
);
