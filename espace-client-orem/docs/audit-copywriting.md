# Espace client Orem : relecture des textes de l’interface

Fichiers relus : `app/public/app.js` (1 935 lignes), `app/public/core.js` (1 168 lignes), `app/public/index.html`, avec `docs/conception.md` et `docs/REPRISE.md` (section 6) comme référence.
Les numéros de ligne ont été recalculés sur l’état des fichiers au moment de la livraison (après le commit d’accessibilité 811d440) ; si le fichier bouge encore, la recherche du texte exact reste fiable. La colonne « Texte actuel » contient une sous-chaîne exacte de la ligne citée : on peut l’appliquer telle quelle par remplacement. Quand une chaîne apparaît plusieurs fois, la colonne Réf l’indique (« ×2 »…).
Notation des propositions : `R('vous…', 'tu…')` quand le texte est déjà dans un `R()` ou doit y passer. Pour `core.js`, où le registre n’est pas connu au moment du message d’erreur, les propositions sont **neutres** (infinitif ou forme nominale) pour éviter un vouvoiement imposé à un client tutoyé.

---

## 1. Note de clarté et 5 problèmes principaux

| Public | Note actuelle | Commentaire |
|---|---|---|
| Client | **6,5 / 10** | Ton chaleureux, phrases courtes, beaucoup de bons états vides et de bons rappels. Mais le même mot désigne plusieurs choses (« étape », « évolution », « Documents »), du jargon d’agence reste visible (recette, prototype, fiche teaser, pilotage, axes) et des textes au vouvoiement s’affichent chez des clients tutoyés. |
| Agence | **6 / 10** | Tout est là, mais les libellés internes ne correspondent pas aux noms vus par le client (« Projet » et « Documents » dans le menu de la prochaine action, « Temps » contre « Étapes »), quelques boutons sont des états et non des verbes (« Traité », « Vérifié », « À reprendre »), et des aides parlent outil (« registre », « deal », « récap », « checklist »). |

**Les 5 problèmes principaux**

1. **Un mot, plusieurs sens.** « Étape » désigne à la fois les 4 temps O.R.E.M. (menu « Étapes »), la carte « Prochaine étape » (une action à faire) et une validation (« Cette étape n’attend pas de validation »). « Temps » apparaît en parallèle (« 4 temps », « Temps en cours », « Offre et temps »). « Évolution » est à la fois l’offre Évolution et une simple demande du client (« Demander une évolution », « devis d’évolution »). « Documents » est à la fois une catégorie de fichiers déposés par le client et l’onglet devis et factures (« l’IBAN dans Documents »). « Pilotage » est un onglet agence et la visio mensuelle d’Évolution.
2. **Registre tu/vous cassé.** Plusieurs textes sont écrits en dur au vouvoiement et s’affichent chez Hugo (tutoiement) : les étapes de création Webflow et l’aide « Autre » du nom de domaine dans « Bien démarrer », la consigne de signature tracée, les éléments à fournir par défaut (« Les fichiers que vous avez… »), la plupart des erreurs de `core.js` (« Écrivez votre message », « Cochez la case… », « Écrivez à l’équipe »), plusieurs messages de formulaire et de copie (IBAN, presse-papiers).
3. **Jargon et anglicismes visibles par le client** : recette, procès-verbal, prototype, fiche teaser, planches du cas d’étude, axes d’amélioration, visio de pilotage, « ce qui transforme », adresse de connexion, empreinte du document, J-12, « Workspace » et « Members » sans explication. Côté agence : registre, deal, récap, checklist.
4. **Des erreurs qui constatent sans dire quoi faire** : « Requête invalide. », « Action inconnue. », « Projet introuvable. », « Erreur 500 », « Envoi impossible. », « Fichier invalide. », « Cette étape n’attend pas de validation. » (vu par un client quand quelqu’un d’autre a déjà répondu).
5. **Promesses incohérentes ou fausses** : délais de réponse différents (24 h ouvrées, 48 h, 48 heures ouvrées, « très vite »), « Mise en ligne » affiché pour des offres sans site (réponse rapide « Où en est le projet ? »), contenus propres à Huchet-Demorge (« fiche teaser de bien ») montrés à tout client livré dans la visite guidée, « chaque consultation apparaît dans votre historique » alors que le client n’a pas d’historique, bouton « Voir les créneaux » qui mène à la page Équipe, message « Espace créé. Ajoutez la prochaine étape puis donnez l’accès » alors que l’accès est déjà créé quand l’e-mail est saisi.

**Violations des règles d’écriture Orem constatées**

| Règle | Constat |
|---|---|
| Jamais « suivi » | **Visible** : `app.js:859` « Des axes d’amélioration suivis ». Non visible (commentaire) : `app.js:834` « l’espace du suivi mensuel ». |
| Pas de tiret long (cadratin ni demi-cadratin) | Aucun dans les 3 fichiers (vérifié). |
| Guillemets « » | Respectés partout dans les textes visibles. |
| Espace avant `: ; ! ?` | Respectée partout dans les textes visibles (vérifié). |
| « agence », jamais « studio » | Respecté. |
| « Direction artistique » | Respecté (offre et livrables). |
| Méthode O.R.E.M. et offres | Respectés, mais les 4 temps sont appelés tantôt « temps », tantôt « étapes » (voir lexique). |
| Chiffres officiels | Respectés (« plus de 40 clients accompagnés depuis 2023 », « 100 % de satisfaction client »). |
| Hors règles, à corriger | « mails » au lieu de « e-mails » (`app.js:643`, `app.js:1506`), « Rapport qualité prix » sans trait d’union (`core.js:99`), « Logo et charte actuelle » (accord, `core.js:101`), `R()` aux deux branches identiques (`app.js:490`, `600`, `974`, `980`, `core.js:1119`). |

---

## 2. Lexique à unifier

| Terme retenu | Termes à remplacer | Où |
|---|---|---|
| **étape** : uniquement les 4 temps O.R.E.M. (Orienter, Représenter, Exécuter, Mesurer) | « temps », « phase » | Étapes, visite guidée, agence (Planning, Clients, Mise en ligne), réponses rapides |
| **prochaine action** (carte en haut de l’accueil, « Votre prochaine action » / « Ta prochaine action ») | « Prochaine étape » | Accueil client, onglet agence, toasts, journal d’activité |
| **valider** (verbe des boutons), **validation** (le nom) ; « feu vert » seulement dans les explications | « traiter », « étape » pour une validation | À valider, erreurs |
| **demander des modifications** / **modifications** | « remarques », « reprise », « retours » | À valider, toasts, historique |
| **livrable** : ce que l’agence produit et remet | « documents de l’agence », « planches » | Fichiers, Étapes |
| **fichiers** : ce qui est déposé (par le client ou l’agence) | « envois » reste possible en sous-titre | Fichiers |
| **Devis et factures** (onglet et rubrique administratifs) | « Documents », « Factures et documents » | Onglet, menu Plus, rappels, propositions, agence. « Documents » reste uniquement la catégorie de fichiers (textes, PDF déposés par le client). |
| **Évolution** (majuscule) : uniquement l’offre mensuelle | « évolution » pour une demande ponctuelle | Partout |
| **demande** / **faire une demande** (sur le site, après livraison) | « demande d’évolution », « Demander une évolution », « devis d’évolution » | Boîte à outils, agence, notifications |
| **visio** | « appel », « session » | Évolution, formation |
| **visio mensuelle** (côté client) | « visio de pilotage » | Évolution client. Côté agence, l’onglet « Pilotage » devient « Planning » pour éviter le doublon. |
| **améliorations** (en cours, du mois) | « axes », « axes d’amélioration », « chantiers » | Évolution |
| **bilan** (bilan mensuel) | « rapport mensuel » | Offre Évolution |
| **tests du site** | « recette », « prépare la recette » | Offre Site web, Étapes |
| **maquette cliquable** (côté client) | « prototype » | Maquettes et visuels |
| **fiche de présentation d’un bien** | « fiche teaser » | Boîte à outils |
| **e-mail** | « mail », « boîte mail » | Partout |
| **résumé** (e-mail quotidien de l’équipe) | « récap » | Réglages, e-mails |
| **liste** | « checklist » | Mise en ligne |
| **affaire gagnée** | « deal gagné » | Réglages |
| **tutoiement ou vouvoiement** | « registre » (dans l’interface) | Accès et infos, Réglages |
| **visite guidée** | « accueil guidé » | Réglages |
| **mise en ligne** (offre Site web) / **livraison** (autres offres) | « mise en ligne » pour toutes les offres | Réponses rapides, relances |
| **dans 12 jours** / **3 j de retard** | « J-12 », « J+3 » | Accueil client, liste des clients |
| **sous 24 h ouvrées** (délai unique de réponse) | « sous 48 h », « très vite », « 48 heures ouvrées » | Toasts, avis |

---

## 3. Réécritures, écran par écran

Priorités : **P1** gêne la compréhension (ou enfreint une règle), **P2** améliore nettement, **P3** finition.

### 3.1 Navigation, coque et états globaux (app.js)

| Réf | Texte actuel | Proposition | Raison | P |
|---|---|---|---|---|
| app.js:196 | `Revenir à l’administration` | `Quitter l’aperçu` | Dit ce que fait le bouton, sans mot technique | P2 |
| app.js:196 | `tel que le client le voit</span>` | `tel que le client le voit (actions désactivées)</span>` | Évite les clics sans effet | P3 |
| app.js:828 | `['documents', 'Factures et documents', 'doc']` | `['documents', 'Devis et factures', 'doc']` | Lexique : « Documents » est déjà une catégorie de fichiers | P1 |
| app.js:1539 | `documents: 'Documents'` | `documents: 'Devis et factures'` | Titre d’onglet du navigateur aligné sur le lexique | P2 |
| app.js:1549 | `Votre espace est en cours de préparation.` | `Votre espace est en cours de préparation. L’équipe vous écrit dès qu’il est prêt.` | État vide qui dit quoi attendre | P2 |
| app.js:25 | `'Erreur ' + r.status` | `R('Une erreur est survenue (code ' + r.status + '). Rechargez la page et réessayez.', 'Une erreur est survenue (code ' + r.status + '). Recharge la page et réessaie.')` | Dit quoi faire | P2 |

### 3.2 Connexion (app.js)

Avant connexion, le registre n’est pas connu : le vouvoiement est acceptable ici.

| Réf | Texte actuel | Proposition | Raison | P |
|---|---|---|---|---|
| app.js:1499 | `Saisissez l’e-mail utilisé pour votre projet. On vous envoie un lien et un code, sans mot de passe à retenir.` | `Saisissez l’adresse e-mail à laquelle l’agence vous écrit. Vous recevez un lien et un code : pas de mot de passe à retenir.` | « l’e-mail utilisé pour votre projet » est flou à la première visite | P2 |
| app.js:1506 | `Vérifiez votre boîte mail` | `Vérifiez vos e-mails` | Lexique « e-mail » | P3 |
| app.js:1506 | `Cliquez sur le lien, ou saisissez le code à 6 chiffres.` | `Cliquez sur le lien, ou saisissez le code à 6 chiffres. Rien reçu après 2 minutes ? Regardez dans les courriers indésirables.` | Anticipe le blocage le plus fréquent | P2 |
| app.js:1516 | `Sans Notion, sans compte Google.` | `Sans mot de passe, sans compte à créer.` | « Notion » est un outil interne, inconnu de beaucoup de clients | P2 |

### 3.3 Visite guidée, première connexion (app.js)

| Réf | Texte actuel | Proposition | Raison | P |
|---|---|---|---|---|
| app.js:621 | `${p.phases.length} temps, de la première visio ` | `${p.phases.length} étapes, de la première visio ` | Lexique « étape » | P1 |
| app.js:637 | `Fiche teaser, kit de marque, signature e-mail` | `Kit de marque, signature e-mail, demandes sur le site` | « Fiche teaser » ne concerne qu’un client (Huchet-Demorge) et c’est un anglicisme | P2 |
| app.js:638 | `['Préparer une fiche teaser de bien', 'Boîte à outils'], ['Demander une évolution du site', 'Boîte à outils'], ['Télécharger les visuels du cas client', 'Bibliothèque']` | `['Copier les couleurs de la marque', 'Boîte à outils'], ['Faire une demande sur le site', 'Boîte à outils'], ['Télécharger les visuels du projet', 'Bibliothèque']` | Raccourcis écrits pour Huchet-Demorge mais montrés à tout client livré ; « évolution » réservé à l’offre | P1 |
| app.js:642 | `Cet espace remplace les mails éparpillés` | `Cet espace remplace les e-mails éparpillés` | Lexique « e-mail » | P3 |
| app.js:658 | `'<button class="ghost" data-act="ob-skip">Passer</button>'` | `'<button class="ghost" data-act="ob-skip">Passer la visite</button>'` | Dit ce qu’on passe | P3 |

### 3.4 Accueil client, projet en cours (app.js)

| Réf | Texte actuel | Proposition | Raison | P |
|---|---|---|---|---|
| app.js:320 | `<div class="k">Prochaine étape</div>` | `<div class="k">${R('Votre prochaine action', 'Ta prochaine action')}</div>` | « Étape » désigne les 4 temps O.R.E.M. ; ici c’est une action à faire | P1 |
| app.js:317 | `` `J-${j} avant la mise en ligne` `` | `` (j ? `Mise en ligne dans ${j} jour${j > 1 ? 's' : ''}` : 'Mise en ligne aujourd’hui') `` | « J-12 » est un code de planning d’agence | P2 |
| app.js:232 | `projet: ['Voir le projet', 'projet']` | `projet: ['Voir les étapes', 'projet']` | Le bouton mène à la page « Étapes » | P2 |
| app.js:232 | `documents: ['Voir les documents', 'documents']` | `documents: ['Voir les devis et factures', 'documents']` | Lexique | P2 |
| app.js:232 | `equipe: ['Voir les créneaux', 'equipe']` | `equipe: ['Contacter l’équipe', 'equipe']` | Le bouton promet des créneaux mais ouvre la page Équipe | P1 |
| app.js:330 | `aria-label="Cocher : ${esc(a.t)}"` | `aria-label="Marquer comme fait : ${esc(a.t)}"` | Le lecteur d’écran annonce l’effet du clic | P3 |
| app.js:346 | `` ${j ? `Encore ${h} heures. ` : 'C’est aujourd’hui. '} `` | `` ${j ? '' : 'C’est aujourd’hui. '} `` | « Encore 480 heures » est illisible ; le nombre de jours est déjà affiché | P3 |
| app.js:591 | `Mise en ligne prévue vers le <strong>` | `${p.offer === 'site' ? 'Mise en ligne' : 'Livraison'} prévue vers le <strong>` | Faux pour les offres Direction artistique et Conseil | P2 |
| app.js:599 | `${R('Lui écrire', 'Lui écrire')}` | `Lui écrire` | `R()` inutile (deux branches identiques) | P3 |

Note : dans « À faire » (`app.js:328-331`), le bouton générique « Ouvrir » gagnerait à reprendre le libellé de la destination (`GO_LBL` : « Voir la facture », « Bien démarrer »…). C’est un petit changement de code, pas seulement de texte.

### 3.5 Bien démarrer (app.js)

| Réf | Texte actuel | Proposition | Raison | P |
|---|---|---|---|---|
| app.js:241 | `o2switch ne propose pas d’accès délégué : passez par le coffre chiffré ci-dessous.` | `o2switch ne propose pas d’accès délégué : choisir plutôt l’option « Coffre chiffré » ci-dessus.` | Le choix est au-dessus de ce texte ; neutre en registre | P2 |
| app.js:242 | `Cherchez « accès délégué », « utilisateurs » ou « contact technique » dans votre espace : invitez {mail}. Sinon, passez par le coffre chiffré.` | `Dans l’espace client de votre hébergeur, chercher « accès délégué », « utilisateurs » ou « contact technique », puis inviter {mail}. Sinon, choisir l’option « Coffre chiffré ».` | Vouvoiement imposé à un client tutoyé (ou passer le texte dans `R()`) | P1 |
| app.js:278 | `<li>Créez un compte sur ` | `<li>${R('Créez', 'Crée')} un compte sur ` | Registre | P1 |
| app.js:278 | `<li>Créez un espace de travail (« Workspace ») au nom de ` | `<li>${R('Créez', 'Crée')} un espace de travail (appelé « Workspace » dans Webflow) au nom de ` | Registre et explication du mot anglais | P1 |
| app.js:278 | `<li>Dans les réglages de l’espace, « Members », invitez ` | `<li>Dans les réglages de cet espace, rubrique « Members » (membres), ${R('invitez', 'invite')} ` | Registre et explication | P1 |
| app.js:290 | `Chez qui est-il ?` | `Où a-t-il été acheté ?` | Question qu’un dirigeant comprend sans connaître le mot « registraire » | P2 |
| app.js:295 | `chaque consultation apparaît dans ${R('votre', 'ton')} historique` | `chaque consultation est enregistrée` | Le client n’a pas d’historique visible : promesse fausse | P2 |
| app.js:297 | `Aucun souci : indiquez seulement le nom de domaine` | `Aucun souci : ${R('indiquez', 'indique')} seulement le nom de domaine` | Registre | P1 |
| app.js:298 | `mode === 'delegate' ? 'C’est fait, l’accès est donné' : 'Envoyer'` | `mode === 'delegate' ? 'C’est fait, l’accès est donné' : 'Envoyer le nom de domaine'` | Verbe et objet | P3 |
| app.js:1820 | `'Indiquez le nom de l’espace de travail.'` | `R('Indiquez le nom de l’espace de travail Webflow.', 'Indique le nom de l’espace de travail Webflow.')` | Registre | P1 |
| app.js:1823 | `'Indiquez le nom de domaine, par exemple entreprise.fr.'` | `R('Indiquez le nom de domaine, par exemple entreprise.fr.', 'Indique le nom de domaine, par exemple entreprise.fr.')` | Registre | P1 |
| app.js:1826 | `'Indiquez l’identifiant.'` | `R('Indiquez l’identifiant de connexion.', 'Indique l’identifiant de connexion.')` | Registre, précision | P1 |
| app.js:1826 | `'Indiquez le mot de passe.'` | `R('Indiquez le mot de passe.', 'Indique le mot de passe.')` | Registre | P1 |

### 3.6 Étapes (app.js et core.js)

| Réf | Texte actuel | Proposition | Raison | P |
|---|---|---|---|---|
| app.js:406 | `${p.phases.length} temps, selon la méthode O.R.E.M. : Orienter, Représenter, Exécuter, Mesurer. On ne passe au temps suivant qu’avec ${R('votre', 'ton')} feu vert. Les dates sont indicatives et ajustées ensemble.` | `${p.phases.length} étapes, selon la méthode O.R.E.M. : Orienter, Représenter, Exécuter, Mesurer. On ne passe à l’étape suivante qu’avec ${R('votre', 'ton')} feu vert. Les dates sont indicatives : on les ajuste ensemble.` | Lexique « étape », phrase plus naturelle | P1 |
| app.js:411 | `En retard de ${late} jour${late > 1 ? 's' : ''}` | `Décalée de ${late} jour${late > 1 ? 's' : ''}` | Ton moins anxiogène côté client, sans désigner de coupable | P3 |
| core.js:28 | `['Recette du site', 34, 'site']` | `['Tests du site', 34, 'site']` | « Recette » est un jargon de prestataire. **Attention** : changer aussi la clé `'Recette du site'` de `ROLES` (core.js:74), du `due` d’exemple (core.js:214) et le test `tests/core.js:105` ; les projets déjà créés gardent l’ancien libellé | P1 |
| core.js:31 | `['site', 'Recette du site', 'Le site complet, avant sa mise en ligne', 34]` | `['site', 'Tests du site', 'Le site complet, à tester avant sa mise en ligne', 34]` | Même raison ; dit ce qu’on attend du client | P1 |
| core.js:74 | `'prépare la recette'` | `'prépare le site pour {vos\|tes} tests'` | Jargon (le texte passe déjà par `Core.reg`) | P2 |
| core.js:29 | `'On mesure les résultats et on fait évoluer ce qui transforme.'` | `'On mesure les résultats et on améliore ce qui {vous \|t’}apporte des clients.'` | « Ce qui transforme » est du jargon marketing (le texte passe par `Core.reg`) | P2 |
| core.js:53 | `'Chaque mois, on lit les chiffres ensemble en visio de pilotage.'` | `'Chaque mois, on lit les chiffres ensemble en visio.'` | « Pilotage » inutile côté client | P3 |
| core.js:56 | `['Rapport mensuel', 30]` | `['Bilan mensuel', 30]` | Lexique « bilan » ; changer aussi la clé `ROLES` core.js:95 | P3 |
| core.js:117 | `'Guide de réutilisation remis'` | `'Guide pour modifier le site remis'` | « Réutilisation » ne dit pas à quoi sert le guide | P3 |
| app.js:700 | `avec le temps « Représenter »` | `avec l’étape « Représenter »` | Lexique | P1 |
| app.js:700 | `commence le design` | `commence les maquettes` | Anglicisme évitable | P3 |

Note : `app.js:701` cherche la personne dont le titre contient « design » ; Clément est « Directeur de création », donc c’est Louis qui est nommé. À corriger dans le code (`/design|création/i`).

### 3.7 À valider, signature, proposition (app.js)

| Réf | Texte actuel | Proposition | Raison | P |
|---|---|---|---|---|
| app.js:475 | `placeholder="Par exemple : regrouper deux pages, ajouter une page Presse…"` | `placeholder="Par exemple : ce qui ne va pas, où, et ce que vous préférez à la place…"` | L’exemple ne vaut que pour le plan du site (et le test `waouh.js:42` cherche « page Presse » : garder si besoin) | P3 |
| app.js:475 | `Envoyer mes remarques` | `Envoyer ma demande de modifications` | Lexique « modifications » | P2 |
| app.js:481 | `Ouvrir et regarder` | `Ouvrir le livrable` | Objet explicite | P2 |
| app.js:489 | `Déjà ${R('traité', 'traité')}` | `Déjà répondu` | « Traité » est du vocabulaire de back-office ; `R()` inutile | P2 |
| app.js:490 | `'Remarques envoyées le '` | `'Modifications demandées le '` | Lexique | P2 |
| app.js:490 | `<span class="chip hl">En cours de reprise</span>` | `<span class="chip hl">Modifications en cours</span>` | « Reprise » est du jargon | P2 |
| app.js:1799 | `'Remarques envoyées. Réponse sous 24 h ouvrées.'` | `'Demande de modifications envoyée. L’équipe répond sous 24 h ouvrées.'` | Lexique | P2 |
| app.js:424 | `pr.from ? 'Devis d’évolution' : 'Proposition'` | `pr.from ? 'Devis' : 'Proposition'` | « Évolution » réservé à l’offre | P2 |
| app.js:428 | `Signé « ${esc(pr.signName)} » depuis l’espace` | `Signée par ${esc(pr.signName)} depuis l’espace` | Lecture plus simple | P3 |
| app.js:428 | `'La facture d’acompte est dans Documents.'` | `'La facture d’acompte est dans « Devis et factures ».'` | Lexique (« Documents » n’existe plus dans le menu) | P1 |
| app.js:446 | `<span class="sign-ph" aria-hidden="true">Signez ici avec le doigt ou la souris</span>` | `<span class="sign-ph" aria-hidden="true">${R('Signez', 'Signe')} ici avec le doigt ou la souris</span>` | Registre | P1 |
| app.js:448 | `la date, l’heure et ${R('votre', 'ton')} adresse de connexion sont enregistrées avec une empreinte du document, consultables dans un certificat.` | `la date, l’heure et ${R('votre', 'ton')} adresse IP sont enregistrées avec un code unique du document, le tout réuni dans un certificat de signature.` | « Adresse de connexion » et « empreinte » sont flous | P3 |
| app.js:1817 | `return fieldError('sg-ok-' + id2, 'Cochez la case pour signer.')` | `return fieldError('sg-ok-' + id2, R('Cochez la case « J’ai lu ce document et je le signe ».', 'Coche la case « J’ai lu ce document et je le signe ».'))` | Registre, dit quelle case | P1 |
| app.js:1840 | `'Cochez la case pour accepter.'` | `R('Cochez la case « J’ai lu la proposition » pour accepter.', 'Coche la case « J’ai lu la proposition » pour accepter.')` | Registre, dit quelle case | P1 |

### 3.8 Fichiers et factures (app.js)

| Réf | Texte actuel | Proposition | Raison | P |
|---|---|---|---|---|
| app.js:501 | `['docs', 'Factures et documents']` | `['docs', 'Devis et factures']` | Lexique ; le test `accueil.js:47` cite ce nom dans un libellé (texte de test à mettre à jour) | P1 |
| app.js:524 | `'<p class="muted">Les maquettes et documents de l’agence apparaîtront ici.</p>'` | `'<p class="muted">Les livrables de l’agence (maquettes, comptes rendus, guides) apparaîtront ici.</p>'` | Lexique « livrable », exemples concrets | P3 |
| app.js:44 | `'Connexion perdue pendant l’envoi. Réessayez.'` | `R('Connexion perdue pendant l’envoi. Vérifiez votre connexion internet, puis renvoyez le fichier.', 'Connexion perdue pendant l’envoi. Vérifie ta connexion internet, puis renvoie le fichier.')` | Registre, dit quoi faire | P2 |
| app.js:43 | `'Envoi impossible.'` | `R('Envoi impossible. Réessayez dans un instant ; si cela continue, écrivez à l’équipe dans Messages.', 'Envoi impossible. Réessaie dans un instant ; si cela continue, écris à l’équipe dans Messages.')` | Dit quoi faire | P2 |
| app.js:1642 ×2 | `'Copie impossible ici. Sélectionnez le texte à la main.'` | `R('Copie impossible ici. Sélectionnez le texte à la main.', 'Copie impossible ici. Sélectionne le texte à la main.')` | Registre | P2 |
| app.js:1776 | `'IBAN sélectionné, copiez-le avec Ctrl+C.'` | `R('IBAN sélectionné : copiez-le avec Ctrl+C (Cmd+C sur Mac).', 'IBAN sélectionné : copie-le avec Ctrl+C (Cmd+C sur Mac).')` | Registre, cas Mac | P2 |

### 3.9 Maquettes et visuels, bibliothèque, commentaires (app.js)

| Réf | Texte actuel | Proposition | Raison | P |
|---|---|---|---|---|
| app.js:702 | `Tester le prototype</a>` | `Parcourir la maquette cliquable</a>` | « Prototype » est un mot de designer | P2 |
| app.js:704 | `Le prototype s’ouvre dans un nouvel onglet, sans compte Figma` | `La maquette cliquable s’ouvre dans un nouvel onglet, sans compte Figma` | Lexique | P2 |
| app.js:709 | `R('Ouvrez le prototype et cliquez', 'Ouvre le prototype et clique')` | `R('Ouvrez la maquette cliquable et cliquez', 'Ouvre la maquette cliquable et clique')` | Lexique | P2 |
| app.js:734 | `Visuels et planches du cas d’étude, libres d’usage pour ` | `Les visuels du projet, libres d’usage pour ` | « Planches du cas d’étude » est du vocabulaire d’agence | P2 |
| app.js:1044 | `type="submit">Épingler</button>` | `type="submit">Ajouter le commentaire</button>` | Verbe clair | P2 |
| app.js:1845 | `'Commentaire épinglé. L’équipe est prévenue.'` | `'Commentaire ajouté. L’équipe est prévenue.'` | Même raison | P3 |
| app.js:1052 | `x.status === 'open' ? 'En cours' : 'Traité'` | `x.status === 'open' ? 'À traiter' : 'Pris en compte'` | Côté client, « Pris en compte » rassure davantage | P3 |

### 3.10 Messages (app.js)

| Réf | Texte actuel | Proposition | Raison | P |
|---|---|---|---|---|
| app.js:720 | `'<p class="muted">Aucun message pour l’instant.</p>'` | `` `<p class="muted">Aucun message pour l’instant. ${R('Écrivez', 'Écris')} ci-dessous : l’équipe répond sous 24 h ouvrées.</p>` `` | État vide utile (guillemets simples remplacés par des accents graves pour le `R()`) | P2 |

### 3.11 Boîte à outils (app.js)

| Réf | Texte actuel | Proposition | Raison | P |
|---|---|---|---|---|
| app.js:745 | `teaser: ['doc', 'Fiche teaser de bien',` | `teaser: ['doc', 'Fiche de présentation d’un bien',` | Anglicisme | P2 |
| app.js:991 | `teaser: 'Fiche teaser de bien'` | `teaser: 'Fiche de présentation d’un bien'` | Même libellé côté agence | P2 |
| app.js:895 | `['tool:teaser', 'Fiche teaser', 'Présenter un bien en 2 minutes', 'doc']` | `['tool:teaser', 'Fiche de présentation', 'Présenter un bien en 2 minutes', 'doc']` | Anglicisme | P2 |
| app.js:748 | `request: ['plus', 'Demander une évolution',` | `request: ['plus', 'Faire une demande',` | Collision avec l’offre Évolution | P1 |
| app.js:991 | `request: 'Demande d’évolution'` | `request: 'Demandes sur le site'` | Même raison, côté agence | P1 |
| app.js:765 | `${ic('back')}Boîte à outils</button>` | `${ic('back')}Retour à la boîte à outils</button>` | Bouton retour explicite | P3 |
| app.js:760 | `on fait évoluer ce qui transforme : formulaires, pages, supports commerciaux.` | `on améliore ce qui ${R('vous ', 't’')}apporte des clients : formulaires, pages, supports commerciaux.` | « Ce qui transforme » est du jargon | P2 |
| app.js:761 | `Réserver un appel de 30 minutes` | `Réserver une visio de 30 minutes` | Lexique « visio » | P3 |
| app.js:761 | `Ou ${R('décrivez', 'décris')} une demande` | `Ou ${R('faites', 'fais')} une demande écrite` | Lexique « demande » | P3 |
| app.js:1846 | `R('Demande envoyée. On revient vers vous sous 48 h.', 'Demande envoyée. On revient vers toi sous 48 h.')` | `R('Demande envoyée. On revient vers vous sous 24 h ouvrées.', 'Demande envoyée. On revient vers toi sous 24 h ouvrées.')` | Délai unique partout | P2 |

Note : les statuts de demande affichés au client (`app.js:803`) sont les valeurs stockées « Nouveau », « Proposé », « En cours », « Fait ». « Proposé » ne parle pas au client : afficher « Devis envoyé » à la place, **sans changer la valeur stockée** (petit changement de code).

### 3.12 Évolution, accueil d’un projet livré, avis (app.js)

| Réf | Texte actuel | Proposition | Raison | P |
|---|---|---|---|---|
| app.js:859 | `['Des axes d’amélioration suivis', 'Chaque chantier avec son responsable, son échéance et son avancement.']` | `['Un plan d’amélioration à jour', 'Chaque amélioration avec son responsable, son échéance et son avancement.']` | **Mot interdit « suivi »** ; lexique | P1 |
| app.js:859 | `on fait évoluer ce qui transforme.` | `on améliore ce qui rapporte.` | Jargon | P2 |
| app.js:839 | `<small>L’étape supérieure, après la mise en ligne</small>` | `<small>Disponible après la mise en ligne</small>` | « Étape » réservé aux 4 étapes ; dit pourquoi c’est verrouillé | P2 |
| app.js:840 | `'Visio, bilans et axes du mois'` | `'Visio, bilans et améliorations du mois'` | Lexique | P3 |
| app.js:847 | `<div class="k">Prochaine visio de pilotage</div>` | `<div class="k">Prochaine visio mensuelle</div>` | « Pilotage » est du vocabulaire interne | P2 |
| app.js:848 | `on fait le point sur les axes en cours` | `on fait le point sur les améliorations en cours` | Lexique | P3 |
| app.js:857 | `L’étape supérieure : faire progresser ${R('votre', 'ton')} site chaque mois` | `Faire progresser ${R('votre', 'ton')} site, mois après mois` | « Étape » réservé aux 4 étapes | P2 |
| app.js:860 | `En parler en 30 minutes` | `En parler en visio (30 min)` | Dit le format | P3 |
| app.js:866, 1474 ×2 | `Axes d’amélioration</h2>` | `Améliorations en cours</h2>` | Lexique (même titre côté client et côté agence : renommer les deux) | P2 |
| app.js:867 | `Les axes du mois arrivent après la première visio.` | `Les améliorations du mois sont fixées lors de la première visio.` | Lexique | P3 |
| app.js:904 | `Axes en cours</h2>` | `Améliorations en cours</h2>` | Lexique | P3 |
| app.js:885 | `<span class="btn btn-primary btn-sm">Lire</span></a>` | `<span class="btn btn-primary btn-sm">Lire la proposition</span></a>` | Objet explicite | P3 |
| app.js:974 | `${R('le dire sur Google', 'le dire sur Google')}` | `le dire sur Google` | `R()` inutile | P3 |
| app.js:983 | `Note par point (1 = pas du tout, 5 = très bien)` | `Note par critère (1 = pas satisfait, 5 = très satisfait)` | Échelle explicite | P3 |
| app.js:1866 | `fieldError(f.querySelector('[name=rv-s]'), 'Choisissez une note de 1 à 5.')` | `fieldError(f.querySelector('[name=rv-s]'), R('Choisissez une note de 1 à 5 étoiles.', 'Choisis une note de 1 à 5 étoiles.'))` | Registre | P1 |

### 3.13 Équipe et aide, notifications du client (app.js)

| Réf | Texte actuel | Proposition | Raison | P |
|---|---|---|---|---|
| app.js:559 | `Que se passe-t-il quand je valide une étape ?</summary><p>La validation est enregistrée avec la date et l’heure, l’équipe est prévenue et l’étape suivante démarre.</p>` | `Que se passe-t-il quand je valide ?</summary><p>La validation est enregistrée avec la date et l’heure, l’équipe est prévenue et passe à la suite du projet.</p>` | Une validation ne lance pas forcément une nouvelle étape O.R.E.M. | P2 |
| app.js:560 | `R('vous en êtes propriétaire, vous êtes libres', 'tu en es propriétaire, tu es libre')` | `R('vous en êtes propriétaire et restez libre de changer de prestataire', 'tu en es propriétaire et restes libre de changer de prestataire')` | « Libres » de quoi ? Phrase incomplète | P2 |
| app.js:943 | `Dans l’espace, la cloche montre toujours tout.` | `Toutes les notifications restent visibles dans la cloche, en haut de l’espace.` | Dit où regarder | P3 |

### 3.14 Agence : boîte de réception, réglages, ajouter (app.js)

| Réf | Texte actuel | Proposition | Raison | P |
|---|---|---|---|---|
| app.js:1111 | `ic('check') + 'Traité'` | `ic('check') + 'Marquer comme traité'` | Un bouton est un verbe, pas un état | P2 |
| app.js:1120 | `'Les messages, fichiers, demandes de modifications et d’évolution des clients arriveront ici'` | `'Les messages, fichiers, demandes de modifications et demandes sur le site des clients arriveront ici'` | Lexique « Évolution » | P2 |
| app.js:1126 | `['requests', 'Un client demande une évolution']` | `['requests', 'Un client fait une demande sur son site']` | Lexique | P2 |
| app.js:1131 | `['digest', 'Un récap par jour, à 18 h']` | `['digest', 'Un résumé par jour, à 18 h']` | Lexique « résumé » | P3 |
| app.js:1135 | `M’envoyer le récap maintenant` | `M’envoyer le résumé maintenant` | Lexique | P3 |
| app.js:1735 | `'Récap envoyé. Il apparaît dans « E-mails envoyés ».'` | `'Résumé envoyé. Il apparaît dans « E-mails envoyés ».'` | Lexique | P3 |
| app.js:1139 | `Vidéo Loom d’accueil (accueil guidé)` | `Vidéo Loom d’accueil (visite guidée)` | Même nom que côté client (« Revoir la visite guidée ») | P3 |
| app.js:1146 | `Pipedrive prépare l’espace d’un deal gagné ; l’offre et le registre restent à choisir par l’équipe.` | `Pipedrive prépare l’espace dès qu’une affaire est gagnée ; l’équipe choisit ensuite l’offre et le tutoiement ou le vouvoiement.` | Anglicisme, jargon « registre » | P2 |
| app.js:1174 | `Elle devient la prochaine étape sur son accueil et il reçoit un e-mail.` | `Elle devient sa prochaine action sur l’accueil, et il reçoit un e-mail.` | Lexique | P2 |

### 3.15 Agence : liste des clients, nouvel espace, fiche client (app.js)

| Réf | Texte actuel | Proposition | Raison | P |
|---|---|---|---|---|
| app.js:1242 | `` `demande${a.requests > 1 ? 's' : ''} d’évolution` `` | `` `demande${a.requests > 1 ? 's' : ''} sur le site` `` | Lexique | P2 |
| app.js:1258 | `` `J+${-j}` : `J-${j}` `` | `` `${-j} j de retard` : `dans ${j} j` `` | « J+3 » ne dit pas que c’est en retard | P2 |
| app.js:1267 | `modifications, demandes d’évolution ou espace à ouvrir.` | `modifications, demandes sur le site ou espace à ouvrir.` | Lexique | P2 |
| app.js:1269 | `<th scope="col">Offre et temps</th>` | `<th scope="col">Offre et étape</th>` | Lexique | P1 |
| app.js:1276 | `Le client reçoit un lien de connexion, sans mot de passe` | `Si son e-mail est saisi, le client reçoit une invitation, sans mot de passe à créer` | Vrai seulement avec l’e-mail | P2 |
| app.js:1282 | `<label for="n-start">Démarrage</label>` | `<label for="n-start">Date de démarrage</label>` | Précision | P3 |
| app.js:1289 | `Les 4 temps O.R.E.M.` | `Les 4 étapes O.R.E.M.` | Lexique | P1 |
| app.js:1806 | `'Espace créé. Ajoutez la prochaine étape puis donnez l’accès au client.'` | `'Espace créé. Vérifiez la prochaine action, puis l’accès du client dans « Accès et infos ».'` | Le message demandait de donner un accès déjà créé quand l’e-mail est saisi | P2 |
| app.js:1294 | `[['pilotage', 'Pilotage']` | `[['pilotage', 'Planning']` | « Pilotage » désigne aussi la visio mensuelle Évolution | P2 |
| app.js:1294 | `['factures', 'Factures']` | `['factures', 'Devis et factures']` | L’onglet contient aussi les propositions ; même nom que côté client | P2 |
| app.js:1315 | `` `${a.requests} demande${a.requests > 1 ? 's' : ''} d’évolution` `` | `` `${a.requests} demande${a.requests > 1 ? 's' : ''} sur le site` `` | Lexique | P2 |
| app.js:1324 | `['projet', 'Projet'], ['documents', 'Documents'], ['equipe', 'Équipe']` | `['projet', 'Étapes'], ['documents', 'Devis et factures'], ['equipe', 'Équipe et aide']` | Libellés différents de ceux du menu client : l’agence ne sait pas où mène le bouton | P1 |
| app.js:1332 | `data-k="${x.k}">Vérifié</button>` | `data-k="${x.k}">C’est vérifié</button>` | Bouton lisible comme une action | P2 |
| app.js:1332 | `data-id="${t.id}">À reprendre</button>` | `data-id="${t.id}">Demander de reprendre</button>` | Verbe d’action | P2 |
| app.js:1342, 1343 ×2 | `Temps en cours` | `Étape en cours` | Lexique (titre et `aria-label`) | P1 |
| app.js:1344 | `Prochaine étape affichée au client` | `Prochaine action affichée au client` | Lexique | P1 |
| app.js:1348 | `Laissez le titre vide pour une prochaine étape automatique (validation en attente, puis fichiers manquants).` | `Titre vide : l’espace affiche tout seul la prochaine action (validation en attente, puis fichiers manquants).` | Lexique, plus direct | P2 |
| app.js:1354 | `Publier au client</button>` | `Publier pour le client</button>` | Syntaxe | P3 |
| app.js:1356 | `Qui fait quoi, lien</button>` | `Modifier qui fait quoi et le lien</button>` | Verbe d’action | P2 |
| app.js:1391 | `Devis, factures, contrat et RIB apparaissent dans Documents.` | `Devis, factures, contrat et RIB apparaissent dans « Devis et factures ».` | Lexique | P1 |
| app.js:1400 | `Celle d’avant signature et les devis d’évolution se préparent ici.` | `La proposition d’avant signature et les devis des demandes se préparent ici.` | Lexique, sujet explicite | P2 |
| app.js:1437 | `margin-bottom:8px">Registre</legend>` | `margin-bottom:8px">Tutoiement ou vouvoiement</legend>` | Même libellé qu’à la création | P2 |
| app.js:998 | `Le temps « Mesurer » est en cours.` | `L’étape « Mesurer » est en cours.` | Lexique | P1 |
| app.js:999 | `Les trois premiers temps passent en « Terminé »` | `Les trois premières étapes passent en « Terminé »` | Lexique | P1 |
| app.js:1010 | `Checklist de remise` | `Liste de remise` | Anglicisme | P3 |
| app.js:1470 | `Abonnement et visio de pilotage` | `Abonnement et visio mensuelle` | Même nom que côté client | P3 |
| app.js:1853 | `'Prochaine étape publiée.'` | `'Prochaine action publiée.'` | Lexique | P1 |

### 3.16 core.js : prochaine action, notifications, journal

| Réf | Texte actuel | Proposition | Raison | P |
|---|---|---|---|---|
| core.js:379 | `'Répondre au devis d’évolution'` | `'Répondre au devis'` | Lexique Évolution | P2 |
| core.js:385 | `'Rien à faire pour l’instant'` | `'Rien à faire pour l’instant : l’équipe avance'` | État vide rassurant | P3 |
| core.js:490 | `'a mis à jour la prochaine étape'` | `'a mis à jour la prochaine action'` | Lexique | P2 |
| core.js:920 | `` `${who} a mis à jour la prochaine étape` `` | `` `${who} a mis à jour la prochaine action` `` | Lexique | P2 |
| core.js:673 | `'a demandé une évolution : '` | `'a fait une demande : '` | Lexique | P2 |
| core.js:909 | `` `${who} demande une évolution ( `` | `` `${who} fait une demande (` `` | Lexique | P2 |
| core.js:905 | `` : `${who} : « ${String(action.text).slice(0, 120)} »` `` | `` : `${who} a écrit : « ${String(action.text).slice(0, 120)} »` `` | Notification sans verbe. **Attention** : le test `agence.js:27` attend « Claire : « … » » | P3 |
| core.js:1075 | `` text: `planning recalé de `` | `` text: `planning décalé de `` | « Recalé » ambigu | P3 |
| core.js:1078 | `` text: `Planning ${p.client} recalé de `` | `` text: `Planning ${p.client} décalé de `` | Même raison | P3 |

### 3.17 core.js : e-mails et rappels

| Réf | Texte actuel | Proposition | Raison | P |
|---|---|---|---|---|
| core.js:1104 | `l’IBAN dans Documents.` | `l’IBAN dans « Devis et factures ».` | Lexique (le rappel renvoie vers un nom qui n’existe pas dans le menu) | P1 |
| core.js:981 | `` `Le récap du jour : `` | `` `Le résumé du jour : `` | Lexique | P3 |
| core.js:1124 | `` text: `Code : ${code}\nLien : ${link}\nValable 15 minutes.` `` | `` text: `${T('Votre', 'Ton')} code de connexion à l’espace Orem : ${code}\n${T('Ou cliquez', 'Ou clique')} sur ce lien : ${link}\nValable 15 minutes.` `` | Version texte de l’e-mail trop sèche | P3 |
| core.js:1119 | `${T('Ouvrir mon espace', 'Ouvrir mon espace')}` | `Ouvrir mon espace` | `T()` inutile | P3 |

Note : l’invitation (core.js:1115-1119) signe toujours « Louis, Théophile et Clément », même si l’équipe du projet est différente, et le paramètre `lead` n’est pas utilisé. À corriger dans le code (le test `core.js:84` attend aujourd’hui ce texte).

### 3.18 core.js : éléments à fournir par défaut et données

| Réf | Texte actuel | Proposition | Raison | P |
|---|---|---|---|---|
| core.js:101 | `['Logo et charte actuelle', 'Les fichiers que vous avez, même anciens.']` | `['Logo et charte actuels', 'Tous les fichiers existants, même anciens.']` | Vouvoiement montré aux clients tutoyés ; accord | P1 |
| core.js:101 | `['Photos', 'Équipe, lieux, produits : ce que vous avez déjà.']` | `['Photos', 'Équipe, lieux, produits : celles qui existent déjà.']` | Registre | P1 |
| core.js:102 | `['3 ou 4 marques que vous aimez', 'Des liens ou des captures, avec un mot sur ce qui vous plaît.']` | `['3 ou 4 marques qui inspirent', 'Des liens ou des captures, avec un mot sur ce qui plaît.']` | Registre | P1 |
| core.js:99 | `['prix', 'Rapport qualité prix']` | `['prix', 'Rapport qualité-prix']` | Orthographe | P3 |

### 3.19 core.js : messages d’erreur (neutres en registre, et qui disent quoi faire)

| Réf | Texte actuel | Proposition | Raison | P |
|---|---|---|---|---|
| core.js:446 | `{ error: 'Projet introuvable.' }` | `{ error: 'Projet introuvable, ou accès retiré. Se reconnecter ; si le problème continue, écrire à l’équipe.' }` | Dit quoi faire | P2 |
| core.js:447, 883 ×2 | `'Action inconnue.'` | `'Action impossible. Recharger la page puis réessayer.'` | Dit quoi faire | P2 |
| core.js:996, 998, 999, 1008 ×4 | `'Requête invalide.'` | `'Action impossible. Recharger la page puis réessayer.'` | Dit quoi faire | P2 |
| core.js:455, 473 ×2 | `'Cette étape n’attend pas de validation.'` | `'Cette validation a déjà reçu une réponse. Recharger la page pour voir où elle en est.'` | Lexique ; cas fréquent quand deux personnes du client répondent | P1 |
| core.js:462 | `'Cette validation ne peut plus être annulée. Écrivez à l’équipe.'` | `'Le délai pour annuler est passé. Pour revenir sur cette validation, écrire à l’équipe dans Messages.'` | Registre, dit où écrire | P1 |
| core.js:474 | `'Écrivez ce que vous aimeriez changer.'` | `'Il manque la description des modifications souhaitées.'` | Registre | P1 |
| core.js:512 | `'Cette action se coche toute seule.'` | `'Rien à faire : cette action se coche toute seule dès que l’équipe a l’information.'` | Rassure, explique | P2 |
| core.js:536 | `'La signature passe par le bouton « Signer ».'` | `'La signature passe par le bouton « Signer le document ».'` | Nom réel du bouton | P3 |
| core.js:538, 835 ×2 | `'Écrivez votre nom pour signer.'` | `'Prénom et nom à saisir pour signer.'` | Registre | P1 |
| core.js:539 | `'Cochez la case pour signer.'` | `'Pour signer, la case de consentement doit être cochée.'` | Registre | P1 |
| core.js:547 | `'Indiquez les créneaux qui vous arrangent.'` | `'Il manque les créneaux souhaités (jours et heures).'` | Registre | P1 |
| core.js:576 | `'Indiquez le nom de l’espace de travail Webflow.'` | `'Il manque le nom de l’espace de travail Webflow.'` | Registre | P1 |
| core.js:582 | `'Indiquez le nom de domaine, par exemple entreprise.fr.'` | `'Nom de domaine incomplet : il doit ressembler à entreprise.fr.'` | Registre | P1 |
| core.js:601 | `'Fichier manquant.'` | `'Aucun fichier reçu : relancer l’envoi.'` | Dit quoi faire | P2 |
| core.js:602, 603 ×2 | `'Fichier invalide.'` | `'Fichier refusé : relancer l’envoi depuis l’espace.'` | Dit quoi faire | P3 |
| core.js:614 | `'Ce fichier ne peut plus être retiré. Écrivez à l’équipe.'` | `'Ce fichier ne peut plus être retiré (délai de 24 h passé). Pour le supprimer, écrire à l’équipe dans Messages.'` | Registre, explique pourquoi | P1 |
| core.js:652 | `'Ouvrez d’abord l’espace (offre et registre).'` | `'Ouvrez d’abord l’espace : choisissez l’offre et le tutoiement ou le vouvoiement.'` | Jargon « registre » | P3 |
| core.js:662 | `'Écrivez votre message.'` | `'Message vide : rien n’a été envoyé.'` | Registre (le test `a11y.js:46` vise le message de `app.js:1830`, qui reste inchangé) | P1 |
| core.js:671 | `'Décrivez votre demande.'` | `'Demande vide : il manque la description.'` | Registre | P1 |
| core.js:745 | `'Choisissez une note de 1 à 5.'` | `'Note manquante : choisir de 1 à 5 étoiles.'` | Registre | P1 |
| core.js:750 | `'Dites-nous ce qui n’a pas fonctionné, même en quelques mots.'` | `'Il manque ce qui n’a pas fonctionné : quelques mots suffisent.'` | Registre | P1 |
| core.js:807 | `'Client déjà relancé aujourd’hui.'` | `'Client déjà relancé aujourd’hui : nouvelle relance possible demain.'` | Dit quand | P3 |
| core.js:832, 859 ×2 | `'Cette proposition n’attend pas de réponse.'` | `'Cette proposition a déjà reçu une réponse. Recharger la page pour la voir.'` | Dit quoi faire | P2 |
| core.js:833 | `'Cette proposition a expiré. Écrivez-nous, on la met à jour.'` | `'Cette proposition a expiré. Un message à l’équipe suffit pour recevoir une version à jour.'` | Registre | P1 |
| core.js:834 | `'Cochez la case pour accepter la proposition.'` | `'Pour accepter, la case de consentement doit être cochée.'` | Registre | P1 |
| core.js:870 | `'Écrivez votre commentaire.'` | `'Commentaire vide : rien n’a été envoyé.'` | Registre | P1 |
| core.js:872 | `'Placez le commentaire sur l’image.'` | `'Cliquer sur l’image, à l’endroit à commenter.'` | Dit le geste | P2 |
| core.js:488 | `'Destination invalide.'` | `'Destination inconnue : choisir un bouton dans la liste.'` | Dit quoi faire (agence) | P3 |

---

## 4. Points d’attention pour appliquer ces changements

- **Clés de données** : `'Recette du site'` et `'Rapport mensuel'` sont aussi des clés de `ROLES` (core.js:74, 95) et de la table `due` d’exemple (core.js:214). Les renommer partout en même temps ; les projets déjà enregistrés dans `db.json` gardent l’ancien libellé (prévoir une petite migration ou accepter la différence).
- **Valeurs stockées** : les statuts de demande (« Nouveau », « Proposé », « En cours », « Fait ») sont comparés dans le code. Ne changer que leur affichage.
- **Tests qui citent des textes** : `tests/core.js:105` (« Recette du site »), `tests/agence.js:27` (format « Claire : « … » »), `tests/agence.js:62` (« Mise en ligne J- », bandeau d’état `app.js:1321`, non modifié ici), `tests/core.js:84` (« Louis, Théophile et Clément »), `tests/a11y.js:46` (« Écrivez votre message », `app.js:1830`, non modifié), `tests/waouh.js:42` (« page Presse »), libellés de `tests/accueil.js:47` et `tests/simulation.js:46, 91`.
- **Côté agence, tu ou vous ?** L’interface agence vouvoie (« Choisissez d’abord le client », « vos réglages ») alors que les e-mails internes tutoient (« dans tes espaces clients »). À trancher une fois ; le vouvoiement neutre de l’interface convient si l’équipe grandit.
- **Délai de réponse** : retenir une seule promesse (« sous 24 h ouvrées ») et la reprendre partout (Messages, À valider, Équipe et aide, demandes, avis négatif « dans les 48 heures ouvrées » `app.js:967` à aligner ou à justifier).
