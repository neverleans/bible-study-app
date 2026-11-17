import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$api/client', () => ({
  api: {
    getMe: vi.fn(),
    refreshToken: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    createNote: vi.fn(),
    upsertHighlight: vi.fn(),
    markChapterRead: vi.fn(),
    claimGuestData: vi.fn(),
  },
}));
vi.mock('$stores/user', () => ({ getCurrentUserId: () => 'guest-uuid' }));

import { api } from '$api/client';
import { initAuth, login, currentUser, getStoredAccessToken, getStoredRefreshToken, saveTokens } from './auth';
import { get } from 'svelte/store';

function stubLocalStorage() {
  const data = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
  });
}

const user = { id: 'u1', email: 'a@b.c', provider: 'local', createdAt: '2026-01-01T00:00:00.000Z' };

describe('initAuth session refresh', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    stubLocalStorage();
    currentUser.set(null);
  });

  // Regression: the API only returns a new access token on /auth/refresh. The client used to
  // save `undefined` as the refresh token, which broke the next refresh.
  it('keeps the existing refresh token when only the access token is renewed', async () => {
    saveTokens('expired-access', 'old-refresh');
    vi.mocked(api.getMe)
      .mockRejectedValueOnce(new Error('401'))
      .mockResolvedValueOnce(user);
    vi.mocked(api.refreshToken).mockResolvedValue({ accessToken: 'new-access' });

    await initAuth();

    expect(api.refreshToken).toHaveBeenCalledWith('old-refresh');
    expect(getStoredAccessToken()).toBe('new-access');
    expect(getStoredRefreshToken()).toBe('old-refresh');
    expect(get(currentUser)).toEqual(user);
  });

  it('clears the session when the refresh token is rejected', async () => {
    saveTokens('expired-access', 'bad-refresh');
    vi.mocked(api.getMe).mockRejectedValue(new Error('401'));
    vi.mocked(api.refreshToken).mockRejectedValue(new Error('401'));

    await initAuth();

    expect(getStoredAccessToken()).toBeNull();
    expect(getStoredRefreshToken()).toBeNull();
    expect(get(currentUser)).toBeNull();
  });
});

describe('login brings guest study data into the account', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    stubLocalStorage();
    currentUser.set(null);
    vi.mocked(api.login).mockResolvedValue({ accessToken: 'a', refreshToken: 'r', user });
  });

  it('claims the data kept under the guest id before the session is shown as signed in', async () => {
    let signedInWhenClaimed: boolean | null = null;
    vi.mocked(api.claimGuestData).mockImplementation(async () => {
      signedInWhenClaimed = get(currentUser) !== null;
      return { quizAttempts: 2, reviewCards: 1, reflections: 1 };
    });

    await login('a@b.c', 'secret');

    expect(api.claimGuestData).toHaveBeenCalledWith('guest-uuid');
    expect(signedInWhenClaimed).toBe(false);
    expect(get(currentUser)).toEqual(user);
  });

  it('still signs in when the claim fails', async () => {
    vi.mocked(api.claimGuestData).mockRejectedValue(new Error('500'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await login('a@b.c', 'secret');

    expect(get(currentUser)).toEqual(user);
  });
});
