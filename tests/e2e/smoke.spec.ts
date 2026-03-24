import { test, expect } from '@playwright/test'

// Replace 'app-template' with your app ID from appinfo/info.xml
const APP_ID = 'app-template'

test.describe('Smoke tests', () => {
	test('app loads without server errors', async ({ page }) => {
		const response = await page.goto(`/apps/${APP_ID}/`)
		expect(response?.status()).toBeLessThan(500)
	})

	test('sidebar navigation is visible', async ({ page }) => {
		await page.goto(`/apps/${APP_ID}/`)
		const nav = page.locator('#app-navigation, [role="navigation"]').first()
		await expect(nav).toBeVisible()
	})
})
