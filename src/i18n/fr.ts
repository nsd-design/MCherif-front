/*
 * Chaînes visibles en français. Interface 100 % FR, ton sobre, sans emoji.
 * Regroupées par domaine ; les libellés de données de démonstration restent
 * dans api/mock/data.ts.
 */
export const fr = {
  app: {
    orgName: 'Mohamed Chérif',
    admin: 'Administration',
  },
  nav: {
    dashboard: 'Tableau de bord',
    prayers: 'Prêches',
    publish: 'Publication',
    users: 'Utilisateurs',
    payments: 'Abonnements',
    notifications: 'Notifications',
    settings: 'Paramètres',
    logout: 'Se déconnecter',
  },
  auth: {
    title: 'Administration',
    subtitle: "Espace réservé à l'équipe Mohamed Chérif",
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    forgot: 'Mot de passe oublié ?',
    twoFaHint: "Code de vérification requis à l'étape suivante",
    submit: 'Se connecter',
    codeTitle: 'Vérification en deux étapes',
    codeSubtitle: 'Saisissez le code à 6 chiffres envoyé à votre e-mail',
    code: 'Code de vérification',
    verify: 'Vérifier',
    back: 'Retour',
    resend: 'Renvoyer le code',
    errorCredentials: 'Identifiants invalides.',
    errorCode: 'Code invalide. Réessayez.',
  },
  common: {
    search: 'Recherche globale…',
    loading: 'Chargement…',
    empty: 'Aucun élément à afficher',
    error: 'Une erreur est survenue',
    retry: 'Réessayer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    edit: 'Éditer',
    delete: 'Supprimer',
    close: 'Fermer',
    free: 'Gratuit',
    premium: 'Premium',
    all: 'Tous',
    published: 'Publié',
    draft: 'Brouillon',
    encoding: 'En encodage',
    failed: 'Échec',
  },
  status: {
    published: 'Publié',
    encoding: 'En encodage',
    draft: 'Brouillon',
    failed: 'Échec',
    active: 'Actif',
    expired: 'Expiré',
    none: 'Sans abonnement',
    success: 'Réussi',
    pending: 'En attente',
    txFailed: 'Échoué',
  },
} as const

export type Strings = typeof fr
