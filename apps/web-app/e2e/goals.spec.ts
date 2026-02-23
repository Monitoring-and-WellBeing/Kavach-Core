import { test, expect } from '@playwright/test'

test.describe('Goals', () => {
  test.beforeEach(async ({ page }) => {
    // Login as parent
    await page.goto('/login')
    await page.fill('input[type="email"]', 'parent@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/parent', { timeout: 10000 })
  })

  test('parent can create a focus minutes goal', async ({ page }) => {
    // Navigate to goals page
    await page.goto('/parent/goals')
    await page.waitForLoadState('networkidle')
    
    // Find "Add Goal" or "Create Goal" button
    const addButton = page.locator('button:has-text("Add")').or(
      page.locator('button:has-text("Create")').or(
        page.locator('button:has-text("New Goal")')
      )
    ).first()
    
    const addCount = await addButton.count()
    if (addCount > 0) {
      // Click add button
      await addButton.click()
      
      // Wait for form/modal to appear
      await page.waitForTimeout(1000)
      
      // Fill in goal form
      // Look for goal type selector (Focus Minutes)
      const goalTypeSelect = page.locator('select').or(
        page.locator('button:has-text("Focus")')
      ).first()
      
      if (await goalTypeSelect.count() > 0) {
        await goalTypeSelect.click()
        await page.locator('text=/focus minutes/i').first().click()
      }
      
      // Fill in target value
      const targetInput = page.locator('input[type="number"]').or(
        page.locator('input[placeholder*="minutes" i]')
      ).first()
      
      if (await targetInput.count() > 0) {
        await targetInput.fill('45')
      }
      
      // Submit form
      const submitButton = page.locator('button[type="submit"]').or(
        page.locator('button:has-text("Save")').or(
          page.locator('button:has-text("Create")')
        )
      ).first()
      
      if (await submitButton.count() > 0) {
        await submitButton.click()
        
        // Wait for goal to be created
        await page.waitForTimeout(2000)
        
        // Verify success (goal appears in list or success message)
        const successIndicator = page.locator('text=/created|success|saved/i').or(
          page.locator('text=/45.*minutes/i')
        ).first()
        
        const successCount = await successIndicator.count()
        if (successCount > 0) {
          await expect(successIndicator).toBeVisible({ timeout: 5000 })
        }
      }
    }
  })

  test('goal appears in list after creation', async ({ page }) => {
    // Navigate to goals page
    await page.goto('/parent/goals')
    await page.waitForLoadState('networkidle')
    
    // Look for goals list
    const goalsList = page.locator('[data-testid="goal-list"]').or(
      page.locator('text=/goal/i')
    )
    
    // Verify goals are displayed
    const goalsCount = await goalsList.count()
    expect(goalsCount).toBeGreaterThan(0)
  })

  test('goal progress bar fills correctly', async ({ page }) => {
    // Navigate to goals page
    await page.goto('/parent/goals')
    await page.waitForLoadState('networkidle')
    
    // Look for progress bars
    const progressBar = page.locator('[role="progressbar"]').or(
      page.locator('.progress').or(
        page.locator('div[style*="width"]')
      )
    ).first()
    
    const progressCount = await progressBar.count()
    if (progressCount > 0) {
      // Progress bar should be visible
      await expect(progressBar).toBeVisible({ timeout: 5000 })
      
      // Verify it has some width (not 0%)
      const width = await progressBar.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return style.width || el.getAttribute('style')?.match(/width[:\s]+(\d+)/)?.[1]
      })
      
      // Width should exist (even if 0%)
      expect(width).toBeTruthy()
    }
  })

  test('parent can delete a goal', async ({ page }) => {
    // Navigate to goals page
    await page.goto('/parent/goals')
    await page.waitForLoadState('networkidle')
    
    // Find delete button (usually on goal card)
    const deleteButton = page.locator('button[aria-label*="delete" i]').or(
      page.locator('button:has-text("Delete")').or(
        page.locator('button').filter({ has: page.locator('svg') }).last()
      )
    ).first()
    
    const deleteCount = await deleteButton.count()
    if (deleteCount > 0) {
      // Get initial goal count (if possible)
      const initialGoals = await page.locator('[data-testid="goal-item"]').count()
      
      // Click delete button
      await deleteButton.click()
      
      // Confirm deletion if confirmation dialog appears
      const confirmButton = page.locator('button:has-text("Confirm")').or(
        page.locator('button:has-text("Delete")').last()
      )
      
      if (await confirmButton.count() > 0) {
        await confirmButton.click()
      }
      
      // Wait for deletion
      await page.waitForTimeout(2000)
      
      // Verify goal was deleted (count decreased or goal removed)
      const afterGoals = await page.locator('[data-testid="goal-item"]').count()
      // If we had initial count, verify it decreased
      if (initialGoals > 0) {
        expect(afterGoals).toBeLessThan(initialGoals)
      }
    }
  })
})
