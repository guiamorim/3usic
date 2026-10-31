import { describe, expect, it } from 'vitest';
import { installPlatform, shouldShowInstallHint } from '../../src/domain/install';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36';

describe('install hint', () => {
  it('detects iPhone, iPad (desktop UA with touch) and Android', () => {
    expect(installPlatform({ userAgent: IPHONE, maxTouchPoints: 5 })).toBe('ios');
    expect(installPlatform({ userAgent: IPAD, maxTouchPoints: 5 })).toBe('ios');
    expect(installPlatform({ userAgent: IPAD, maxTouchPoints: 0 })).toBe('other');
    expect(installPlatform({ userAgent: ANDROID, maxTouchPoints: 5 })).toBe('android');
  });

  it('shows only in a mobile browser tab, not installed, not dismissed', () => {
    expect(shouldShowInstallHint({ userAgent: IPHONE, maxTouchPoints: 5, standalone: false }, false)).toBe('ios');
    expect(shouldShowInstallHint({ userAgent: IPHONE, maxTouchPoints: 5, standalone: true }, false)).toBeNull();
    expect(shouldShowInstallHint({ userAgent: IPHONE, maxTouchPoints: 5, standalone: false }, true)).toBeNull();
    expect(shouldShowInstallHint({ userAgent: IPAD, maxTouchPoints: 0, standalone: false }, false)).toBeNull();
  });
});
