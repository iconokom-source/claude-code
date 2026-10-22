# Pages secteur « identité visuelle » (/secteurs/<slug>/branding)

Trame de l'expert SEO du 22 octobre 2026, appliquée sur la page modèle `/secteurs/hotellerie/branding` (nœud `3880:5682`, x = 19800). Fiche SEO `3883:5792`, tableau États `3883:5808`, bibliothèque « Composants / pages identité visuelle » `3879:5682` (x = 19800, y = 7482).

## Règles propres à ces pages

- **Visuels de DA d'abord** (demande de Louis) : logo, monogramme, palette, typographies, affiches, papeterie, stand, livre, pictogrammes, déclinaisons. Peu ou pas de captures de site : le site appartient à la page agence web sœur.
- **Mot-clé** : `identité visuelle <secteur>` en principal (non mesurable, c'est un cadre), dans le H1 et un seul H2 (l'approche). Secondaires mesurés : refonte identité visuelle (70), agence direction artistique (50), identité visuelle entreprise (70), création identité visuelle (260), branding B2B (70), identité visuelle association (10). Jamais « Agence » en tête du title ou du H1.
- **Title** : `Identité visuelle <secteur> : branding et direction artistique` (ou `… : branding et DA` pour les noms longs), mesuré ≤ 580 px. **Meta** : `Identité visuelle pour <secteur> : logo, système graphique et direction artistique. Cas clients : <2 noms max>.`, mesurée ≤ 920 px.
- **Preuve** : le cas à la une est celui dont l'étude de cas documente une refonte d'identité ou de DA (pas seulement un site). Ce qui est écrit dans « Ce qui a été livré » doit se voir sur les visuels. Pas d'avant / après tant qu'aucun visuel « avant » n'est publié.
- **Livrables** : ceux de l'offre réelle (agence-orem.fr/offres/image-de-marque) : plateforme de marque, identité visuelle (logo, système graphique), système typographique et chromatique, direction artistique (principes photo), design system, déclinaisons utiles, charte de marque. Ne jamais promettre naming, architecture de marque ou stratégie complète.
- **Anti-duplication avec la page sœur** : aucun H2 commun, aucun H2 sur le site, le CMS, la réservation ou le SEO ; pas de promesse de trafic ; pas de « charte graphique » comme promesse centrale.
- **Maillage** : lien sœur dans le corps (étape 4, ancre « site web pour <secteur> »), lien offre (ancre « Direction artistique »), études de cas, 2 identités voisines (ancres « Identité visuelle pour <secteur> »).

## Ordre des sections (page modèle)

| # | Section | Composition |
|---|---|---|
| 1 | Hero | dégradé d'ambiance ; eyebrow, H1 deux tons « Identité visuelle pour <secteur> : <promesse> », chapô sans le mot-clé, bouton diagnostic + lien vers le cas à la une, note Google ; **mosaïque DA** 636 px (2 carrés de 306 + 1 paysage 636 × 430) avec légende flottante ; bandeau de logos |
| 2 | Cas à la une | fond encre ; colonne texte 420 (eyebrow orange, H2 « <Client> : ce qui a changé. », H3 Le contexte / Ce que nous avons changé / Ce qui a été livré, bouton blanc vers l'étude) ; **galerie d'identité** 816 px (paysage 816 × 552, 3 carrés de 256, 2 paysages 396 × 268) |
| 3 | Enjeux d'image | fond clair ; en-tête deux tons + intro ; grille 2 × 2 d'instances `carte-enjeu-image` (numéro, H3 métier, diagnostic, « Pour l'identité », indicateur) |
| 4 | Approche | fond blanc ; H2 avec le mot-clé ; 4 instances `etape-identite` (grand chiffre Trykker, H3 « Cadrage / Direction artistique / Déclinaison / Mise en œuvre : <spécifique> ») |
| 5 | Autres identités | collection CMS d'instances `carte-identite` + grand visuel d'identité ; à supprimer si le secteur n'a qu'un cas |
| 6 | Livrables | fond encre ; 6 instances `livrable-identite` à filets + lien vers l'offre ; un visuel de système (palette ou tokens) |
| 7 | FAQ | section officielle clonée, 5 questions-requêtes de l'identité, réponses de 40 à 60 mots, aucun prix |
| 8 | CTA | « Parlons de l'image de <votre secteur>. », un seul bouton |
| 9 | Identités voisines | 2 liens « Identité visuelle pour <secteur voisin> » |

## Pages construites (22 octobre 2026)

| Page | Nœud | x | Format | Cas à la une / autres |
|---|---|---|---|---|
| /secteurs/hotellerie/branding | 3880:5682 | 19800 | complet | Huchet-Demorge / Hôtel Eiffel Ségur |
| /secteurs/medias/branding | 3885:5902 | 21500 | complet | Le Crayon / Riskintel, Aktionnaire (Bund Médias écarté : pas d'identité documentée) |
| /secteurs/cabinets-rh/branding | 3884:10082 | 23200 | allégé | Concilium et Le Recruteur |
| /secteurs/esn/branding | 3897:6707 | 24900 | allégé | Logical Conseils |
| /secteurs/sante/branding | 3886:11938 | 26600 | allégé + cadre déontologique | Sleepee by tim (brouillon Webflow) |
| /secteurs/coachs-formateurs/branding | 3886:6420 | 28300 | complet | SforSales Academy / Dipita |
| /secteurs/associations-collectivites/branding | 3886:12360 | 30000 | complet | Les Ombres / Impulsions Métropole Sud |
| /secteurs/production-audiovisuelle/branding | 3886:6820 | 31700 | allégé | Dim Sum (texte de l'étude centré sur l'UX : seul ce qui se voit est décrit) |
| /secteurs/agences-communication/branding | 3886:6026 | 33400 | complet | 24 Degrés / Orem |

Fiches SEO au-dessus de chaque page, tableaux États à y = 11686, sources `sources-visuels/branding-<slug>` à x = page.x, y = 15000. Prochaine page : x = 35100.

## Pièges rencontrés

- **Format allégé** : en retirant le bloc Livrables, on perd le lien vers l'offre. L'ajouter sous les étapes de l'approche (`lien-offre`, « Notre offre Direction artistique → »).
- **FAQ réduite à 3 questions** : le clone de la FAQ à 5 questions laisse des réponses orphelines et des filets vides ; les supprimer avec leurs conteneurs, puis vérifier que le dernier élément garde son filet.
- **Nom de secteur long** : « … : branding et direction artistique » dépasse 580 px (cabinet de recrutement 633, agence de communication 662, coach et formateur 595) : passer à « … : branding et DA ».
- **H1** : toujours « Identité visuelle pour <secteur> : » (y compris « pour la santé »), la même formule que l'ancre des pages voisines.
- **Visuels hors création Orem** : affiche de programme d'un client, portraits de banque d'images utilisés par le client : ne pas les mettre en avant comme identité créée par Orem.
