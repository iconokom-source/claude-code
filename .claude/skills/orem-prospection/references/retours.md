# Retours de Louis (à lire en premier, priment sur toutes les autres règles)

## Procédure quand Louis fait un retour

1. Reformuler le retour en **règle générale et réutilisable** (pas « change le mot X dans le mail
   de Dupont » mais « ne jamais écrire X ; préférer Y »).
2. L'ajouter en bas de la liste ci-dessous, avec la date et un exemple avant / après si utile.
3. Si le retour contredit une règle existante, modifier ou supprimer l'ancienne (pas de doublon,
   pas de contradiction).
4. Si la règle est vérifiable mécaniquement (mot interdit, longueur…), l'ajouter aussi à
   `scripts/verifier.py` (listes `FORMULES_INTERDITES` / `MOTS_MARKETING` ou seuils).
5. Dans Claude Code : commiter et pousser la modification du skill. Sur claude.ai : donner à Louis
   le texte à ajouter et lui rappeler de remettre à jour le skill.
6. Réécrire les messages concernés (retour à l'étape 5 du déroulé).

## Règles issues des retours

<!-- Format : - AAAA-MM-JJ · Règle. (Avant : « … » → Après : « … ») -->

- 2026-10-12 · **Pas de « mail de prospection classique ».** Le prospect reconnaît le modèle
  en une seconde et ne répond pas. Ne pas dérouler la formule Miria phrase par phrase
  (« J'ai vu… / Par curiosité… / On le voit souvent chez… / Je vous enregistre un Loom de 2 min ? ») :
  la formule guide la logique, pas les mots. Tournures interdites car usées :
  « j'ai vu votre post », « par curiosité », « on le voit souvent chez », « si c'est utile »,
  « dernier message de ma part », « un Loom de 2 min », « merci pour la connexion »,
  « un autre détail ». Aller droit au constat, avec le détail précis du prospect (une phrase de
  son site, un chiffre, un nom de page) dès la première ligne.
  (Avant : « J'ai vu votre post récent sur le lancement de l'offre… Par curiosité, je suis allé voir
  sur le site… » → Après : « Après votre post, j'ai cherché l'audit de rémunération sur votre site.
  Il n'y est pas. »)
- 2026-10-12 · **La sortie, ce sont toujours les 17 livrables** de `sequence.md`, reliés par un
  fil rouge logique : chaque message découle du précédent, rien au hasard.
- 2026-10-12 · **L'objectif CTA se fixe à l'Email 3** (Loom pertinent = oui → Loom ; non → RDV
  30 min). Emails 1, 2, LinkedIn et breakup demandent seulement une réponse.
- 2026-10-12 · **Le style dépend du prospect** : A « constat brut » (sec, direct) ou B « idée
  d'abord » (le mail donne une idée concrète avant de demander). Le rédacteur choisit et justifie.
- 2026-10-12 · **Longueur des emails : on garde 50 à 120 mots** (règle de Shannen).
- 2026-10-12 · (validateur, test Halbrook) Pas de date relative figée ; chaque email rappelle le
  constat ; une réponse sort le lead de la séquence ; un seul seuil de warm call ; l'appel s'ouvre
  sur prénom, nom et Orem ; ne jamais promettre une suite que la séquence ne tient pas. Détail
  dans `sequence.md`.
- 2026-10-12 · **Test du prospect (Louis : « tu es le prospect, tu réponds ? »).** Une séquence
  conforme aux règles peut ne donner aucune envie de répondre. Désormais :
  - **L'accroche doit apprendre quelque chose au prospect.** Test « le savait-il déjà ? » : si
    oui (ex. « votre nouvelle offre n'est pas sur votre site » alors qu'il vient de la lancer),
    l'accroche est refusée. Chercher une information qu'il n'a pas (voir « Insights à chercher »
    dans `orem-contexte.md`).
  - **Le problème doit être assez gros pour justifier un regard extérieur**, sans pitcher. Une
    page manquante, son équipe la fait seule ; être absent de Google et des IA sur son offre, non.
  - **Le CTA ne doit pas offrir une sortie.** Test « réponse qui ferme » : si « oui, c'est
    prévu » ou « non merci » clôt l'échange, le CTA est refusé. Préférer une question qui ouvre
    (« vous voulez la liste des trois cabinets cités ? »).
  - **Chaque message apporte une information nouvelle** sur le même problème. Jamais le même fait
    reformulé cinq fois.
  - **Un 4e agent, le prospect simulé** (`agents/prospect.md`), lit la séquence dans la peau du
    destinataire. S'il ne répondrait pas, la séquence repart au rédacteur.
