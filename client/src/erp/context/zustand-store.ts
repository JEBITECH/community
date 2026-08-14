import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { persist, createJSONStorage } from "zustand/middleware";
import localforage from "localforage";

export const vanillaStore = createStore(
  persist(
    () => ({
      notifications: [],
    }),
    {
      name: "v-inspect-zustand",
      storage: createJSONStorage(() => localforage),
    }
  )
);

export const useNotificationStore = (selector: any) =>
  useStore(vanillaStore, selector);

export const { getState, setState } = vanillaStore;

export default useNotificationStore;