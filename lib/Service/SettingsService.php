<?php

/**
 * AppTemplate Settings Service
 *
 * Service for managing AppTemplate application configuration and settings.
 *
 * @category Service
 * @package  OCA\AppTemplate\Service
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

namespace OCA\AppTemplate\Service;

use OCA\AppTemplate\AppInfo\Application;
use OCP\App\IAppManager;
use OCP\IAppConfig;
use OCP\IGroupManager;
use OCP\IUserSession;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;

/**
 * Service for managing AppTemplate application configuration and settings.
 */
class SettingsService
{

    /**
     * Configuration keys managed by this service.
     *
     * @var array<string>
     */
    private const CONFIG_KEYS = [
        'register',
    ];

    /**
     * Constructor for the SettingsService.
     *
     * @param IAppConfig         $appConfig    The app config interface
     * @param IAppManager        $appManager   The app manager
     * @param ContainerInterface $container    The container
     * @param IGroupManager      $groupManager The group manager
     * @param IUserSession       $userSession  The user session
     * @param LoggerInterface    $logger       The logger
     *
     * @return void
     */
    public function __construct(
        private IAppConfig $appConfig,
        private IAppManager $appManager,
        private ContainerInterface $container,
        private IGroupManager $groupManager,
        private IUserSession $userSession,
        private LoggerInterface $logger,
    ) {
    }//end __construct()

    /**
     * Check whether OpenRegister is installed and available.
     *
     * @return bool
     */
    public function isOpenRegisterAvailable(): bool
    {
        return $this->appManager->isInstalled('openregister');
    }//end isOpenRegisterAvailable()

    /**
     * Retrieve all current settings.
     *
     * Returns a flat array containing all app config values plus metadata
     * fields (openregisters, isAdmin) consumed by the frontend.
     *
     * @return array<string,mixed>
     *
     * @spec openspec/specs/settings-management/spec.md#REQ-CFG-001
     */
    public function getSettings(): array
    {
        $settings = [];
        foreach (self::CONFIG_KEYS as $key) {
            $settings[$key] = $this->appConfig->getValueString(Application::APP_ID, $key, '');
        }

        $user    = $this->userSession->getUser();
        $isAdmin = ($user !== null && $this->groupManager->isAdmin($user->getUID()));

        return array_merge(
            $settings,
            [
                'openregisters' => $this->isOpenRegisterAvailable(),
                'isAdmin'       => $isAdmin,
            ]
        );
    }//end getSettings()

    /**
     * Update settings with the provided data.
     *
     * @param array<string,mixed> $data The data to update
     *
     * @return array<string,mixed> The updated settings
     *
     * @spec openspec/specs/settings-management/spec.md#REQ-CFG-002
     */
    public function updateSettings(array $data): array
    {
        foreach (self::CONFIG_KEYS as $key) {
            if (isset($data[$key]) === true) {
                $this->appConfig->setValueString(Application::APP_ID, $key, (string) $data[$key]);
            }
        }

        return $this->getSettings();
    }//end updateSettings()

    /**
     * Load configuration from app_template_register.json via OpenRegister.
     *
     * @param bool $force Force re-import even if already configured.
     *
     * @return array<string,mixed> Result with success flag, message, and version.
     *
     * @spec openspec/specs/settings-management/spec.md#REQ-CFG-003
     */
    public function loadConfiguration(bool $force=false): array
    {
        if ($this->isOpenRegisterAvailable() === false) {
            $this->logger->warning('AppTemplate: OpenRegister not available, skipping register initialization');
            return [
                'success' => false,
                'message' => 'OpenRegister is not installed or enabled.',
            ];
        }

        try {
            $configurationService = $this->container->get('OCA\OpenRegister\Service\ConfigurationService');
            // OR's importFromApp signature is (appId, data, version, force). It needs the parsed JSON
            // up-front. importFromFilePath(appId, filePath, version, force) takes a path and parses
            // internally — that's the one to call from a template that ships its register JSON inside
            // lib/Settings/<appId>_register.json. OR's ImportHandler resolves filePath relative to
            // \OC::$SERVERROOT (it prepends /var/www/html/), so we strip SERVERROOT from the absolute
            // path we compute via OC_App.
            $absPath = \OC_App::getAppPath(Application::APP_ID) . '/lib/Settings/' . Application::APP_ID . '_register.json';
            $version = '0.1.0';
            if (is_file($absPath)) {
                $raw = json_decode(file_get_contents($absPath), true);
                $version = $raw['info']['version'] ?? $version;
            }
            $serverRoot = rtrim(\OC::$SERVERROOT, '/');
            $relPath = str_starts_with($absPath, $serverRoot) ? ltrim(substr($absPath, strlen($serverRoot)), '/') : $absPath;

            $result = $configurationService->importFromFilePath(
                appId: Application::APP_ID,
                filePath: $relPath,
                version: $version,
                force: $force
            );

            if (empty($result) === false) {
                $this->logger->info('AppTemplate: register configuration imported successfully');
                return [
                    'success' => true,
                    'message' => 'Configuration imported successfully.',
                    'version' => ($result['version'] ?? $version),
                ];
            }

            return [
                'success' => false,
                'message' => 'Import returned an empty result.',
            ];
        } catch (\Throwable $e) {
            $this->logger->error(
                'AppTemplate: configuration import failed',
                ['exception' => $e->getMessage()]
            );
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }//end try
    }//end loadConfiguration()
}//end class
