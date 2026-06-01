import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authApi, ROLE_MAP, type AuthResponse } from '../api/auth';
import { guestsApi } from '../api/guests';


function resolveUserId(data: AuthResponse): string | null {
  const candidates = [data.userId, data.user_id, data.id];
  for (const c of candidates) {
    if (c === undefined || c === null) continue;
    const s = String(c).trim();
    if (s === '' || s === 'undefined' || s === 'null' || s === 'NaN') continue;
    return s;
  }

  console.warn('[authStore] login/register response had no usable user id:', data);
  return null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  guestId: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

// Resolve guestId by email; auto-creates the guest profile if not yet registered in guest-service
async function resolveGuestId(email: string, name: string): Promise<string | null> {
  try {
    const guest = await guestsApi.getByEmail(email);
    return guest.guestId;
  } catch {
    try {
      // phone intentionally omitted – guest can fill it in from their profile page
      const created = await guestsApi.create({ name, email });
      return created.guestId;
    } catch {
      return null;
    }
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      guestId: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          const data = await authApi.login(email, password);

          // Reject unknown backend roles loudly instead of silently coercing
          // to GUEST (S-M1/S-M5). Otherwise a typo or misconfigured user role
          // lands the operator in the guest portal with no explanation.
          if (!ROLE_MAP[data.role]) {
            return {
              success: false,
              error: `Server returned an unknown role '${data.role}'. Ask an administrator to fix this account's role.`,
            };
          }
          const frontendRole = ROLE_MAP[data.role];

          const resolvedId = resolveUserId(data);
          if (!resolvedId) {
            return {
              success: false,
              error: 'Login succeeded but the server did not return a valid user id. Please contact support.',
            };
          }
          const user: User = {
            id: resolvedId,
            name: data.name,
            email: data.email,
            role: frontendRole,
            createdAt: new Date().toISOString(),
          };

          // Persist the JWT *before* calling resolveGuestId so the
          // axios interceptor can attach it to the guest-service request.
          set({ token: data.token });

          const guestId = frontendRole === 'GUEST'
            ? await resolveGuestId(email, data.name)
            : null;

          set({ user, guestId, isAuthenticated: true });
          return { success: true };

        } catch (apiErr: unknown) {
          const status = (apiErr as { response?: { status?: number } })?.response?.status;
          const msg = (apiErr as { response?: { data?: { message?: string } } })
            ?.response?.data?.message;

          if (status === 401 || status === 403) {
            return { success: false, error: msg ?? 'Invalid email or password.' };
          }
          if (status === 500) {
            return { success: false, error: 'Server error. Please check if all backend services are running.' };
          }
          // Network / gateway down
          return { success: false, error: 'Cannot reach the server. Please check if the backend is running on port 8765.' };
        }
      },

      register: async (name, email, phone, password) => {
        try {
          const data = await authApi.register({ name, email, phone, password, role: 'GUEST' });
          const frontendRole = ROLE_MAP[data.role] ?? 'GUEST';
          const resolvedId = resolveUserId(data);
          if (!resolvedId) {
            return {
              success: false,
              error: 'Registration succeeded but the server did not return a valid user id. Please contact support.',
            };
          }
          const user: User = {
            id: resolvedId,
            name: data.name,
            email: data.email,
            role: frontendRole,
            createdAt: new Date().toISOString(),
          };
          // Set the JWT before calling guest-service so the request is authenticated.
          set({ token: data.token });

          // Create the guest profile. Phone validation on backend requires 7-20 chars
          // when present, so retry without phone if the first attempt fails. This is
          // the SINGLE place where a new guest's profile gets created during signup
          // — it must succeed for the user to be able to book rooms immediately.
          let guestId: string | null = null;
          const normalizedPhone = phone.replace(/[\s\-().]/g, '') || undefined;
          const phoneOk = !!normalizedPhone && normalizedPhone.length >= 7 && normalizedPhone.length <= 20;
          try {
            const guest = await guestsApi.create({
              name,
              email,
              phone: phoneOk ? normalizedPhone : undefined,
            });
            guestId = guest.guestId;
          } catch {
            // Retry once without phone — most common failure mode is phone validation.
            try {
              const guest = await guestsApi.create({ name, email });
              guestId = guest.guestId;
            } catch {
              // If still failing the guest might already exist (e.g. previous registration);
              // try resolving by email as a last resort.
              try {
                const existing = await guestsApi.getByEmail(email);
                guestId = existing.guestId;
              } catch {
                // useEffectiveGuestId will retry on first guest-area page load.
              }
            }
          }
          set({ user, guestId, isAuthenticated: true });
          return { success: true };
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          if (status === 409) return { success: false, error: 'An account with this email already exists.' };
          if (status === 400) return { success: false, error: msg ?? 'Invalid registration details.' };
          if (status === 500) return { success: false, error: 'Server error. Please check that all backend services are running.' };
          return { success: false, error: msg ?? 'Registration failed. Please check your network and try again.' };
        }
      },

      logout: () => {
        authApi.logout().catch(() => {});
        set({ user: null, token: null, guestId: null, isAuthenticated: false });
      },
    }),
    {
      name: 'hospease-auth',
      partialize: (state: AuthState) => ({
        user: state.user,
        token: state.token,
        guestId: state.guestId,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
