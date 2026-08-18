<?php

/**
 * Unit tests for AdminSettings.
 *
 * @category Test
 * @package  OCA\AppTemplate\Tests\Unit\Settings
 *
 * @author    Conduction Development Team <info@conduction.nl>
 * @copyright 2026 Conduction B.V.
 * @license   EUPL-1.2 https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 *
 * SPDX-FileCopyrightText: 2026 Conduction B.V. <info@conduction.nl>
 * SPDX-License-Identifier: EUPL-1.2
 *
 * @version GIT: <git-id>
 *
 * @link https://conduction.nl
 */

declare(strict_types=1);

namespace OCA\AppTemplate\Tests\Unit\Settings;

use OCA\AppTemplate\Settings\AdminSettings;
use OCP\App\IAppManager;
use OCP\Settings\IDelegatedSettings;
use PHPUnit\Framework\TestCase;

/**
 * Tests for the admin settings section.
 *
 * The two IDelegatedSettings methods are what this class gained when it stopped
 * being a plain ISettings, and they are the reason
 * #[AuthorizedAdminSetting(AdminSettings::class)] type-checks on the settings
 * WRITE endpoint. Their values are load-bearing rather than boilerplate, so
 * they are pinned:
 *
 *   - getName() returning null means "use the section's own name". A stray
 *     string here would silently rename the section in the delegation UI.
 *   - getAuthorizedAppConfig() returning an EMPTY map means no config key is
 *     delegable, so the attribute scopes those endpoints to FULL admins. If
 *     this ever returns keys, it widens who may write settings — which is a
 *     product decision, not a refactor, and this test is where it gets noticed.
 */
class AdminSettingsTest extends TestCase {

	/**
	 * The settings section under test.
	 *
	 * @var AdminSettings
	 */
	private AdminSettings $settings;

	/**
	 * Set up test fixtures.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();

		$this->settings = new AdminSettings($this->createMock(IAppManager::class));

	}//end setUp()

	/**
	 * The section is a delegated-settings implementation.
	 *
	 * This is not decoration: #[AuthorizedAdminSetting] is typed
	 * class-string<IDelegatedSettings>, so dropping back to plain ISettings
	 * would make the attribute on SettingsController::create() stop
	 * type-checking and leave that write with no explicit auth posture.
	 *
	 * @return void
	 */
	public function testImplementsDelegatedSettings(): void {
		$this->assertInstanceOf(IDelegatedSettings::class, $this->settings);

	}//end testImplementsDelegatedSettings()

	/**
	 * getName() defers to the section's own name.
	 *
	 * @return void
	 */
	public function testGetNameDefersToTheSection(): void {
		$this->assertNull($this->settings->getName());

	}//end testGetNameDefersToTheSection()

	/**
	 * No app-config key is delegable, so the endpoints stay full-admin.
	 *
	 * @return void
	 */
	public function testNoAppConfigKeyIsDelegable(): void {
		$this->assertSame([], $this->settings->getAuthorizedAppConfig());

	}//end testNoAppConfigKeyIsDelegable()

	/**
	 * The section id and priority place the panel where the app expects it.
	 *
	 * @return void
	 */
	public function testSectionAndPriority(): void {
		$this->assertSame('apptemplate', $this->settings->getSection());
		$this->assertSame(10, $this->settings->getPriority());

	}//end testSectionAndPriority()

}//end class
