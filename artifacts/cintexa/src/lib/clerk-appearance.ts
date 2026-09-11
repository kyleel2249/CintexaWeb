import type { ComponentProps } from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

/**
 * Shared Clerk appearance config — suppresses every piece of Clerk's own
 * branding chrome (the "Secured by Clerk" footer badge, the development-mode
 * banner) so nothing in the auth UI reads "Clerk" to the person using it.
 * Clerk's sign-in/sign-up/account UI is loaded from Clerk's own servers at
 * runtime, not bundled in this app, so this appearance config — not a
 * find-and-replace — is the real mechanism for controlling what it shows.
 * Used identically everywhere Clerk UI renders: the global ClerkProvider
 * (main.tsx), the embedded SignIn/SignUp (GetStarted.tsx), and the
 * imperative account modal (Settings.tsx's openUserProfile()).
 */
export const clerkAppearance: NonNullable<ComponentProps<typeof ClerkProvider>["appearance"]> = {
  baseTheme: dark,
  layout: {
    unsafe_disableDevelopmentModeWarnings: true,
  },
  elements: {
    footer: { display: "none" },
    footerAction: { display: "none" },
    badge: { display: "none" },
    internal: { display: "none" },
  },
};
