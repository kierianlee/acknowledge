import create from "zustand";
import { devtools, persist } from "zustand/middleware";
import { MeQuery } from "../__generated__/graphql-operations";

type Auth = MeQuery["viewer"];

interface AuthState {
  user: Auth | null;
  setUser: (auth: Auth) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      setUser: (auth) => set((state) => ({ user: auth })),
    }),
    {
      name: "auth",
    }
  )
);
