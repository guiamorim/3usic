import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useWakeLock } from '../../src/app/wakeLock';

function mockWakeLock(failures: number) {
  let calls = 0;
  const listeners: (() => void)[] = [];
  const sentinel = {
    released: false,
    release: vi.fn(async () => {
      sentinel.released = true;
    }),
    addEventListener: (_: 'release', cb: () => void) => listeners.push(cb),
  };
  const request = vi.fn(async () => {
    calls++;
    if (calls <= failures) throw new DOMException('no activation', 'NotAllowedError');
    sentinel.released = false;
    return sentinel;
  });
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
  return { request, sentinel, systemRelease: () => ((sentinel.released = true), listeners.forEach((l) => l())) };
}

describe('useWakeLock', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'wakeLock');
    vi.useRealTimers();
  });

  it('se o pedido ao abrir for recusado, tenta outra vez no primeiro toque', async () => {
    const wl = mockWakeLock(1);
    const { result } = renderHook(() => useWakeLock(true));
    await waitFor(() => expect(result.current).toBe('failed'));
    await act(async () => {
      document.dispatchEvent(new Event('pointerdown'));
    });
    await waitFor(() => expect(result.current).toBe('on'));
    expect(wl.request).toHaveBeenCalledTimes(2);
  });

  it('volta a pedir quando o sistema liberta o bloqueio com a app visível', async () => {
    const wl = mockWakeLock(0);
    const { result } = renderHook(() => useWakeLock(true));
    await waitFor(() => expect(result.current).toBe('on'));
    act(() => wl.systemRelease());
    await waitFor(() => expect(wl.request).toHaveBeenCalledTimes(2), { timeout: 2000 });
    await waitFor(() => expect(result.current).toBe('on'));
  });
});
