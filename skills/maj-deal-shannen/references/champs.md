# Champs deal Pipedrive (ICONOKOM) — nom → clé API

Standard : value (Valeur) · expected_close_date (Date de gain attendue) · lost_reason (Raison de la perte : Mauvais ciblage / Projet reporté / Autre prestataire / Pas intéressé / Pas de budget, ou texte) · person_id · org_id · owner_id.

| Champ | Clé | Options |
|---|---|---|
| Source du prospect | ce5fd47490ca4863c992599a1db8a32141ae11cc | Apporteurs d’affaires · Bouche-à-oreille / Recommandation · Référencement via un site client · Clients existants / Upsell · Prospection freelancers · Contenu LinkedIn (inbound généré par vos posts) · Setting LinkedIn (outbound ciblé) · Collaboration agence |
| Canal principal | b1ab143a4df603c2e1c14a0c5c01b2b170b8298d | Canal direct · Canal inbound · Canal outbound · Canal partenaires |
| Canal d'entrée | 452880589faf0e39ec7b2bc0b3296bf4105eb307 | email · LinkedIn · email + LinkedIn · email + LinkedIn + call · recommandation · base existante |
| Température | b9931ce8353e969dd7a0ab3d661c9aab2987caba | ancien client · ancien lead · close lost · tiède · froid · très froid |
| Décideur | acb0e59d2778655d5786e6f82faba6fc56c227d9 | texte |
| Douleur principale | e35fa4c2aa6b5bb89a789970ed433d09ffe57a3b | message flou · crédibilité faible · site daté · conversion faible · image sous-niveau · SEO faible · site dort / génère peu · montée en gamme non traduite |
| Enjeu business probable | 3e35bd217a54aa6204049f4f11cfb84de7fd517d | plus de demandes qualifiées · raccourcir le cycle de vente · mieux justifier le premium · améliorer la conversion · soutenir la croissance · améliorer l'acquisition organique |
| Hypothèse de perte business | 51116415aeb34d3af69de619473b411ab7c42193 | texte |
| Angle d'accroche brut | ee6c7507c8c13bbf0fe2ecf522f5c2c9a5caba40 | texte |
| Fit ICP | 3fe8f8137783dd364273c12a0e572561ce9d7f81 | nombre |
| Priorité | 2c74b2b48130ed113c7b12e21f62ec015e73073f | haute · moyenne · basse |
| Décision | ec3265d0fd280088d95bbcc1f2bda2c989cfa16b | séquence maintenant · Loom plus tard · nurture · rejet |
| Dernière action | 677df1bbf3dccf694516aa8f1e331aba5e59f757 | texte |
| Date dernière action | ec836efc12dc4a202eafb481ed7a3c8a6264a22d | date |
| Prochaine action | 2e1655c7ae28352c705380c99bd13ef98a59787b | envoyer message 1 · relancer email · envoyer Loom · relancer LinkedIn · brief associé call · caler RDV · nurture 30 jours · nurture 90 jours |
| Date prochaine action | 8a3814dc6bfefa566882d7c42d07ff71aedf8b75 | date |
| Date de relance | ea01ad8936a404b3c858f459c0f3122da351c9ff | date |
| Owner (exécution) | cc1759a59f418358ce08b7de2e8f540ad0246313 | Louis · Associé |
| Assigné à | 035067cc8f58dc29d1bfce5cf0d07bfda2c7cc65 | Louis · Théophile · Louis + Théophile |
| Loom prévu | 4a4eb39a140e5e50ec91cb94b24e5fb62829b97d | oui · non · peut-être |
| Appel associé | 977fc59839474bc39eb82431e8570c52b310e5ab | oui · non · relance seulement |
| Callable ? | 496cab6e669536afa6689cc6328036ca0e0b84f9 | Oui · Non |
| Niveau de sujet | 8c1927c635d30ef81cbd0d85c7f2bf2a77cf65bb | Aucun · Intuition légère · Sujet reconnu · Sujet prioritaire |
| Issue du warm call | 5ebd957c5387ed30471402d6a6870188707efcf3 | Sujet réel · Pas réel · À revoir plus tard |
| Infos complémentaires | 06f71f6d979987a7853eb14e2391a1933852d3a8 | texte |
| Lien LinkedIn | ce72ee51417089afe9e206c8a5906b2e260317a5 | texte |
| Secteur | c45a4a885d1c896c80ed147de4024ba252065d34 | texte |
| Ville | 761e3014995f7e1f6737044479fd14b30de8e162 | Paris · Lille · Lyon · Bordeaux · Autre |
| Taille entreprise | 6155543d7f876aa3c9a72bf76bb7f7e6e319cfec | 1-10 · 11-50 · 51-200 · 200+ |
| Signal principal | 9f5c8eb5330b0c0cdba1380dffe371aeb9ce68b1 | voir Pipedrive |
| Date du signal | bf91c50484cf9c11153a8dc74641cdecca3742a4 | date |

Enum : envoyer l'ID d'option ; si l'outil n'accepte que le libellé, le libellé exact ci-dessus.

Types d'activité (libellés) : Appel · Rendez-vous · Tâche · Échéance · Adresse mail · Déjeuner · Relance · RDV visio · Envoi propale · Suivi post-propale. Priorité : Basse · Moyen · Haute.

Absents de Pipedrive (→ note « Fiche deal ») : date diagnostic, problème principal (si hors liste Douleur), urgence, objections, offre potentielle, motif nurture / date de réactivation (utiliser aussi Date de relance).
