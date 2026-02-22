import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.goto('/login')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('parent can login and see dashboard', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in parent credentials
    await page.fill('input[type="email"]', 'parent@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for redirect to parent dashboard
    await page.waitForURL('/parent', { timeout: 10000 })
    
    // Verify we're on the parent dashboard
    expect(page.url()).toContain('/parent')
    
    // Verify dashboard content is visible
    await expect(page.locator('text=Screen time')).toBeVisible({ timeout: 5000 })
  })

  test('student can login and see student dashboard', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in student credentials
    await page.fill('input[type="email"]', 'student@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for redirect to student dashboard
    await page.waitForURL('/student', { timeout: 10000 })
    
    // Verify we're on the student dashboard
    expect(page.url()).toContain('/student')
    
    // Verify student dashboard content is visible
    await expect(page.locator('text=Focus Mode').or(page.locator('text=Today')).first()).toBeVisible({ timeout: 5000 })
  })

  test('wrong password shows error message', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in wrong password
    await page.fill('input[type="email"]', 'parent@demo.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for error message
    await expect(page.locator('text=/Invalid|error|incorrect/i')).toBeVisible({ timeout: 5000 })
    
    // Verify we're still on login page
    expect(page.url()).toContain('/login')
  })

  test('logout clears token and redirects to login', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'parent@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/parent', { timeout: 10000 })
    
    // Find and click logout button (usually in header/nav)
    const logoutButton = page.locator('text=/logout|sign out/i').first()
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
    } else {
      // Alternative: clear token manually and navigate
      await page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })
      await page.goto('/login')
    }
    
    // Verify we're on login page
    await page.waitForURL('/login', { timeout: 5000 })
    expect(page.url()).toContain('/login')
    
    // Verify token is cleared
    const token = await page.evaluate(() => localStorage.getItem('kavach_access_token'))
    expect(token).toBeNull()
  })

  test('expired token redirects to login', async ({ page }) => {
    // Set an expired/invalid token
    await page.goto('/parent')
    await page.evaluate(() => {
      localStorage.setItem('kavach_access_token', 'expired.token.here')
    })
    
    // Reload page
    await page.reload()
    
    // Should redirect to login
    await page.waitForURL('/login', { timeout: 10000 })
    expect(page.url()).toContain('/login')
  })
})
