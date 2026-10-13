Shannen, voici un deal Pipedrive (bloc DEAL) et mon architecture Pipedrive (bloc ARCHITECTURE). Analyse la situation réelle et donne une mise à jour exploitable telle quelle par Claude Code via l'API Pipedrive. Cette conversation est dédiée à ce deal : je reviendrai avec les nouveautés.

Règles impératives :
- Aucune supposition silencieuse. Activité planifiée ≠ exécutée (seules « faite: oui » le sont).
- Séquence jamais démarrée → dis-le. Activités dépendant d'une 1re action jamais faite → séquence à replanifier depuis le vrai point de départ.
- Respect strict des pipelines (Prospection = avant RDV, Vente = sujet commercial réel, Clients = après signature, une seule pipeline). Mal placé → recommande le déplacement.
- Activité sans objet → annuler. Activité à redater → modifier avec nouvelle date.
- Message à envoyer → texte exact, prêt à copier.
- Info manquante risquant une erreur → max 5 questions ; sinon aucune question.
- Utilise uniquement les ID d'étapes de l'architecture et les ID d'activités du bloc DEAL. Dates au format AAAA-MM-JJ, à partir de la date du jour fournie.

Format de réponse : ultra concis, sans blabla. Réponds UNIQUEMENT par un bloc ```json``` conforme à ce schéma (champs vides = [] ou "") :
{"diagnostic":{"pipeline_correcte":"","etape_correcte":"","statut_reel":"","avancement":"","fait":"","planifie_seulement":"","incoherences":"","risque":"","prochaine_etape":""},
"deplacement":{"action":"laisser|deplacer","pipeline_id":0,"stage_id":0,"justification":""},
"statut":{"valeur":"open|lost|won","motif_lost":""},
"champs":[{"champ":"nom exact du champ Pipedrive","action":"ajouter|modifier|vider","valeur":"","justification":""}],
"contact":{"person":{},"organization":{}},
"activites_creer":[{"type":"Appel|Rendez-vous|Tâche|Échéance|Adresse mail|Relance|RDV visio|Envoi propale|Suivi post-propale","sujet":"","date":"","priorite":"Basse|Moyen|Haute","description":""}],
"activites_modifier":[{"id":0,"action":"replanifier|renommer|mettre à jour","date":"","sujet":"","description":"","justification":""}],
"activites_annuler":[{"id":0,"raison":""}],
"notes_ajouter":[""],
"notes_modifier":[{"id":0,"texte":""}],
"messages":[{"destinataire":"","canal":"email|LinkedIn|SMS|WhatsApp|autre","objet":"","texte":"","date_envoi":""}],
"questions":[]}
Les champs absents de Pipedrive (urgence, objections, offre potentielle, date diagnostic, problème principal, motif nurture) : mets-les dans une note « Fiche deal ».
