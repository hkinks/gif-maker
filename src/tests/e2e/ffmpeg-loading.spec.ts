import { test, expect } from '@playwright/test';

test.describe('FFmpeg Loading', () => {
  test('should load FFmpeg successfully from CDN', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Check initial loading state
    await expect(page.getByText('🔄 Loading FFmpeg for video processing...')).toBeVisible();
    
    // Wait for FFmpeg to load successfully (up to 60 seconds)
    await expect(page.getByText('✅ FFmpeg ready! You can now create GIFs.')).toBeVisible({ timeout: 60000 });

    // Check that the loading message is gone
    await expect(page.getByText('🔄 Loading FFmpeg for video processing...')).not.toBeVisible();
  });

  test('should show error message if FFmpeg fails to load', async ({ page }) => {
    // Block all network requests to simulate network failure
    await page.route('**/*', route => route.abort());

    // Navigate to the app
    await page.goto('/');

    // Should show loading initially
    await expect(page.getByText('🔄 Loading FFmpeg for video processing...')).toBeVisible();

    // Should show error message after timeout
    await expect(page.locator('.ffmpeg-status.error')).toBeVisible({ timeout: 60000 });
    await expect(page.getByText(/Failed to load FFmpeg/)).toBeVisible();
  });

  test('should handle stuck loading scenario - CDN timeout issue', async ({ page }) => {
    const consoleMessages: string[] = [];
    const networkRequests: string[] = [];
    
    // Track console messages
    page.on('console', msg => {
      if (msg.text().includes('[FFmpeg]')) {
        consoleMessages.push(msg.text());
      }
    });

    // Track network requests and simulate slow/hanging CDN
    page.on('request', request => {
      networkRequests.push(request.url());
    });

    // Intercept FFmpeg CDN requests and make them hang
    await page.route('**/ffmpeg-core.js', route => {
      // Simulate hanging request - never respond
      return new Promise(() => {});
    });

    await page.route('**/ffmpeg-core.wasm', route => {
      // Simulate hanging request - never respond
      return new Promise(() => {});
    });

    // Navigate to the app
    await page.goto('/');

    // Should show loading initially
    await expect(page.getByText('🔄 Loading FFmpeg for video processing...')).toBeVisible();

    // Wait for timeout (30 seconds as per our implementation)
    await page.waitForTimeout(35000);

    // Should eventually show error or try fallback
    await expect(page.locator('.ffmpeg-status')).toBeVisible({ timeout: 10000 });
    
    // Check that console logs show timeout attempts
    expect(consoleMessages.some(msg => msg.includes('Attempting to load from'))).toBe(true);
    expect(consoleMessages.some(msg => msg.includes('Loading timeout') || msg.includes('Failed to load from'))).toBe(true);

    // Verify CDN URLs were attempted
    expect(networkRequests.some(url => url.includes('ffmpeg-core.js'))).toBe(true);
  });

  test('should try multiple CDN fallbacks when first one fails', async ({ page }) => {
    const consoleMessages: string[] = [];
    let unpkgAttempted = false;
    let jsdelivrAttempted = false;
    
    page.on('console', msg => {
      if (msg.text().includes('[FFmpeg]')) {
        consoleMessages.push(msg.text());
        if (msg.text().includes('unpkg.com')) unpkgAttempted = true;
        if (msg.text().includes('jsdelivr.net')) jsdelivrAttempted = true;
      }
    });

    // Make first CDN fail, allow second to succeed
    await page.route('**/unpkg.com/**', route => route.abort());
    
    await page.goto('/');

    // Should show loading initially
    await expect(page.getByText('🔄 Loading FFmpeg for video processing...')).toBeVisible();

    // Wait for FFmpeg to eventually load from fallback
    await expect(page.getByText('✅ FFmpeg ready! You can now create GIFs.')).toBeVisible({ timeout: 90000 });

    // Verify both CDNs were attempted
    expect(unpkgAttempted).toBe(true);
    expect(jsdelivrAttempted).toBe(true);
    
    // Check success message from fallback
    expect(consoleMessages.some(msg => msg.includes('Successfully loaded from'))).toBe(true);
  });

  test('should detect when app is completely stuck at loading', async ({ page }) => {
    const consoleMessages: string[] = [];
    
    page.on('console', msg => {
      if (msg.text().includes('[FFmpeg]')) {
        consoleMessages.push(msg.text());
      }
    });

    // Block all FFmpeg-related requests to simulate complete failure
    await page.route('**/*ffmpeg*', route => route.abort());

    await page.goto('/');

    // Should show loading initially
    await expect(page.getByText('🔄 Loading FFmpeg for video processing...')).toBeVisible();

    // Wait for a reasonable timeout period
    await page.waitForTimeout(40000);

    // Should still be loading (stuck scenario) or show error
    const isStillLoading = await page.getByText('🔄 Loading FFmpeg for video processing...').isVisible();
    const hasError = await page.locator('.ffmpeg-status.error').isVisible();

    // Either should be stuck loading OR show error - both indicate the issue
    expect(isStillLoading || hasError).toBe(true);

    // If stuck loading, this replicates the original issue
    if (isStillLoading) {
      console.log('✅ Successfully replicated the stuck loading issue!');
      expect(consoleMessages.some(msg => msg.includes('Attempting to load from'))).toBe(true);
    }
  });

  test('should show console logs during FFmpeg loading', async ({ page }) => {
    const consoleMessages: string[] = [];
    
    page.on('console', msg => {
      if (msg.text().includes('[FFmpeg]')) {
        consoleMessages.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait for FFmpeg to load
    await expect(page.getByText('✅ FFmpeg ready! You can now create GIFs.')).toBeVisible({ timeout: 60000 });

    // Check that we got console logs
    expect(consoleMessages.length).toBeGreaterThan(0);
    expect(consoleMessages.some(msg => msg.includes('Attempting to load from'))).toBe(true);
    expect(consoleMessages.some(msg => msg.includes('Successfully loaded from'))).toBe(true);
  });
});