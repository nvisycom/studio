import { pluralRule } from "./slavic";

// https://i18n.nuxtjs.org/docs/composables/define-i18n-config
export default defineI18nConfig(() => ({
	pluralRules: {
		ru: pluralRule,
		pl: pluralRule,
	},
}));
