<?php

/**
 * Contract tests for PreferencesController.
 *
 * @category Test
 * @package  OCA\AppTemplate\Tests\Unit\Controller
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

namespace OCA\AppTemplate\Tests\Unit\Controller;

use OCA\AppTemplate\AppInfo\Application;
use OCA\AppTemplate\Controller\PreferencesController;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IConfig;
use OCP\IRequest;
use OCP\IUser;
use OCP\IUserSession;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

/**
 * Contract tests for the per-user preference endpoints (gate-25).
 *
 * These are the two endpoints in this template that carry an actual JSON
 * contract — `{value: string|null}` — as opposed to the dashboard routes,
 * which render the SPA shell and are excluded with a stated reason. What is
 * pinned here is the CONTRACT: the status code and the response shape a caller
 * designs against, including the unauthenticated and invalid-key paths, which
 * are the ones most likely to change by accident.
 */
class PreferencesControllerTest extends TestCase {

	/**
	 * The controller under test.
	 *
	 * @var PreferencesController
	 */
	private PreferencesController $controller;

	/**
	 * Mock IConfig.
	 *
	 * @var IConfig&MockObject
	 */
	private IConfig&MockObject $config;

	/**
	 * Mock IUserSession.
	 *
	 * @var IUserSession&MockObject
	 */
	private IUserSession&MockObject $userSession;

	/**
	 * Set up test fixtures.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();

		$request = $this->createMock(IRequest::class);
		$this->config = $this->createMock(IConfig::class);
		$this->userSession = $this->createMock(IUserSession::class);

		$this->controller = new PreferencesController(
			$request,
			$this->config,
			$this->userSession
		);

	}//end setUp()

	/**
	 * Point the session at a logged-in user.
	 *
	 * @param string $uid The user id to report.
	 *
	 * @return void
	 */
	private function withUser(string $uid = 'alice'): void {
		$user = $this->createMock(IUser::class);
		$user->method('getUID')->willReturn($uid);
		$this->userSession->method('getUser')->willReturn($user);

	}//end withUser()

	/**
	 * A stored preference is returned under `value`.
	 *
	 * @return void
	 */
	public function testGetPreferenceReturnsStoredValue(): void {
		$this->withUser();
		$this->config->expects($this->once())
			->method('getUserValue')
			->with('alice', Application::APP_ID, 'pref_theme', '')
			->willReturn('dark');

		$response = $this->controller->getPreference('theme');

		$this->assertInstanceOf(JSONResponse::class, $response);
		$this->assertSame(Http::STATUS_OK, $response->getStatus());
		$this->assertSame(['value' => 'dark'], $response->getData());

	}//end testGetPreferenceReturnsStoredValue()

	/**
	 * An unset preference reads as null, not as an empty string.
	 *
	 * The controller stores "cleared" as '' and must translate that back to
	 * null on the way out — a caller distinguishing "unset" from "set to empty"
	 * depends on it.
	 *
	 * @return void
	 */
	public function testGetPreferenceReturnsNullWhenUnset(): void {
		$this->withUser();
		$this->config->method('getUserValue')->willReturn('');

		$response = $this->controller->getPreference('theme');

		$this->assertSame(['value' => null], $response->getData());

	}//end testGetPreferenceReturnsNullWhenUnset()

	/**
	 * No session means 401, and no config read is attempted.
	 *
	 * @return void
	 */
	public function testGetPreferenceRequiresALoggedInUser(): void {
		$this->userSession->method('getUser')->willReturn(null);
		$this->config->expects($this->never())->method('getUserValue');

		$response = $this->controller->getPreference('theme');

		$this->assertSame(Http::STATUS_UNAUTHORIZED, $response->getStatus());

	}//end testGetPreferenceRequiresALoggedInUser()

	/**
	 * A key that sanitises to nothing is refused with 400 rather than read.
	 *
	 * This is the guard that stops a caller reaching arbitrary config keys by
	 * smuggling separators through the key, so it is pinned deliberately.
	 *
	 * @return void
	 */
	public function testGetPreferenceRejectsAnUnusableKey(): void {
		$this->withUser();
		$this->config->expects($this->never())->method('getUserValue');

		$response = $this->controller->getPreference('///');

		$this->assertSame(Http::STATUS_BAD_REQUEST, $response->getStatus());

	}//end testGetPreferenceRejectsAnUnusableKey()

	/**
	 * A write stores the value under the prefixed key and echoes it back.
	 *
	 * @return void
	 */
	public function testSetPreferenceStoresTheValue(): void {
		$this->withUser();
		$this->config->expects($this->once())
			->method('setUserValue')
			->with('alice', Application::APP_ID, 'pref_theme', 'dark');

		$response = $this->controller->setPreference('theme', 'dark');

		$this->assertSame(Http::STATUS_OK, $response->getStatus());
		$this->assertSame(['value' => 'dark'], $response->getData());

	}//end testSetPreferenceStoresTheValue()

	/**
	 * Writing without a session is refused with 401 and stores nothing.
	 *
	 * @return void
	 */
	public function testSetPreferenceRequiresALoggedInUser(): void {
		$this->userSession->method('getUser')->willReturn(null);
		$this->config->expects($this->never())->method('setUserValue');

		$response = $this->controller->setPreference('theme', 'dark');

		$this->assertSame(Http::STATUS_UNAUTHORIZED, $response->getStatus());

	}//end testSetPreferenceRequiresALoggedInUser()

}//end class
