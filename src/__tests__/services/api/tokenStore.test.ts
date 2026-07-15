import { tokenStore } from '@/services/api/tokenStore';

describe('tokenStore', () => {
  afterEach(() => {
    tokenStore.clearAccessToken();
  });

  test('starts without an access token', () => {
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(tokenStore.getAuthHeaders()).toEqual({});
  });

  test('stores an access token and formats auth headers', () => {
    tokenStore.setAccessToken('abc123');

    expect(tokenStore.getAccessToken()).toBe('abc123');
    expect(tokenStore.getAuthHeaders()).toEqual({
      Authorization: 'Bearer abc123',
    });
  });

  test('clears the access token', () => {
    tokenStore.setAccessToken('abc123');
    tokenStore.clearAccessToken();

    expect(tokenStore.getAccessToken()).toBeNull();
    expect(tokenStore.getAuthHeaders()).toEqual({});
  });

  test('accepts null through setAccessToken as a reset path', () => {
    tokenStore.setAccessToken('abc123');
    tokenStore.setAccessToken(null);

    expect(tokenStore.getAccessToken()).toBeNull();
  });
});
