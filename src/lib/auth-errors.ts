/** Traduit les erreurs de connexion/inscription en français clair. */
export function authErrorFr(message: string | undefined | null): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("weak") || m.includes("easy to guess") || m.includes("pwned"))
    return "Ce mot de passe est trop courant. Choisissez-en un plus solide (lettres, chiffres et symboles).";
  if (m.includes("at least") && m.includes("character"))
    return "Le mot de passe doit contenir au moins 6 caractères.";
  if (m.includes("already registered") || m.includes("already exists"))
    return "Un compte existe déjà avec cet e-mail. Connectez-vous ou utilisez « Mot de passe oublié ? ».";
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return "E-mail ou mot de passe incorrect.";
  if (m.includes("email not confirmed"))
    return "Confirmez d'abord votre e-mail grâce au lien reçu.";
  if (m.includes("invalid") && m.includes("email"))
    return "Adresse e-mail invalide.";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes"))
    return "Trop de tentatives. Patientez une minute puis réessayez.";
  if (m.includes("same") && m.includes("password"))
    return "Le nouveau mot de passe doit être différent de l'ancien.";
  if (m.includes("expired") || m.includes("session"))
    return "Le lien a expiré. Demandez-en un nouveau.";
  if (m.includes("network") || m.includes("fetch"))
    return "Connexion internet instable. Réessayez.";
  return "Une erreur est survenue. Merci de réessayer.";
}
