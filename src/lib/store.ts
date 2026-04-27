import { create } from "zustand"

export interface KzcUser {
  id: number
  username: string
  balance: number
  vip_level: number
  referral_code: string
}

interface KzcStore {
  user: KzcUser | null
  token: string | null
  setUser: (user: KzcUser) => void
  setToken: (token: string) => void
  updateBalance: (balance: number) => void
  logout: () => void
}

export const useKzcStore = create<KzcStore>((set) => ({
  user: null,
  token: localStorage.getItem("kzc_token"),
  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem("kzc_token", token)
    set({ token })
  },
  updateBalance: (balance) =>
    set((state) => ({ user: state.user ? { ...state.user, balance } : null })),
  logout: () => {
    localStorage.removeItem("kzc_token")
    set({ user: null, token: null })
  },
}))
