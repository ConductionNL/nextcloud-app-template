<?php

/**
 * AppTemplate Item Controller
 *
 * Controller for Article (item) mutation endpoints. Demonstrates the ADR-005
 * `#[NoAdminRequired]` + per-object auth pattern on DELETE /api/items/{id}.
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
 * @spec openspec/changes/example-change/tasks.md#task-5
 */

declare(strict_types=1);

namespace OCA\AppTemplate\Controller;

use OCA\AppTemplate\AppInfo\Application;
use OCA\AppTemplate\Service\ItemService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\Response;
use OCP\IRequest;
use OCP\IUserSession;
use Psr\Log\LoggerInterface;

/**
 * Controller for Article (item) mutations.
 *
 * Demonstrates ADR-003 (Controller → Service layering: the controller only
 * maps service results to HTTP codes) and ADR-005 (per-object authorization
 * on mutations: `#[NoAdminRequired]` paired with an explicit backend check
 * in the service).
 */
class ItemController extends Controller
{
    /**
     * Constructor for ItemController.
     *
     * @param IRequest        $request     The HTTP request
     * @param ItemService     $itemService The item service (owns auth rules)
     * @param IUserSession    $userSession The user session (backend-derived UID)
     * @param LoggerInterface $logger      The logger (server-side error logging)
     *
     * @return void
     *
     * @spec openspec/changes/example-change/tasks.md#task-5
     */
    public function __construct(
        IRequest $request,
        private readonly ItemService $itemService,
        private readonly IUserSession $userSession,
        private readonly LoggerInterface $logger,
    ) {
        parent::__construct(appName: Application::APP_ID, request: $request);
    }//end __construct()

    /**
     * Delete an Article object by UUID.
     *
     * `#[NoAdminRequired]` lets non-admins reach the endpoint; authorization
     * is enforced inside `ItemService::delete()` via an admin-or-owner check
     * (ADR-005). The controller ONLY maps the service's STATUS_* result to
     * the correct HTTP code:
     *
     * - 204 No Content — deleted
     * - 403 Forbidden — authenticated but not authorized for THIS object
     * - 404 Not Found — object does not exist (or register not configured)
     * - 503 Service Unavailable — OpenRegister missing
     *
     * Error bodies use static generic messages (ADR-005) — the real error is
     * logged server-side and never leaked to the client.
     *
     * @param string $id UUID of the Article object to delete
     *
     * @return Response
     *
     * @spec openspec/changes/example-change/tasks.md#task-5
     */
    #[NoAdminRequired]
    public function destroy(string $id): Response
    {
        $user = $this->userSession->getUser();
        if ($user === null) {
            return new JSONResponse(['message' => 'Authentication required'], Http::STATUS_UNAUTHORIZED);
        }

        try {
            $status = $this->itemService->delete(id: $id, userId: $user->getUID());
        } catch (\Throwable $e) {
            $this->logger->error(
                'AppTemplate: failed to delete item',
                ['exception' => $e]
            );
            return new JSONResponse(['message' => 'Operation failed'], Http::STATUS_INTERNAL_SERVER_ERROR);
        }

        return match ($status) {
            ItemService::STATUS_DELETED     => new Response(Http::STATUS_NO_CONTENT),
            ItemService::STATUS_FORBIDDEN   => new JSONResponse(['message' => 'Forbidden'], Http::STATUS_FORBIDDEN),
            ItemService::STATUS_NOT_FOUND   => new JSONResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND),
            ItemService::STATUS_UNAVAILABLE => new JSONResponse(['message' => 'Service unavailable'], Http::STATUS_SERVICE_UNAVAILABLE),
            default                         => new JSONResponse(['message' => 'Operation failed'], Http::STATUS_INTERNAL_SERVER_ERROR),
        };
    }//end destroy()
}//end class
