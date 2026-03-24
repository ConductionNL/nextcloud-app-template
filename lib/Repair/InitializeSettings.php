<?php

/**
 * AppTemplate Initialize Settings Repair Step
 *
 * Repair step that initializes AppTemplate register and schemas on install/upgrade.
 *
 * @category Repair
 * @package  OCA\AppTemplate\Repair
 *
 * @author    Conduction Development Team <dev@conductio.nl>
 * @copyright 2024 Conduction B.V.
 * @license   EUPL-1.2 https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 *
 * @version GIT: <git-id>
 *
 * @link https://conduction.nl
 */

declare(strict_types=1);

namespace OCA\AppTemplate\Repair;

use OCA\AppTemplate\Service\SettingsService;
use OCP\Migration\IOutput;
use OCP\Migration\IRepairStep;
use Psr\Log\LoggerInterface;

/**
 * Repair step that initializes AppTemplate configuration via ConfigurationService.
 */
class InitializeSettings implements IRepairStep
{
    /**
     * Constructor for InitializeSettings.
     *
     * @param SettingsService $settingsService The settings service
     * @param LoggerInterface $logger          The logger interface
     *
     * @return void
     */
    public function __construct(
        private SettingsService $settingsService,
        private LoggerInterface $logger,
    ) {
    }//end __construct()

    /**
     * Get the name of this repair step.
     *
     * @return string
     */
    public function getName(): string
    {
        return 'Initialize App Template register and schemas via ConfigurationService';
    }//end getName()

    /**
     * Run the repair step to initialize AppTemplate configuration.
     *
     * @param IOutput $output The output interface for progress reporting
     *
     * @return void
     */
    public function run(IOutput $output): void
    {
        $output->info('Initializing App Template configuration...');

        if ($this->settingsService->isOpenRegisterAvailable() === false) {
            $output->warning(
                'OpenRegister is not installed or enabled. Skipping auto-configuration.'
            );
            $this->logger->warning(
                'AppTemplate: OpenRegister not available, skipping register initialization'
            );
            return;
        }

        try {
            $result = $this->settingsService->loadConfiguration(force: true);

            if ($result['success'] === true) {
                $version = ($result['version'] ?? 'unknown');
                $output->info(
                    'App Template configuration imported successfully (version: '.$version.')'
                );
            } else {
                $message = ($result['message'] ?? 'unknown error');
                $output->warning(
                    'App Template configuration import issue: '.$message
                );
            }
        } catch (\Throwable $e) {
            $output->warning('Could not auto-configure App Template: '.$e->getMessage());
            $this->logger->error(
                'AppTemplate initialization failed',
                ['exception' => $e->getMessage()]
            );
        }//end try
    }//end run()
}//end class
