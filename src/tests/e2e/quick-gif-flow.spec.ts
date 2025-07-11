import { test, expect } from '@playwright/test';

test.describe('Quick GIF Creation Flow', () => {
  test('should create GIF with minimal steps', async ({ page }) => {
    // Navigate and wait for FFmpeg
    await page.goto('/');
    await expect(page.getByText('✅ FFmpeg ready! You can now create GIFs.')).toBeVisible({ timeout: 60000 });

    // Load YouTube video
    await page.fill('input[placeholder*="YouTube URL"]', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.click('button:has-text("Load Video")');
    await expect(page.locator('.video-section')).toBeVisible();

    // Set clip duration (3 seconds)
    await page.fill('input[type="number"]:first', '10');
    await page.fill('input[type="number"]:last', '13');

    // Add text
    await page.fill('input[placeholder*="text"]', 'Quick Test');

    // Create GIF
    await page.click('button:has-text("Create GIF")');
    await expect(page.getByText('Generated GIF')).toBeVisible({ timeout: 120000 });
    await expect(page.locator('a[download="generated.gif"]')).toBeVisible();
  });
});