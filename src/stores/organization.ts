import create from "zustand";
import { devtools } from "zustand/middleware";

interface OrganizationState {
  apiKeySet: boolean;
  setApiKeySet: (apiKeySet: boolean) => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  devtools(
    (set) => ({
      apiKeySet: false,
      setApiKeySet: (apiKeySet) => set((state) => ({ apiKeySet })),
    }),
    {
      name: "organization",
    }
  )
);
