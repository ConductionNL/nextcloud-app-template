<?php

/**
 * AppTemplate Dashboard Controller
 *
 * Controller for the main AppTemplate dashboard page.
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
 */

declare(strict_types=1);

namespace OCA\AppTemplate\Controller;

use OCA\AppTemplate\AppInfo\Application;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IRequest;

/**
 * Controller for the main AppTemplate dashboard page.
 */
class DashboardController extends Controller {
	/**
	 * Constructor for the DashboardController.
	 *
	 * @param IRequest $request The request object
	 *
	 * @return void
	 */
	public function __construct(IRequest $request) {
		parent::__construct(appName: Application::APP_ID, request: $request);
	}//end __construct()

	/**
	 * Render the main dashboard page.
	 *
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 *
	 * @return TemplateResponse
	 *
	 * @spec openspec/specs/dashboard-page/spec.md#REQ-DASH-001
	 *
	 * @contract exclude renders the SPA shell, it has no JSON contract — the
	 * only thing a contract test could assert is that Nextcloud returned a
	 * TemplateResponse, which tests the framework rather than this app. The
	 * behaviour that matters here (the shell boots and the app mounts) is
	 * covered end-to-end by tests/e2e/app-shell.spec.ts, which is the right
	 * instrument for a page.
	 */
	public function page(): TemplateResponse {
		return new TemplateResponse(Application::APP_ID, 'index');
	}//end page()

	/**
	 * Serve the SPA for deep links (Vue history mode). Delegates to {@see page()}.
	 *
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 *
	 * @return TemplateResponse
	 *
	 * @spec openspec/specs/dashboard-page/spec.md#REQ-DASH-002
	 *
	 * @contract exclude same shell as page(), which it delegates to verbatim —
	 * see the exclusion there. Deep-link routing is a browser concern and is
	 * exercised by the e2e suite, not by an HTTP contract test.
	 */
	public function catchAll(): TemplateResponse {
		return $this->page();
	}//end catchAll()
}//end class
