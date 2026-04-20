<template>
	<NcAppNavigation>
		<template #list>
			<NcAppNavigationItem
				:name="t('app-template', 'Dashboard')"
				:to="{ name: 'Dashboard' }"
				:exact="true">
				<template #icon>
					<HomeIcon :size="20" />
				</template>
			</NcAppNavigationItem>
			<NcAppNavigationItem
				:name="t('app-template', 'Items')"
				:to="{ name: 'Items' }">
				<template #icon>
					<FormatListBulletedIcon :size="20" />
				</template>
			</NcAppNavigationItem>
			<NcAppNavigationItem
				:name="t('app-template', 'Documentation')"
				@click="openLink('https://conduction.nl', '_blank')">
				<template #icon>
					<BookOpenVariantOutline :size="20" />
				</template>
			</NcAppNavigationItem>
		</template>
		<template #footer>
			<NcAppNavigationSettings>
				<!-- Add admin/config nav items here (like OpenCatalogi's Catalogs, Themes, etc.) -->
				<NcAppNavigationItem
					:name="t('app-template', 'Settings')"
					@click="$emit('open-settings')">
					<template #icon>
						<CogIcon :size="20" />
					</template>
				</NcAppNavigationItem>
			</NcAppNavigationSettings>
		</template>
	</NcAppNavigation>
</template>

<script>
// ADR-004: import NC components from @conduction/nextcloud-vue, never @nextcloud/vue directly.
import { NcAppNavigation, NcAppNavigationItem, NcAppNavigationSettings } from '@conduction/nextcloud-vue'
import BookOpenVariantOutline from 'vue-material-design-icons/BookOpenVariantOutline.vue'
import CogIcon from 'vue-material-design-icons/Cog.vue'
import FormatListBulletedIcon from 'vue-material-design-icons/FormatListBulleted.vue'
import HomeIcon from 'vue-material-design-icons/Home.vue'

export default {
	name: 'MainMenu',
	components: {
		NcAppNavigation,
		NcAppNavigationItem,
		NcAppNavigationSettings,
		BookOpenVariantOutline,
		CogIcon,
		FormatListBulletedIcon,
		HomeIcon,
	},
	methods: {
		openLink(url, target = '_blank') {
			window.open(url, target)
		},
	},
}
</script>
