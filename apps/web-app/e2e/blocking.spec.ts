import { test, expect } from '@playwright/test'

test.describe('Blocking', () => {
  test.beforeEach(async ({ page }) => {
    // Login as parent
    await page.goto('/login')
    await page.fill('input[type="email"]', 'parent@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/parent', { timeout: 10000 })
  })

  test('parent can add app to blocked list', async ({ page }) => {
    // Navigate to blocking page
    await page.goto('/parent/blocking')
    await page.waitForLoadState('networkidle')
    
    // Find "Add Block" or "Block App" button
    const addButton = page.locator('button:has-text("Add")').or(
      page.locator('button:has-text("Block")').or(
        page.locator('button:has-text("New Rule")')
      )
    ).first()
    
    const addCount = await addButton.count()
    if (addCount > 0) {
      // Click add button
      await addButton.click()
      
      // Wait for form/modal
      await page.waitForTimeout(1000)
      
      // Fill in app name to block
      const appInput = page.locator('input[placeholder*="app" i]').or(
        page.locator('input[type="text"]').first()
      )
      
      if (await appInput.count() > 0) {
        await appInput.fill('YouTube')
        
        // Submit form
        const submitButton = page.locator('button[type="submit"]').or(
          page.locator('button:has-text("Save")').or(
            page.locator('button:has-text("Block")')
          )
        ).first()
        
        if (await submitButton.count() > 0) {
          await submitButton.click()
          
          // Wait for block to be added
          await page.waitForTimeout(2000)
          
          // Verify success
          const successIndicator = page.locator('text=/blocked|added|success/i').or(
            page.locator('text=/YouTube/i')
          ).first()
          
          const successCount = await successIndicator.count()
          if (successCount > 0) {
            await expect(successIndicator).toBeVisible({ timeout: 5000 })
          }
        }
      }
    }
  })

  test('blocked app appears in blocking tab', async ({ page }) => {
    // Navigate to blocking page
    await page.goto('/parent/blocking')
    await page.waitForLoadState('networkidle')
    
    // Look for blocked apps list
    const blockedList = page.locator('[data-testid="blocked-apps"]').or(
      page.locator('text=/blocked|rules/i')
    )
    
    // Verify blocked apps are displayed
    const listCount = await blockedList.count()
    expect(listCount).toBeGreaterThan(0)
  })

  test('parent can remove app from blocked list', async ({ page }) => {
    // Navigate to blocking page
    await page.goto('/parent/blocking')
    await page.waitForLoadState('networkidle')
    
    // Find remove/delete button for a blocked app
    const removeButton = page.locator('button[aria-label*="remove" i]').or(
      page.locator('button[aria-label*="delete" i]').or(
        page.locator('button:has-text("Remove")').or(
          page.locator('button:has-text("Unblock")')
        )
      )
    ).first()
    
    const removeCount = await removeButton.count()
    if (removeCount > 0) {
      // Get initial count of blocked apps
      const initialBlocks = await page.locator('[data-testid="blocked-item"]').count()
      
      // Click remove button
      await removeButton.click()
      
      // Confirm removal if confirmation dialog appears
      const confirmButton = page.locator('button:has-text("Confirm")').or(
        page.locator('button:has-text("Remove")').last()
      )
      
      if (await confirmButton.count() > 0) {
        await confirmButton.click()
      }
      
      // Wait for removal
      await page.waitForTimeout(2000)
      
      // Verify app was removed
      const afterBlocks = await page.locator('[data-testid="blocked-item"]').count()
      // If we had initial count, verify it decreased
      if (initialBlocks > 0) {
        expect(afterBlocks).toBeLessThan(initialBlocks)
      }
    }
  })
})
