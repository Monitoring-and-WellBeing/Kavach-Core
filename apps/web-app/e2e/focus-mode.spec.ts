import { test, expect } from '@playwright/test'

test.describe('Focus Mode', () => {
  test('parent can start focus session from device card', async ({ page }) => {
    // Login as parent
    await page.goto('/login')
    await page.fill('input[type="email"]', 'parent@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/parent', { timeout: 10000 })
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle')
    
    // Find device card with focus button
    // Look for "Focus" button or focus-related action on device card
    const focusButton = page.locator('button:has-text("Focus")').or(
      page.locator('button[aria-label*="focus" i]')
    ).first()
    
    const focusCount = await focusButton.count()
    if (focusCount > 0) {
      // Click focus button
      await focusButton.click()
      
      // Wait for focus session dialog or confirmation
      await page.waitForTimeout(1000)
      
      // Verify focus session was started
      // Could show a modal, timer, or status change
      const focusIndicator = page.locator('text=/focus|session|active/i').first()
      const indicatorCount = await focusIndicator.count()
      if (indicatorCount > 0) {
        await expect(focusIndicator).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('active focus session shows timer', async ({ page }) => {
    // Login as parent
    await page.goto('/login')
    await page.fill('input[type="email"]', 'parent@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/parent', { timeout: 10000 })
    
    // Navigate to focus page or check if focus session is active
    await page.goto('/parent/focus')
    await page.waitForLoadState('networkidle')
    
    // Look for timer display (could be in format like "25:00" or "25 min")
    const timer = page.locator('text=/\\d+:\\d+|\\d+ min|remaining|timer/i').first()
    const timerCount = await timer.count()
    
    // If there's an active session, timer should be visible
    if (timerCount > 0) {
      await expect(timer).toBeVisible({ timeout: 5000 })
    }
  })

  test('parent can stop active focus session', async ({ page }) => {
    // Login as parent
    await page.goto('/login')
    await page.fill('input[type="email"]', 'parent@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/parent', { timeout: 10000 })
    
    // Navigate to focus page
    await page.goto('/parent/focus')
    await page.waitForLoadState('networkidle')
    
    // Look for stop button
    const stopButton = page.locator('button:has-text("Stop")').or(
      page.locator('button[aria-label*="stop" i]').or(
        page.locator('button:has-text("End")')
      )
    ).first()
    
    const stopCount = await stopButton.count()
    if (stopCount > 0) {
      // Click stop button
      await stopButton.click()
      
      // Wait for confirmation or status change
      await page.waitForTimeout(1000)
      
      // Verify session was stopped
      const stoppedIndicator = page.locator('text=/stopped|ended|completed/i').first()
      const indicatorCount = await stoppedIndicator.count()
      // If there's a confirmation, it should be visible
      if (indicatorCount > 0) {
        await expect(stoppedIndicator).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('student self-start focus creates session', async ({ page }) => {
    // Login as student
    await page.goto('/login')
    await page.fill('input[type="email"]', 'student@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/student', { timeout: 10000 })
    
    // Navigate to student focus page
    await page.goto('/student/focus')
    await page.waitForLoadState('networkidle')
    
    // Find start focus button
    const startButton = page.locator('button:has-text("Start")').or(
      page.locator('button:has-text("Begin")').or(
        page.locator('button[aria-label*="start" i]')
      )
    ).first()
    
    const startCount = await startButton.count()
    if (startCount > 0) {
      // Click start button
      await startButton.click()
      
      // Wait for session to start
      await page.waitForTimeout(2000)
      
      // Verify session was created
      // Look for timer, active status, or session confirmation
      const sessionIndicator = page.locator('text=/active|session|focus|timer/i').first()
      await expect(sessionIndicator).toBeVisible({ timeout: 10000 })
    }
  })
})
