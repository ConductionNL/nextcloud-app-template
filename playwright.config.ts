import { defineConfig } from '@playwright/test'

const baseURL = process.env.NEXTCLOUD_URL || 'http://localhost:8080'

export default defineConfig({
	testDir: './tests/e2e',
	timeout: 30_000,
	retries: 1,
	use: {
		baseURL,
		storageState: './tests/e2e/.auth/user.json',
		screenshot: 'only-on-failure',
		trace: 'on-first-retry',
	},
	globalSetup: './tests/e2e/global-setup.ts',
	projects: [
		{
			name: 'chromium',
			use: { browserName: 'chromium' },
		},
	],
	reporter: [
		['html', { open: 'never' }],
		['list'],
	],
})
