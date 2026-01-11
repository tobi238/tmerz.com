import posthog from "posthog-js";

/**
 * In Vite, environment variables are accessed via import.meta.env.
 * Only variables prefixed with VITE_ are exposed to your client-side code.
 */
const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY;

if (POSTHOG_API_KEY) {
  posthog.init(POSTHOG_API_KEY, {
    cookieless_mode: "always",
    person_profiles: "identified_only",
  });
} else {
  // This will show up in dev if you haven't set up your .env file
  console.debug("VITE_POSTHOG_API_KEY is not defined");
}
