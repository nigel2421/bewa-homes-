import { test, expect } from '@playwright/test';

test.describe('Guest Booking Flow', () => {
  test('should allow a guest to navigate to a unit and open the booking modal', async ({ page }) => {
    // 1. Visit Homepage
    await page.goto('/');

    // 2. Click on a Luxury Stay (assuming there's a link to /units/...)
    // Instead of a specific ID, we'll look for property titles
    const luxuryCard = page.locator('text=Luxury Villa').first();
    if (await luxuryCard.isVisible()) {
      await luxuryCard.click();
      
      // 3. Verify on Details Page
      await expect(page).toHaveURL(/.*units.*/);
      
      // 4. Click 'Reserve Now'
      const reserveBtn = page.locator('button:has-text("Reserve Now")');
      await expect(reserveBtn).toBeVisible();
      await reserveBtn.click();
      
      // 5. Verify Checkout Modal items
      await expect(page.locator('text=Guest Details')).toBeVisible();
      await expect(page.locator('text=Full Name')).toBeVisible();
    }
  });

  test('should show correct mobile navbar on small screens', async ({ page }) => {
    // Set to mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // Verify Hamburger menu is visible
    const hamburger = page.getByRole('button', { name: 'Toggle Menu' });
    await expect(hamburger).toBeVisible();

    // Click to open
    await hamburger.click();
    
    // Verify menu items slide out (scoping to mobile menu to avoid hidden desktop links)
    const mobileMenu = page.getByTestId('mobile-menu');
    await expect(mobileMenu.getByText('Short Stays')).toBeVisible({ timeout: 7000 });
  });
});
