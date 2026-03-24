import { chromium, type FullConfig } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

async function globalSetup(config: FullConfig) {
	const baseURL = config.projects[0].use.baseURL || 'http://localhost:8080'
	const authDir = path.join(__dirname, '.auth')

	if (!fs.existsSync(authDir)) {
		fs.mkdirSync(authDir, { recursive: true })
	}

	const browser = await chromium.launch()
	const page = await browser.newPage()

	await page.goto(`${baseURL}/login`)
	await page.getByRole('textbox', { name: 'Account name or email' }).fill('admin')
	await page.getByRole('textbox', { name: 'Password' }).fill('admin')
	await page.getByRole('button', { name: 'Log in', exact: true }).click()
	await page.waitForURL('**/apps/**')

	await page.context().storageState({ path: path.join(authDir, 'user.json') })
	await browser.close()
}

export default globalSetup
