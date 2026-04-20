<?php

/**
 * Unit tests for ItemController.
 *
 * Covers the ADR-005 per-object auth HTTP mapping: the controller ONLY maps
 * the service's STATUS_* result to the right HTTP code; all business logic
 * (the actual auth check) lives in ItemService.
 *
 * @category Test
 * @package  OCA\AppTemplate\Tests\Unit\Controller
 *
 * @author    Conduction Development Team <info@conduction.nl>
 * @copyright 2026 Conduction B.V.
 * @license   EUPL-1.2 https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 *
 * @version GIT: <git-id>
 *
 * @link https://conduction.nl
 *
 * @spec openspec/changes/example-change/tasks.md#task-5
 */

declare(strict_types=1);

namespace OCA\AppTemplate\Tests\Unit\Controller;

use OCA\AppTemplate\Controller\ItemController;
use OCA\AppTemplate\Service\ItemService;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IRequest;
use OCP\IUser;
use OCP\IUserSession;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

/**
 * Tests for ItemController.
 */
class ItemControllerTest extends TestCase
{

    /**
     * The controller under test.
     *
     * @var ItemController
     */
    private ItemController $controller;

    /**
     * Mock IRequest.
     *
     * @var IRequest&MockObject
     */
    private IRequest&MockObject $request;

    /**
     * Mock ItemService.
     *
     * @var ItemService&MockObject
     */
    private ItemService&MockObject $itemService;

    /**
     * Mock IUserSession.
     *
     * @var IUserSession&MockObject
     */
    private IUserSession&MockObject $userSession;

    /**
     * Mock LoggerInterface.
     *
     * @var LoggerInterface&MockObject
     */
    private LoggerInterface&MockObject $logger;

    /**
     * Set up test fixtures.
     *
     * @return void
     *
     * @spec openspec/changes/example-change/tasks.md#task-5
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->request     = $this->createMock(IRequest::class);
        $this->itemService = $this->createMock(ItemService::class);
        $this->userSession = $this->createMock(IUserSession::class);
        $this->logger      = $this->createMock(LoggerInterface::class);

        $this->controller = new ItemController(
            request: $this->request,
            itemService: $this->itemService,
            userSession: $this->userSession,
            logger: $this->logger,
        );

    }//end setUp()

    /**
     * Build a mock user with the given UID.
     *
     * @param string $uid The user ID
     *
     * @return IUser&MockObject
     */
    private function makeUser(string $uid): IUser&MockObject
    {
        $user = $this->createMock(IUser::class);
        $user->method('getUID')->willReturn($uid);
        return $user;
    }//end makeUser()

    /**
     * destroy() returns 401 when no user is authenticated — the service MUST
     * NOT be called.
     *
     * @return void
     *
     * @spec openspec/changes/example-change/tasks.md#task-5
     */
    public function testDestroyReturns401WhenUnauthenticated(): void
    {
        $this->userSession->method('getUser')->willReturn(null);
        $this->itemService->expects($this->never())->method('delete');

        $result = $this->controller->destroy('some-uuid');

        self::assertInstanceOf(JSONResponse::class, $result);
        self::assertSame(Http::STATUS_UNAUTHORIZED, $result->getStatus());

    }//end testDestroyReturns401WhenUnauthenticated()

    /**
     * destroy() returns 204 when the service reports STATUS_DELETED and passes
     * the backend-derived UID (never a request param) to the service.
     *
     * @return void
     *
     * @spec openspec/changes/example-change/tasks.md#task-5
     */
    public function testDestroyReturns204OnSuccess(): void
    {
        $this->userSession->method('getUser')->willReturn($this->makeUser('alice'));

        // Controller MUST pass the backend-derived UID.
        $this->itemService->expects($this->once())
            ->method('delete')
            ->with(id: 'some-uuid', userId: 'alice')
            ->willReturn(ItemService::STATUS_DELETED);

        $result = $this->controller->destroy('some-uuid');

        self::assertSame(Http::STATUS_NO_CONTENT, $result->getStatus());

    }//end testDestroyReturns204OnSuccess()

    /**
     * destroy() returns 403 when the service reports STATUS_FORBIDDEN (user
     * authenticated but not the owner, not an admin).
     *
     * @return void
     *
     * @spec openspec/changes/example-change/tasks.md#task-5
     */
    public function testDestroyReturns403WhenServiceReportsForbidden(): void
    {
        $this->userSession->method('getUser')->willReturn($this->makeUser('bob'));
        $this->itemService->method('delete')->willReturn(ItemService::STATUS_FORBIDDEN);

        $result = $this->controller->destroy('some-uuid');

        self::assertInstanceOf(JSONResponse::class, $result);
        self::assertSame(Http::STATUS_FORBIDDEN, $result->getStatus());
        // OWASP A01 + ADR-005: generic message, no exception details leaked.
        self::assertSame(['message' => 'Forbidden'], $result->getData());

    }//end testDestroyReturns403WhenServiceReportsForbidden()

    /**
     * destroy() returns 404 when the object does not exist (STATUS_NOT_FOUND).
     *
     * @return void
     *
     * @spec openspec/changes/example-change/tasks.md#task-5
     */
    public function testDestroyReturns404WhenObjectNotFound(): void
    {
        $this->userSession->method('getUser')->willReturn($this->makeUser('alice'));
        $this->itemService->method('delete')->willReturn(ItemService::STATUS_NOT_FOUND);

        $result = $this->controller->destroy('does-not-exist');

        self::assertInstanceOf(JSONResponse::class, $result);
        self::assertSame(Http::STATUS_NOT_FOUND, $result->getStatus());

    }//end testDestroyReturns404WhenObjectNotFound()

    /**
     * ADR-005 error path — when the service throws, destroy() MUST log the
     * real exception server-side and return a generic 500.
     *
     * @return void
     *
     * @spec openspec/changes/example-change/tasks.md#task-5
     */
    public function testDestroyReturnsGeneric500OnServiceException(): void
    {
        $this->userSession->method('getUser')->willReturn($this->makeUser('alice'));
        $this->itemService->method('delete')
            ->willThrowException(new \RuntimeException('db exploded — host=secret.internal'));

        $this->logger->expects($this->once())->method('error');

        $result = $this->controller->destroy('some-uuid');

        self::assertInstanceOf(JSONResponse::class, $result);
        self::assertSame(Http::STATUS_INTERNAL_SERVER_ERROR, $result->getStatus());
        self::assertSame(['message' => 'Operation failed'], $result->getData());

    }//end testDestroyReturnsGeneric500OnServiceException()
}//end class
