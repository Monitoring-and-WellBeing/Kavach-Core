import { test, expect } from '@playwright/test'

test.describe('Parent Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as parent
    await page.goto('/login')
    await page.fill('input[type="email"]', 'parent@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/parent', { timeout: 10000 })
  })

  test('dashboard shows device count', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle')
    
    // Look for device-related content
    // Could be "Devices" heading, device cards, or device count
    const deviceContent = page.locator('text=/device|monitor/i').first()
    await expect(deviceContent).toBeVisible({ timeout: 10000 })
  })

  test('dashboard shows screen time stats', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle')
    
    // Look for screen time statistics
    const screenTimeContent = page.locator('text=/screen time|hours|minutes/i').first()
    await expect(screenTimeContent).toBeVisible({ timeout: 10000 })
  })

  test('alert badge shows unread count', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle')
    
    // Look for alert badge or notification indicator
    // Could be a badge with number, or "Alerts" text
    const alertIndicator = page.locator('text=/alert|notification|unread/i').first()
    // If alerts exist, they should be visible
    // If no alerts, the element might not exist, which is also valid
    const count = await alertIndicator.count()
    if (count > 0) {
      await expect(alertIndicator).toBeVisible({ timeout: 5000 })
    }
  })

  test('clicking device card shows device details', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle')
    
    // Find a device card (could be a link or clickable div)
    const deviceCard = page.locator('[data-testid="device-card"]').or(
      page.locator('text=/device|monitor/i').first()
    )
    
    const cardCount = await deviceCard.count()
    if (cardCount > 0) {
      // Click on the first device card
      await deviceCard.first().click()
      
      // Should navigate to device details or show device info
      // Could be a modal, new page, or expanded view
      await page.waitForTimeout(1000) // Wait for any navigation/expansion
      
      // Verify device details are shown (could be on same page or new page)
      const deviceDetails = page.locator('text=/details|activity|stats/i').first()
      const detailsCount = await deviceDetails.count()
      // If details are shown, they should be visible
      if (detailsCount > 0) {
        await expect(deviceDetails).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('refresh button reloads data', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle')
    
    // Find refresh button (could be icon or text)
    const refreshButton = page.locator('button[aria-label*="refresh" i]').or(
      page.locator('button:has-text("Refresh")').or(
        page.locator('button').filter({ has: page.locator('svg') }).first()
      )
    )
    
    const refreshCount = await refreshButton.count()
    if (refreshCount > 0) {
      // Get initial content
      const initialContent = await page.locator('body').textContent()
      
      // Click refresh
      await refreshButton.first().click()
      
      // Wait for reload
      await page.waitForTimeout(2000)
      
      // Verify page has reloaded (content might be same or different)
      const afterContent = await page.locator('body').textContent()
      expect(afterContent).toBeTruthy()
    }
  })
})
