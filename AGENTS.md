# Architecture rules

- Sign-in is email/password only (Google removed); the public `/auth/callback` route stays as a safe landing that initializes the company and routes the selected plan.
