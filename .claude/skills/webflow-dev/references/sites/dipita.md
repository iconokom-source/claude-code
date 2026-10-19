# Dipita (Dipita Business Consulting)

- site_id : `6a0f2a019c64510e9d8cee04` · workspace : « Dipita Business Consultings Workspace » (ICONOKOM y est **invité / Guest**) · domaine : www.mydipita.fr · sous-domaine : dipita-business-consulting.webflow.io · locale : FR-FR
- Plan du site : **Basic** (constaté le 2026-10-19) → **pas de CMS**. Un blog CMS demande de passer le site en plan CMS (ou Business) — à faire valider et payer par le client avant de créer la moindre collection. Alternative sans CMS : pages statiques par article (déconseillé au-delà de quelques articles).
- Accès :
  - Connecteur MCP Webflow : site **absent** de `list_sites` au 2026-10-19, et `get_site` renvoie 404 même après réautorisation du connecteur. L'autorisation OAuth ne couvre que le workspace ICONOKOM : avec un accès **Guest**, le workspace du client n'est pas proposé. Solutions : se faire passer en membre du workspace Dipita (par le client), ou faire autoriser l'app par le propriétaire du workspace, ou transférer temporairement le site dans le workspace ICONOKOM.
  - Jeton API du site (Data API v2, généré le 2026-10-19, nom « API Dipita ») : variable `WEBFLOW_API_KEY_DIPITA`, à ranger dans le coffre (skill `cles-api`). Le jeton couvre pages, CMS, assets, custom code, contenu des pages — **pas** la liste des styles ni les interactions (réservés au MCP / Designer).
  - Réseau des sessions cloud : autoriser `api.webflow.com` et `www.mydipita.fr` si on passe par l'API ou le CSS publié.
- Dernier audit : **à faire** (gabarit : `_modele.md`).

## Premières observations (capture du Designer, 2026-10-19)
- Pages : Accueil, Coaching individuel, Formation collective, À propos.
- Navbar en pilule blanche arrondie (bordure fine) : logo rond « D DIPITA » bleu nuit, liens en capitales, CTA « Prendre RDV » pilule bleu nuit avec pastille flèche ↗ bleu plus clair.
- Hero : grande photo plein cadre arrondie avec dégradé sombre (classe combo « dégradé »), preuve sociale (avatars + « +500 professionnels… »), H1 blanc très grand, sous-titre blanc, 2 CTA pilule : bleu nuit « Coaching individuel », jaune « Formation collective », chacun avec pastille flèche.
- Police : sans-serif géométrique serrée (à confirmer à l'audit).

## Historique des modifications via MCP
- (aucune)
