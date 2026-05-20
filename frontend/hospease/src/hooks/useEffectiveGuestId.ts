import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { guestsApi } from '../api/guests';

/**
 * Resolves the current guest user's guestId, creating the profile if needed.
 *
 * Uses the backend's idempotent /v1/guests/upsert endpoint so a fresh login
 * (e.g. demo Guest account) is never blocked by missing profile state — one
 * call always returns a valid guestId for ACTIVE guests.
 */
export function useEffectiveGuestId() {
  const { user, guestId } = useAuthStore();
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Use the stored guestId if available; otherwise resolve via upsert.
  const effectiveGuestId = guestId ?? resolvedId ?? null;

  const needsResolve = !effectiveGuestId
    && user?.role === 'GUEST'
    && !!user?.email
    && !!user?.name;

  useEffect(() => {
    if (!needsResolve) return;
    let cancelled = false;
    setResolving(true);
    setError(null);

    guestsApi
      .upsert({ name: user!.name, email: user!.email })
      .then((guest) => {
        if (cancelled) return;
        setResolvedId(guest.guestId);
        // Persist so other pages (and future sessions) skip the round-trip
        useAuthStore.setState({ guestId: guest.guestId });
      })
      .catch((err) => {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

        // Map common HTTP states to user-friendly copy without losing the
        // backend's actual message, which is invaluable when something is
        // genuinely wrong server-side.
        let userMsg: string;
        if (status === 401 || status === 403) {
          userMsg = 'Your session expired. Please sign in again.';
        } else if (status === 400) {
          userMsg = msg ?? 'Your profile data was rejected. Please check your account details.';
        } else if (status === 404) {
          userMsg = 'Guest service did not find a route. The backend may not be running the latest build.';
        } else if (status === 502 || status === 503) {
          userMsg = 'The guest service is unreachable. Please make sure all backend services are running.';
        } else if (status === 500) {
          userMsg = msg ?? 'The guest service crashed while creating your profile. Check the server logs.';
        } else if (!status) {
          userMsg = 'Cannot reach the API gateway (port 8765). Check that it is running.';
        } else {
          userMsg = msg ?? `Profile setup failed (HTTP ${status}).`;
        }
        setError(userMsg);
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });

    return () => {
      cancelled = true;
    };
  }, [needsResolve, user?.email, user?.name, attempt]);

  return {
    effectiveGuestId,
    resolving,
    failed: !effectiveGuestId && !resolving && !!error,
    error,
    retry: () => {
      setError(null);
      setAttempt((a) => a + 1);
    },
  };
}
