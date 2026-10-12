# Registre des styles et suppression des doublons

Règle du projet : **deux classes aux propriétés identiques doivent être une seule et même classe.** Pour la garantir, on ne crée aucune classe pendant la construction : on liste d'abord toutes les classes de la maquette entière, on les compare, puis on crée uniquement le résultat fusionné.

## 1. Construire le registre

Fichier `registre-styles.json` dans le dossier de travail, au format suivant :

```json
{
  "classes": [
    {
      "name": "hero_content",
      "parent": null,
      "kind": "custom",
      "usage": ["accueil/hero"],
      "styles": {
        "main": {
          "noPseudo": {
            "display": "flex",
            "flex-direction": "column",
            "row-gap": "var(Gap / Medium)",
            "max-width": "var(Max Width / Large)"
          }
        },
        "medium": { "noPseudo": { "align-items": "center" } }
      }
    },
    {
      "name": "margin-medium",
      "parent": "margin-bottom",
      "kind": "utility",
      "styles": { "main": { "noPseudo": { "margin-bottom": "var(Space / Medium)" } } }
    }
  ]
}
```

- `kind` : `utility` (classe Client First globale), `custom` (classe `[composant]_[élément]`), `combo` (classe `is-*`, avec `parent` renseigné), `structure` (`section_*`, `padding-global`…).
- `styles` : clé = breakpoint (`main`, `medium`, `small`, `tiny`), puis pseudo-état (`noPseudo`, `hover`, `focus-visible`…), puis propriétés CSS en **notation longue** (`padding-top`, jamais `padding`).
- Une valeur liée à une variable s'écrit `var(Nom / De / La Variable)`. Au moment de créer le style, elle est remplacée par `variable_as_value` avec l'identifiant noté dans le journal.
- `usage` : où la classe est utilisée (page/section), pour savoir quoi vérifier si on la modifie.

Pour remplir le registre, parcourir toutes les sections de toutes les pages et, pour chaque élément, décider (voir `client-first.md`, partie 3) : utilitaires seuls, ou utilitaires + une classe personnalisée qui ne porte que ce qui manque.

## 2. Analyser le registre

```bash
python3 scripts/registre_styles.py registre-styles.json
```

Le script normalise les propriétés (px → rem, couleurs en minuscules, `0px` → `0`) puis signale :

1. **Doublons exacts** : classes aux styles identiques sur tous les breakpoints et états → à fusionner en une seule.
2. **Classes remplaçables par des utilitaires** : classe personnalisée dont les styles correspondent exactement à 1 à 3 classes utilitaires du registre → supprimer la classe et utiliser les utilitaires.
3. **Quasi-doublons** : classes qui ne diffèrent que par une seule propriété → candidates à une classe commune + combo `is-*`, ou à un alignement sur une même valeur si l'écart vient d'une imprécision de la maquette.
4. **Valeurs en dur** : couleur, taille de texte, espacement ou rayon écrits en valeur brute au lieu d'une variable → à relier à une variable.

## 3. Appliquer la fusion

Pour chaque groupe de doublons :
- Garder un seul nom, le plus générique et le plus juste par rapport au rôle. Si les classes viennent de deux composants différents, créer un préfixe partagé (`card-grid_`, `media_`) plutôt que de garder le nom d'un des deux composants.
- Mettre à jour `usage` et supprimer les autres entrées.
- Relancer le script jusqu'à ce qu'il ne signale plus de doublons exacts ni de valeurs en dur.

Les quasi-doublons sont tranchés selon cette règle : écart de 4 px ou moins, ou couleur quasi identique → aligner sur la valeur la plus fréquente (le responsive passe avant le pixel perfect) ; écart plus grand et voulu → classe commune + combo.

## 4. Pendant la construction

- Avant de créer un style dans Webflow : `query_styles` sur son nom. S'il existe, le réutiliser ; s'il existe avec des propriétés différentes et qu'il n'a pas été créé par le skill, **ne pas l'écraser** (point d'arrêt n° 2) : créer la classe sous un autre nom et le signaler.
- Si un besoin nouveau apparaît en cours de route, l'ajouter d'abord au registre, relancer le script, puis seulement créer la classe.
- En fin de projet (phase 8), relire les styles réels du site (`get_styles` avec `include_properties`) et vérifier qu'aucune classe parasite (`div-block-*`, `text-block-*`, noms suffixés ` 2`) n'a été créée. Les classes parasites créées par le skill sont supprimées.
