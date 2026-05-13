<?php

use OCP\Util;

$appId = OCA\AppTemplate\AppInfo\Application::APP_ID;

// webpack splitChunks emits shared chunks that every entry-point depends on
// (see comment in templates/index.php). The admin-settings entry's bundle
// tail also wraps its mount in `__webpack_require__.O(...)` waiting for the
// shared chunks, so register them in dependency order here too.
Util::addScript($appId, $appId . '-shared-vendor');
Util::addScript($appId, $appId . '-shared-nc-vue');
Util::addScript($appId, $appId . '-settings');
?>
<div id="app-template-settings" data-version="<?php p($_['version'] ?? ''); ?>"></div>
