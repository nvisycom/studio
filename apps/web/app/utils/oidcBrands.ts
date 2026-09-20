import type { IdentityProvider } from "@nvisy/sdk/datatypes";
import googleLogo from "~/assets/brands/google.png";
import microsoftLogo from "~/assets/brands/microsoft.png";

/**
 * Brand presentation for each OIDC sign-in provider: its logo and the i18n key
 * for its label. The login and signup pages render a button per provider the
 * server advertises (see `useAuthCapabilities`), looking each up here.
 *
 * A provider the server offers but that isn't mapped here is skipped rather than
 * rendered without a brand.
 */
export const OIDC_BRANDS: Partial<
	Record<IdentityProvider, { logo: string; labelKey: string }>
> = {
	google: { logo: googleLogo, labelKey: "auth.shared.google" },
	microsoft: { logo: microsoftLogo, labelKey: "auth.shared.microsoft" },
};
