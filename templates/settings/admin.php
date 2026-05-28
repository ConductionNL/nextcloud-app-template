<?php

use OCA\AppTemplate\AppInfo\Application;
use OCP\Util;

$appId = Application::APP_ID;

// The app version is injected as initial state by AdminSettings::getForm()
// via IInitialStateService — no service-locator call needed here.
// Read in Vue with: loadState(appId, 'version').

// webpack splitChunks emits shared chunks that every entry-point depends on
// (see comment in templates/index.php). The admin-settings entry's bundle
// tail also wraps its mount in `__webpack_require__.O(...)` waiting for the
// shared chunks, so register them in dependency order here too.
Util::addScript($appId, $appId . '-shared-vendor');
Util::addScript($appId, $appId . '-shared-nc-vue');
Util::addScript($appId, $appId . '-settings');
?>
<div id="app-template-settings"></div>
