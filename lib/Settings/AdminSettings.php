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
use OCP\IInitialStateService;
use OCP\Settings\ISettings;

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
class AdminSettings implements ISettings
{
    /**
     * Constructor.
     *
     * @param IAppManager         $appManager         The app manager.
     * @param IInitialStateService $initialStateService NC initial state service for CSP-safe state injection.
     */
    public function __construct(
        private IAppManager $appManager,
        private IInitialStateService $initialStateService,
    ) {
    }//end __construct()

    /**
     * Get the settings form template.
     *
     * @return TemplateResponse
     */
    public function getForm(): TemplateResponse
    {
        $version = $this->appManager->getAppVersion(appId: Application::APP_ID);

        // Provide version via IInitialStateService (CSP-compliant) so the Vue
        // settings app can read it via loadState(appId, 'version').
        // This replaces the service-locator call in the template.
        $this->initialStateService->provideInitialState(Application::APP_ID, 'version', $version);

        return new TemplateResponse(
            Application::APP_ID,
            'settings/admin',
            []
        );
    }//end getForm()

    /**
     * Get the section ID this settings page belongs to.
     *
     * @return string
     */
    public function getSection(): string
    {
        return 'app-template';
    }//end getSection()

    /**
     * Get the priority for ordering within the section.
     *
     * @return int
     */
    public function getPriority(): int
    {
        return 10;
    }//end getPriority()
}//end class
