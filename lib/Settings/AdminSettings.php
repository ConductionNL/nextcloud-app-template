<?php

/**
 * AppTemplate Admin Settings
 *
 * Provides the admin settings form for the AppTemplate application.
 *
 * @category Settings
 * @package  OCA\AppTemplate\Settings
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

namespace OCA\AppTemplate\Settings;

use OCA\AppTemplate\AppInfo\Application;
use OCP\App\IAppManager;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\Settings\IDelegatedSettings;

/**
 * Provides the admin settings form for the AppTemplate application.
 *
 * Implements ISettings (full-admin-only access). If your app needs delegated
 * admin support — allowing group-restricted sub-admins to manage settings —
 * migrate to IDelegatedSettings and implement getAuthorizedGroupId(). See
 * OCP\Settings\IDelegatedSettings for the interface contract and
 * https://docs.nextcloud.com/server/latest/developer_manual/app_development/settings.html
 * for usage guidance. For most apps, ISettings is the correct choice.
 */
class AdminSettings implements IDelegatedSettings {
	/**
	 * Constructor.
	 *
	 * @param IAppManager $appManager The app manager.
	 */
	public function __construct(
		private readonly IAppManager $appManager,
	) {
	}//end __construct()

	/**
	 * Get the settings form template.
	 *
	 * @return TemplateResponse
	 */
	public function getForm(): TemplateResponse {
		$version = $this->appManager->getAppVersion(appId: Application::APP_ID);

		return new TemplateResponse(
			Application::APP_ID,
			'settings/admin',
			['version' => $version]
		);
	}//end getForm()

	/**
	 * Get the section ID this settings page belongs to.
	 *
	 * @return string
	 */
	public function getSection(): string {
		return 'apptemplate';
	}//end getSection()

	/**
	 * Get the priority for ordering within the section.
	 *
	 * @return int
	 */
	public function getPriority(): int {
		return 10;
	}//end getPriority()

	/**
	 * The settings section's display name for the delegation UI.
	 *
	 * Null means "use the section's own name", which is what every fleet app
	 * does; there is no second sub-section to distinguish here.
	 *
	 * @return string|null
	 */
	public function getName(): ?string {
		return null;
	}//end getName()

	/**
	 * App config keys an authorized (delegated) admin may manage.
	 *
	 * Returned as a map of appId => list of allowed config keys. This template
	 * exposes no delegatable sub-keys, so it is intentionally empty — the
	 * #[AuthorizedAdminSetting] attribute on the controller still scopes those
	 * endpoints to full administrators.
	 *
	 * WHY IDelegatedSettings AND NOT ISettings: #[AuthorizedAdminSetting] is
	 * typed `class-string<IDelegatedSettings>`. Under plain ISettings the
	 * attribute is the only route to an explicit admin posture on a settings
	 * write endpoint, and it does not type-check — so apps scaffolded from this
	 * template were left with no honest way to satisfy gate-5 on those routes.
	 *
	 * @return array<string, list<string>>
	 */
	public function getAuthorizedAppConfig(): array {
		return [];
	}//end getAuthorizedAppConfig()
}//end class
