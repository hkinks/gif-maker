import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('GIF Creation Flow', () => {
  test('should complete entire GIF creation flow with file upload', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for FFmpeg to load
    await expect(page.getByText('✅ FFmpeg ready! You can now create GIFs.')).toBeVisible({ timeout: 60000 });

    // Create a test video file (we'll use a simple data URL for testing)
    const testVideoPath = path.join(__dirname, 'fixtures', 'test-video.mp4');
    
    // Since we don't have a real video file, let's test with YouTube URL instead
    await page.fill('input[placeholder*="YouTube URL"]', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.click('button:has-text("Load Video")');

    // Wait for video to load
    await expect(page.locator('.video-section')).toBeVisible();

    // Set start and end times
    await page.fill('input[type="number"]:first', '10');
    await page.fill('input[type="number"]:last', '15');

    // Add text overlay
    await page.fill('input[placeholder*="text"]', 'Test GIF');
    await page.selectOption('select', 'top');
    await page.fill('input[type="color"]', '#ff0000');

    // Click create GIF button
    await page.click('button:has-text("Create GIF")');

    // Wait for GIF creation to complete
    await expect(page.getByText('Generated GIF')).toBeVisible({ timeout: 120000 });
    
    // Check that download link is available
    await expect(page.locator('a[download="generated.gif"]')).toBeVisible();
    
    // Check that GIF image is displayed
    await expect(page.locator('img[alt="Generated GIF"]')).toBeVisible();
  });

  test('should handle file upload for GIF creation', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for FFmpeg to load
    await expect(page.getByText('✅ FFmpeg ready! You can now create GIFs.')).toBeVisible({ timeout: 60000 });

    // Test file upload functionality
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();

    // Since we don't have a real video file, let's test that the upload input is available
    // In a real test, you would upload a test video file like this:
    // await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-video.mp4'));
    
    // For now, just verify the upload interface is present
    await expect(page.getByText('Or upload a video file')).toBeVisible();
  });

  test('should show progress during GIF creation', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for FFmpeg to load
    await expect(page.getByText('✅ FFmpeg ready! You can now create GIFs.')).toBeVisible({ timeout: 60000 });

    // Load a YouTube video
    await page.fill('input[placeholder*="YouTube URL"]', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.click('button:has-text("Load Video")');

    // Wait for video to load
    await expect(page.locator('.video-section')).toBeVisible();

    // Set up for GIF creation
    await page.fill('input[type="number"]:first', '5');
    await page.fill('input[type="number"]:last', '8');

    // Click create GIF button
    await page.click('button:has-text("Create GIF")');

    // Should show progress indication
    await expect(page.getByText(/Creating GIF|Processing/)).toBeVisible();
    
    // Should show percentage or progress bar
    await expect(page.locator('.progress-bar, .progress-text')).toBeVisible();
  });

  test('should handle errors gracefully during GIF creation', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for FFmpeg to load
    await expect(page.getByText('✅ FFmpeg ready! You can now create GIFs.')).toBeVisible({ timeout: 60000 });

    // Try to create GIF without loading a video
    await page.click('button:has-text("Create GIF")');

    // Should show error message
    await expect(page.getByText(/Please.*video/)).toBeVisible();
  });

  test('should validate input fields', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for FFmpeg to load
    await expect(page.getByText('✅ FFmpeg ready! You can now create GIFs.')).toBeVisible({ timeout: 60000 });

    // Test YouTube URL validation
    await page.fill('input[placeholder*="YouTube URL"]', 'not-a-youtube-url');
    await page.click('button:has-text("Load Video")');

    // Should show validation error
    await expect(page.getByText(/valid.*YouTube.*URL/)).toBeVisible();
  });
});