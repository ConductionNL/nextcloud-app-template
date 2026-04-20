<?php

/**
 * Unit tests for ItemService.
 *
 * Exercises the ADR-005 per-object auth rules on delete() — the service is
 * where the actual admin-or-owner check lives, so these tests lock down the
 * security-critical branches.
 *
 * @category Test
 * @package  OCA\AppTemplate\Tests\Unit\Service
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

namespace OCA\AppTemplate\Tests\Unit\Service;

use OCA\AppTemplate\Service\ItemService;
use OCP\App\IAppManager;
use OCP\IAppConfig;
use OCP\IGroupManager;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Container\ContainerInterface;

/**
 * Tests for ItemService.
 */
class ItemServiceTest extends TestCase
{

    /**
     * The service under test.
     *
     * @var ItemService
     */
    private ItemService $service;

    /**
     * Mock IAppConfig.
     *
     * @var IAppConfig&MockObject
     */
    private IAppConfig&MockObject $appConfig;

    /**
     * Mock IAppManager.
     *
     * @var IAppManager&MockObject
     */
    private IAppManager&MockObject $appManager;

    /**
     * Mock IGroupManager.
     *
     * @var IGroupManager&MockObject
     */
    private IGroupManager&MockObject $groupManager;

    /**
     * Mock ContainerInterface.
     *
     * @var ContainerInterface&MockObject
     */
    private ContainerInterface&MockObject $container;

    /**
     * Stub ObjectService — anonymous class to avoid importing OpenRegister
     * (which isn't on the test classpath).
     *
     * @var object
     */
    private object $objectService;

    /**
     * Whether the next find() call should return null.
     *
     * @var bool
     */
    private bool $objectMissing = false;

    /**
     * Payload the next find() call should return.
     *
     * @var array<string,mixed>
     */
    private array $objectPayload = [];

    /**
     * Whether delete() was invoked on the stub ObjectService.
     *
     * @var bool
     */
    private bool $objectDeleted = false;

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

        $this->appConfig    = $this->createMock(IAppConfig::class);
        $this->appManager   = $this->createMock(IAppManager::class);
        $this->groupManager = $this->createMock(IGroupManager::class);
        $this->container    = $this->createMock(ContainerInterface::class);

        $test = $this;
        $this->objectService = new class($test) {
            private ItemServiceTest $t;

            public function __construct(ItemServiceTest $t)
            {
                $this->t = $t;
            }

            /**
             * Stub find() mirroring OpenRegister ObjectService.
             *
             * @param string $register Register slug.
             * @param string $schema   Schema slug.
             * @param string $id       Object ID.
             *
             * @return array<string,mixed>|null
             */
            public function find(string $register, string $schema, string $id): ?array
            {
                if ($this->t->isObjectMissing() === true) {
                    return null;
                }
                return $this->t->getObjectPayload();
            }

            /**
             * Stub delete() mirroring OpenRegister ObjectService.
             *
             * @param string $register Register slug.
             * @param string $schema   Schema slug.
             * @param string $id       Object ID.
             *
             * @return void
             */
            public function delete(string $register, string $schema, string $id): void
            {
                $this->t->markObjectDeleted();
            }
        };

        $this->service = new ItemService(
            appConfig: $this->appConfig,
            appManager: $this->appManager,
            groupManager: $this->groupManager,
            container: $this->container,
        );

    }//end setUp()

    /**
     * Helper — exposes the missing flag to the anonymous ObjectService class.
     *
     * @return bool
     */
    public function isObjectMissing(): bool
    {
        return $this->objectMissing;
    }//end isObjectMissing()

    /**
     * Helper — exposes the stubbed object payload to the anonymous class.
     *
     * @return array<string,mixed>
     */
    public function getObjectPayload(): array
    {
        return $this->objectPayload;
    }//end getObjectPayload()

    /**
     * Helper — flipped by the stub ObjectService::delete() so tests can
     * assert that delete was actually called.
     *
     * @return void
     */
    public function markObjectDeleted(): void
    {
        $this->objectDeleted = true;
    }//end markObjectDeleted()

    /**
     * Configure the happy-path mocks (OpenRegister present, register configured,
     * ObjectService wired).
     *
     * @return void
     */
    private function arrangeOpenRegister(): void
    {
        $this->appManager->method('isInstalled')->willReturn(true);
        $this->appConfig->method('getValueString')->willReturn('app-template');
        $this->container->method('get')->willReturn($this->objectService);
    }//end arrangeOpenRegister()

    /**
     * delete() returns STATUS_UNAVAILABLE when OpenRegister is missing, and
     * MUST NOT query the DI container.
     *
     * @return void
     *
     * @spec openspec/changes/example-change/tasks.md#task-5
     */
    public function testDeleteReturnsUnavailableWhenOpenRegisterMissing(): void
    {
        $this->appManager->method('isInstalled')->willReturn(false);
        $this->container->expects($this->never())->method('get');

        $result = $this->service->delete(id: 'x', userId: 'alice');

        self::assertSame(ItemService::STATUS_UNAVAILABLE, $result);

    }//end testDeleteReturnsUnavailableWhenOpenRegisterMissing()

    /**
     * delete() returns STATUS_NOT_FOUND when the register is unconfigured —
     * no point looking up objects in a register we don't know.
     *
     * @return void
     *
     * @spec openspec/changes/example-change/tasks.md#task-5
     */
    public function testDeleteReturnsNotFoundWhenRegisterUnconfigured(): void
    {
        $this->appManager->method('isInstalled')->willReturn(true);
        $this->appConfig->method('getValueString')->willReturn('');
        $this->container->method('get')->willReturn($this->objectService);

        $result = $this->service->delete(id: 'x', userId: 'alice');

        self::assertSame(ItemService::STATUS_NOT_FOUND, $result);

    }//end testDeleteReturnsNotFoundWhenRegisterUnconfigured()

    /**
     * delete() returns STATUS_NOT_FOUND when the object doesn't exist —
     * OWASP A01: we do NOT return 403 for non-existent IDs, which would
     * leak existence.
     *
     * @return void
     *
     * @spec openspec/changes/example-change/tasks.md#task-5
     */
    public function testDeleteReturnsNotFoundWhenObjectMissing(): void
    {
        $this->arrangeOpenRegister();
        $this->objectMissing = true;

        // No admin check needed — auth runs after find().
        $this->groupManager->expects($this->never())->method('isAdmin');

        $result = $this->service->delete(id: 'x', userId: 'alice');

        self::assertSame(ItemService::STATUS_NOT_FOUND, $result);
        self::assertFalse($this->objectDeleted);

    }//end testDeleteReturnsNotFoundWhenObjectMissing()

    /**
     * delete() returns STATUS_FORBIDDEN when the caller is neither admin nor
     * owner — and MUST NOT actually delete the object.
     *
     * @return void
     *
     * @spec openspec/changes/example-change/tasks.md#task-5
     */
    public function testDeleteReturnsForbiddenForNonAdminNonOwner(): void
    {
        $this->arrangeOpenRegister();
        $this->objectPayload = ['@self' => ['owner' => 'alice']];

        $this->groupManager->expects($this->once())
            ->method('isAdmin')
            ->with('bob')
            ->willReturn(false);

        $result = $this->service->delete(id: 'x', userId: 'bob');

        self::assertSame(ItemService::STATUS_FORBIDDEN, $result);
        self::assertFalse($this->objectDeleted, 'Object must NOT be deleted on forbidden');

    }//end testDeleteReturnsForbiddenForNonAdminNonOwner()

    /**
     * delete() allows the owner to delete their own object.
     *
     * @return void
     *
     * @spec openspec/changes/example-change/tasks.md#task-5
     */
    public function testDeleteAllowsOwner(): void
    {
        $this->arrangeOpenRegister();
        $this->objectPayload = ['@self' => ['owner' => 'alice']];

        $this->groupManager->expects($this->once())
            ->method('isAdmin')
            ->with('alice')
            ->willReturn(false);

        $result = $this->service->delete(id: 'x', userId: 'alice');

        self::assertSame(ItemService::STATUS_DELETED, $result);
        self::assertTrue($this->objectDeleted);

    }//end testDeleteAllowsOwner()

    /**
     * delete() allows an admin to delete another user's object — the admin
     * branch short-circuits the ownership check.
     *
     * @return void
     *
     * @spec openspec/changes/example-change/tasks.md#task-5
     */
    public function testDeleteAllowsAdmin(): void
    {
        $this->arrangeOpenRegister();
        $this->objectPayload = ['@self' => ['owner' => 'someone-else']];

        $this->groupManager->expects($this->once())
            ->method('isAdmin')
            ->with('root')
            ->willReturn(true);

        $result = $this->service->delete(id: 'x', userId: 'root');

        self::assertSame(ItemService::STATUS_DELETED, $result);
        self::assertTrue($this->objectDeleted);

    }//end testDeleteAllowsAdmin()
}//end class
