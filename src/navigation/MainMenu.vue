<template>
	<NcAppNavigation>
		<template #list>
			<NcAppNavigationItem
				:name="t('app-template', 'Dashboard')"
				:to="{ name: 'Dashboard' }">
				<template #icon>
					<ViewDashboard :size="20" />
				</template>
			</NcAppNavigationItem>
			<!-- Add your navigation items here -->
		</template>
		<template #footer>
			<NcAppNavigationSettings>
				<NcAppNavigationItem
					:name="t('app-template', 'Configuration')"
					:to="{ name: 'Settings' }">
					<template #icon>
						<Cog :size="20" />
					</template>
				</NcAppNavigationItem>
			</NcAppNavigationSettings>
		</template>
	</NcAppNavigation>
</template>

<script>
import { NcAppNavigation, NcAppNavigationItem, NcAppNavigationSettings } from '@nextcloud/vue'
import ViewDashboard from 'vue-material-design-icons/ViewDashboard.vue'
import Cog from 'vue-material-design-icons/Cog.vue'

export default {
	name: 'MainMenu',
	components: {
		NcAppNavigation,
		NcAppNavigationItem,
		NcAppNavigationSettings,
		ViewDashboard,
		Cog,
	},
}
</script>
