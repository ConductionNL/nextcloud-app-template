<?php

declare(strict_types=1);

// Define that we're running PHPUnit.
define('PHPUNIT_RUN', 1);

// Include Composer's autoloader.
require_once __DIR__ . '/../vendor/autoload.php';

// Register NC core autoloader (classes only — no OC::init / DB boot).
//
// Pure unit tests mock everything with PHPUnit createMock(), but the mock
// generator still needs the target interfaces (OCP\IAppConfig, OCP\IRequest,
// etc.) to be autoloadable. We point Composer's ClassLoader at NC's core
// classmap if the server is reachable at one of the expected layouts.
$ncRoots = [
    __DIR__ . '/../../..',                     // apps-extra/{app} next to server/lib
    __DIR__ . '/../../../..',                  // apps-extra/nested/{app}
    '/var/www/html',                           // running inside NC container
];
foreach ($ncRoots as $ncRoot) {
    if (is_file($ncRoot . '/lib/composer/autoload.php')) {
        require_once $ncRoot . '/lib/composer/autoload.php';
        break;
    }
}

// Register Test\ namespace for NC test classes (used by some test bases).
foreach ($ncRoots as $ncRoot) {
    $serverTestsLib = $ncRoot . '/tests/lib/';
    if (is_dir($serverTestsLib)) {
        $loader = new \Composer\Autoload\ClassLoader();
        $loader->addPsr4('Test\\', $serverTestsLib);
        $loader->register(true);
        break;
    }
}
