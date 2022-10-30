import { inferProcedureOutput } from "@trpc/server";
import create from "zustand";
import { devtools } from "zustand/middleware";
import { AppRouter } from "../server/routers/_app";
import { MeQuery } from "../__generated__/graphql-operations";

type Auth = MeQuery["viewer"];

interface AuthState {
  linearUser: Auth | null;
  setLinearUser: (auth: Auth | null) => void;
  account: inferProcedureOutput<AppRouter["accounts"]["me"]> | null;
  setAccount: (
    auth: inferProcedureOutput<AppRouter["accounts"]["me"]> | null
  ) => void;
  loaded: boolean;
  setLoaded: (loaded: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      linearUser: null,
      setLinearUser: (auth) => set((state) => ({ linearUser: auth })),
      account: null,
      setAccount: (auth) => set((state) => ({ account: auth })),
      loaded: false,
      setLoaded: (loaded) => set((state) => ({ loaded })),
    }),
    {
      name: "auth",
    }
  )
);
