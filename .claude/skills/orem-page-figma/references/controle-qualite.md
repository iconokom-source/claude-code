# Contrôle qualité avant de rendre une page

À dérouler sur chaque section après sa construction (une capture par section, à 1300 px de large), puis une fois sur la page entière.

## Bloquant

- [ ] **Aucun nœud existant modifié.** Tout ce qui a été écrit est dans la frame de la nouvelle page ou dans une frame `sources-visuels/*`.
- [ ] **Aucune section ne reproduit la composition d'une section existante** (liste dans `sections.md`), sauf les reprises autorisées : nav, footer, Méthode O.R.E.M., FAQ.
- [ ] **Visuels du secteur uniquement**, issus des réalisations Orem rattachées au secteur. Aucun visuel d'un autre client pour illustrer le secteur.
- [ ] **Chiffres réels uniquement**, recopiés des pages de cas ou des chiffres officiels (« plus de 40 clients accompagnés depuis 2023 », « 100 % de satisfaction client », « Noté 5/5 »). Pas de chiffre arrondi ou extrapolé, pas de durée ou de prix inventé. Aucun prix sur une page du site.
- [ ] **Avis recopiés mot pour mot** (on peut couper une phrase entière, pas reformuler), avec le bon nom et la bonne fonction.
- [ ] **Collections CMS** : avis, cas, articles, questions et secteurs sont des listes d'éléments identiques qui tiennent avec un nombre variable d'éléments. Pas d'élément « vedette » différent des autres.
- [ ] **Pas de bleu `#092482` en fond** de carte ou de section. Pas d'orange sur fond clair.
- [ ] **Polices** : uniquement Trykker et Lexend Deca, via les styles « Web typeramp ». Vérifier par lecture des nœuds qu'aucun texte n'est en Inter.
- [ ] **Texte** : pas de tiret long, pas de « suivi », pas de « studio », pas de « Image de marque », vouvoiement, guillemets « », espace insécable avant `: ; ! ?` (lancer `typoPass`).
- [ ] **Pas de glyphe manquant** : « ↗ » n'existe pas dans les polices et s'affiche en carré bleu ; utiliser « → », « › », « ↳ ».

## Pixel perfect

- [ ] Conteneurs à 1300 px, nav et rangées de points à 1436 px, page à 1500 px.
- [ ] Points de coin en haut et en bas de chaque section et carte, à la bonne couleur pour le fond.
- [ ] Chaque titre de section a son eyebrow et ses deux tons.
- [ ] Aucun texte coupé, aucun chevauchement imprévu, aucune frame à 10 px de haut (piège `resize()` : repasser la hauteur en `HUG`).
- [ ] Espacements cohérents : 24 px minimum entre un texte et le bloc qui suit dans une carte, 28 à 40 px entre une citation et son auteur.
- [ ] Les titres ne cassent pas sur un mot isolé (élargir le bloc ou raccourcir la ligne).
- [ ] Logos clients en niveaux de gris, ceux du secteur en tête.
- [ ] Alternance clair et sombre sans deux sections sombres consécutives.
- [ ] Footer en dernier enfant de la page.

## SEO (détail dans `seo.md`)

- [ ] Ordre de page conforme à `seo.md` : cas à la une sous le hero, Pourquoi Orem court après la méthode, ressource propriétaire, 2 secteurs proches.
- [ ] Fiche SEO posée au-dessus de la page (title, meta, H1, balisage, maillage).

- [ ] Compter les mots par section (script de comptage sur les nœuds TEXT, hors nav et footer). Viser **au moins 1 000 mots propres au secteur** : les sections reprises ou communes (méthode, offres, avis) ne comptent pas.
- [ ] Le mot-clé principal est dans le H1, l'intro, au moins deux H2 et une question de FAQ ; ses variantes (ex. « site internet d'hôtel », « refonte de site hôtelier ») sont réparties dans les H2 et H3.
- [ ] **Toutes les questions de FAQ ont une réponse rédigée** (6 à 10 questions, 50 à 120 mots chacune). Dans Figma, une seule est ouverte : les autres réponses sont posées dans des calques masqués `faq-reponse` sous chaque question, pour l'intégration.
- [ ] Chaque enjeu a un vrai paragraphe, pas seulement des fragments.
- [ ] Les cas clients du secteur sont décrits avec leur contexte et leurs chiffres, et les articles liés existent sur le blog.

## Prêt pour Webflow

- [ ] Tout en auto-layout, calques nommés (`section-*`, `container`, `*-list`, `*-item`, `h1`, `h3`, `intro`).
- [ ] Un seul H1 par page, contenant le mot-clé de la trame.
- [ ] Les liens de la trame sont présents (CTA iClosed, réalisations, offres, articles, autres secteurs).
