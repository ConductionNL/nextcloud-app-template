<?php

/**
 * AppTemplate Metrics Controller
 *
 * Prometheus-style metrics endpoint (ADR-006).
 *
 * @category Controller
 * @package  OCA\AppTemplate\Controller
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
 *
 * @spec openspec/changes/example-change/tasks.md#task-8
 *   (Illustrative stub per ADR-006 — every app MUST expose `GET /api/metrics`
 *   as Prometheus text, admin auth. Replace the metric values with real data.)
 */

declare(strict_types=1);

namespace OCA\AppTemplate\Controller;

use OCA\AppTemplate\AppInfo\Application;
use OCA\AppTemplate\Service\SettingsService;
use OCP\App\IAppManager;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataDisplayResponse;
use OCP\IRequest;
use Psr\Log\LoggerInterface;

/**
 * Prometheus metrics endpoint for AppTemplate (ADR-006).
 *
 * Returns `text/plain; version=0.0.4` with `{app}_` prefixed metrics.
 * MUST include `{app}_health_status` and `{app}_info` per ADR-006.
 * Admin-only (no `@NoAdminRequired`) — ADR-006 mandates admin auth.
 */
class MetricsController extends Controller
{
    /**
     * Metric prefix.
     *
     * @var string
     */
    private const METRIC_PREFIX = 'app_template';

    /**
     * Constructor.
     *
     * @param IRequest        $request         The request object
     * @param SettingsService $settingsService For OpenRegister availability check
     * @param LoggerInterface $logger          The logger
     * @param IAppManager     $appManager      For reading the app version dynamically
     *
     * @return void
     *
     * @spec openspec/changes/example-change/tasks.md#task-8
     */
    public function __construct(
        IRequest $request,
        private SettingsService $settingsService,
        private LoggerInterface $logger,
        private IAppManager $appManager,
    ) {
        parent::__construct(appName: Application::APP_ID, request: $request);
    }//end __construct()

    /**
     * Prometheus text exposition. Admin auth per ADR-006.
     *
     * @NoCSRFRequired
     *   Exception to the project-wide @NoCSRFRequired-ban: this endpoint is
     *   scraped by Prometheus (no browser session / no CSRF token available).
     *   It is protected by Nextcloud admin auth (@AuthorizedAdminSetting) so
     *   CSRF protection is replaced by admin-level credential validation.
     *   ADR-006 explicitly allows this for the /api/metrics admin endpoint.
     *
     * @return DataDisplayResponse
     *
     * @spec openspec/changes/example-change/tasks.md#task-8
     */
    public function index(): DataDisplayResponse
    {
        try {
            $prefix  = self::METRIC_PREFIX;
            $healthy = (int) $this->settingsService->isOpenRegisterAvailable();

            $version = $this->appManager->getAppVersion(Application::APP_ID);
            $lines = [
                '# HELP '.$prefix.'_info Static app information',
                '# TYPE '.$prefix.'_info gauge',
                $prefix.'_info{app="'.Application::APP_ID.'",version="'.$version.'"} 1',
                '# HELP '.$prefix.'_health_status 1 when OpenRegister reachable, 0 otherwise',
                '# TYPE '.$prefix.'_health_status gauge',
                $prefix.'_health_status '.$healthy,
            ];

            return new DataDisplayResponse(
                implode("\n", $lines)."\n",
                Http::STATUS_OK,
                ['Content-Type' => 'text/plain; version=0.0.4; charset=utf-8']
            );
        } catch (\Throwable $e) {
            $this->logger->error('AppTemplate: metrics generation failed', ['exception' => $e]);
            return new DataDisplayResponse('', Http::STATUS_INTERNAL_SERVER_ERROR);
        }//end try
    }//end index()
}//end class
