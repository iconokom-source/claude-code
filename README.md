# claude-code

## Skill `figma-to-webflow`

Intègre une maquette Figma dans un site Webflow existant (espace Iconokom) : Client First, variables, composants, CMS documenté pour le client, responsive tablette/mobile déduit, rapport de ce qui manque.

Sources : [`.claude/skills/figma-to-webflow/`](.claude/skills/figma-to-webflow/SKILL.md)

### Installation
- **Claude.ai / Claude Desktop** : Paramètres > Capacités > Skills > importer `dist/figma-to-webflow.zip`.
- **Claude Code, tous projets** : copier le dossier `.claude/skills/figma-to-webflow` dans `~/.claude/skills/`.
- **Claude Code, ce dépôt** : déjà disponible.

Prérequis : connecteurs Figma et Webflow actifs ; pour les étapes Designer, le site ouvert dans le Designer Webflow avec l'app MCP.

### Utilisation
```
Intègre sur le site Webflow « <Nom du site> » :
https://www.figma.com/design/<fileKey>/<nom>?node-id=<id>   (desktop)
https://www.figma.com/design/<fileKey>/<nom>?node-id=<id>   (desktop, autre page)
```

Après une modification du skill, regénérer l'archive :
```bash
cd .claude/skills && zip -rq ../../dist/figma-to-webflow.zip figma-to-webflow
```
