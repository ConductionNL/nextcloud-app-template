<?php

/**
 * AppTemplate Settings Controller
 *
 * Controller for managing AppTemplate application settings.
 *
 * SPDX-FileCopyrightText: 2026 Conduction B.V. <info@conduction.nl>
 * SPDX-License-Identifier: EUPL-1.2
 *
 * @category Controller
 * @package  OCA\AppTemplate\Controller
 *
 * @author    Conduction Development Team <info@conduction.nl>
 * @copyright 2026 Conduction B.V.
 * @license   EUPL-1.2 https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 *
 * @version GIT: <git-id>
 *
 * @link https://conduction.nl
 *
 * @spec openspec/changes/example-change/tasks.md#task-2
 *   (Illustrative file-level @spec tag per ADR-003 — every PHP class must
 *   link back to the OpenSpec change that created or last modified it.)
 */

declare(strict_types=1);

namespace OCA\AppTemplate\Controller;

use OCA\AppTemplate\AppInfo\Application;
use OCA\AppTemplate\Service\SettingsService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IRequest;
use Psr\Log\LoggerInterface;

/**
 * Controller for managing AppTemplate application settings.
 *
 * Demonstrates the ADR-003 Controller → Service pattern: thin controller
 * (routing + validation + response), all business logic delegated to the
 * service. Error responses use static generic messages (ADR-005).
 */
class SettingsController extends Controller
{
    /**
     * Constructor for the SettingsController.
     *
     * @param IRequest        $request         The request object
     * @param SettingsService $settingsService The settings service
     * @param LoggerInterface $logger          The logger (for server-side error logging)
     *
     * @return void
     *
     * @spec openspec/changes/example-change/tasks.md#task-2
     */
    public function __construct(
        IRequest $request,
        private SettingsService $settingsService,
        private LoggerInterface $logger,
    ) {
        parent::__construct(appName: Application::APP_ID, request: $request);
    }//end __construct()

    /**
     * Retrieve all current settings.
     *
     * @NoAdminRequired
     *
     * @return JSONResponse
     *
     * @spec openspec/changes/example-change/tasks.md#task-2
     */
    public function index(): JSONResponse
    {
        try {
            return new JSONResponse(
                $this->settingsService->getSettings()
            );
        } catch (\Throwable $e) {
            $this->logger->error(
                'AppTemplate: failed to load settings',
                ['exception' => $e]
            );
            return new JSONResponse(['message' => 'Operation failed'], 500);
        }//end try
    }//end index()

    /**
     * Update settings with provided data.
     *
     * Admin-only (no `#[NoAdminRequired]`) — writing app configuration is an
     * admin action per ADR-005.
     *
     * @return JSONResponse
     *
     * @spec openspec/changes/example-change/tasks.md#task-2
     */
    public function create(): JSONResponse
    {
        try {
            $data   = $this->request->getParams();
            $config = $this->settingsService->updateSettings($data);

            return new JSONResponse(
                [
                    'success' => true,
                    'config'  => $config,
                ]
            );
        } catch (\Throwable $e) {
            $this->logger->error(
                'AppTemplate: failed to update settings',
                ['exception' => $e]
            );
            return new JSONResponse(['message' => 'Operation failed'], 500);
        }//end try
    }//end create()

    /**
     * Re-import the configuration from app_template_register.json.
     *
     * Forces a fresh import regardless of version, auto-configuring
     * all schema and register IDs from the import result. Admin-only.
     *
     * @return JSONResponse
     *
     * @spec openspec/changes/example-change/tasks.md#task-2
     */
    public function load(): JSONResponse
    {
        try {
            $result = $this->settingsService->loadConfiguration(force: true);
            return new JSONResponse($result);
        } catch (\Throwable $e) {
            $this->logger->error(
                'AppTemplate: failed to load configuration',
                ['exception' => $e]
            );
            return new JSONResponse(['message' => 'Operation failed'], 500);
        }//end try
    }//end load()
}//end class
