import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  tenantId: string | null;
  role: string | null;
  email: string | null;
  stationId: string | null;
  isAuthenticated: boolean;
  login: (data: {
    accessToken: string;
    userId: string;
    tenantId: string;
    role: string;
    email: string;
    stationId?: string;
  }) => void;
  logout: () => void;
  setStationId: (stationId: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  userId: null,
  tenantId: null,
  role: null,
  email: null,
  stationId: null,
  isAuthenticated: false,
  login: (data) =>
    set({
      accessToken: data.accessToken,
      userId: data.userId,
      tenantId: data.tenantId,
      role: data.role,
      email: data.email,
      stationId: data.stationId ?? null,
      isAuthenticated: true,
    }),
  logout: () =>
    set({
      accessToken: null,
      userId: null,
      tenantId: null,
      role: null,
      email: null,
      stationId: null,
      isAuthenticated: false,
    }),
  setStationId: (stationId) => set({ stationId }),
}));
