# Architecture rules

- Complete Google OAuth through the public `/auth/callback` route for both popup and full-page flows; this centralizes company initialization and selected-plan routing before entering protected pages.