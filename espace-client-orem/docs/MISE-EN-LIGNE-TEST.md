# Mettre en ligne la version de test

Objectif : montrer l'espace client à Théophile et Clément sur **https://espace.agence-orem.fr**, avec tout en vrai (connexion par e-mail, envois, Figma, Pipedrive, Abby, Qonto, assistant), pour recueillir leurs retours avant l'ouverture aux clients.

Un bandeau orange « Version de test » reste affiché en haut de l'espace. Les e-mails ne partent qu'aux adresses `@agence-orem.fr` : un vrai client ne peut rien recevoir par erreur. Pour élargir, il suffit de modifier `MAIL_ALLOW` (voir « Réglages utiles »).

Durée : environ 30 minutes, dont la propagation du DNS.

---

## Étape 1 : le DNS (5 minutes, puis jusqu'à 1 heure de propagation)

Chez Hostinger (hPanel › Noms de domaine › agence-orem.fr › DNS), ajouter :

| Type | Sous-domaine | Cible |
|---|---|---|
| A | `espace` | `188.245.37.4` |

Le site agence-orem.fr (Webflow) n'est pas touché : seul le sous-domaine `espace` pointe vers le VPS.

## Étape 2 : les e-mails (10 minutes)

Les e-mails génériques partent de **contact@agence-orem.fr** (codes de connexion, récaps de 18 h, relances). Ceux qu'un membre de l'équipe envoie en son nom partent de **son adresse** (invitation d'un client, message, vidéo, validation demandée), et la réponse du client lui revient directement.

**Choix recommandé : Brevo**
1. Brevo › Expéditeurs, domaines et IP dédiées › Domaines : ajouter `agence-orem.fr` et suivre les instructions (enregistrements DKIM et SPF à ajouter dans la zone DNS, comme à l'étape 1). Une fois le domaine authentifié, toutes les adresses `@agence-orem.fr` peuvent envoyer.
2. Brevo › Paramètres › Clés API : créer une clé « Espace client Orem ».
3. La ranger dans le coffre Notion sous le nom `BREVO_API_KEY_OREM`, et sur le VPS dans `/root/pipeline/automatisation/.env` (même nom). Le script d'installation la reprend tout seul.

**Autre choix : Google Workspace (SMTP)**
Si vous préférez envoyer par Gmail : sur le compte `contact@agence-orem.fr`, créer un mot de passe d'application, puis ajouter louis@, theophile@ et clement@ dans « Envoyer des e-mails en tant que ». Après l'installation, dans `/etc/espace-orem.env` : `MAIL_PROVIDER=smtp`, `SMTP_USER=contact@agence-orem.fr`, `SMTP_PASSWORD=<mot de passe d'application>`.

## Étape 3 : un jeton GitHub en lecture (3 minutes)

GitHub › Settings › Developer settings › Fine-grained tokens › Generate new token :
- Repository access : seulement `iconokom-source/claude-code`.
- Permissions : Contents, **Read-only**.
- Durée : 90 jours.

Le script le demande une seule fois et le garde sur le VPS pour les mises à jour.

## Étape 4 : l'installation (5 minutes)

Sur le Mac :

```bash
ssh root@188.245.37.4
```

Puis sur le VPS (le script est dans le dépôt ; la première fois, on le récupère avec le jeton de l'étape 3) :

```bash
export GITHUB_TOKEN=<jeton de l'étape 3>
curl -fsSL -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github.raw" \
  "https://api.github.com/repos/iconokom-source/claude-code/contents/espace-client-orem/app/deploy/installer.sh?ref=claude/blissful-pasteur-u33w5x" -o installer.sh
bash installer.sh
```

Le script vérifie Node.js, récupère le code, crée la configuration `/etc/espace-orem.env` en reprenant les clés déjà présentes sur le VPS (Pipedrive, Abby, Figma, Claude, Brevo), installe le service et branche le HTTPS. Il s'arrête avec un message clair s'il manque quelque chose (DNS pas encore propagé, aucun service d'e-mail…) : on corrige, et on relance la même commande.

**Mettre à jour** après de nouvelles modifications : `bash /opt/espace-orem/espace-client-orem/app/deploy/installer.sh` (les comptes et les fichiers déposés sont conservés).

## Étape 5 : vérifier (5 minutes)

1. Ouvrir https://espace.agence-orem.fr : le bandeau orange « Version de test » s'affiche.
2. Se connecter avec `louis@agence-orem.fr` : le code arrive par e-mail, de contact@agence-orem.fr.
3. **Réglages › Tester la version en ligne** :
   - « M'envoyer un e-mail générique » : arrive de contact@agence-orem.fr ;
   - « M'envoyer un e-mail en mon nom » : arrive de louis@agence-orem.fr ;
   - « Tester » sur chaque outil connecté : Pipedrive, Qonto, Figma, assistant Claude répondent « Connexion réussie » avec le nom du compte. Rien n'est créé ni modifié par ces tests.

---

## Ce que Théophile et Clément peuvent tester

Les espaces d'exemple (Maison Lumen, Huchet-Demorge, Cabinet Varenne) sont présents. Leurs clients sont fictifs : leurs e-mails ne partent pas (hors de la liste autorisée), on les voit dans « Réglages › E-mails envoyés ».

| Parcours | Comment |
|---|---|
| Arrivée d'un client | « Nouvel espace client » avec une adresse de l'agence comme contact (ex. `theophile@agence-orem.fr`), puis ouvrir l'invitation reçue : un clic, la visite guidée, « Faisons connaissance ». |
| Vue client | Sur n'importe quelle fiche client : « Voir comme le client ». |
| Dépôts lourds | Côté client, glisser un dossier entier (plusieurs Go) : il part par morceaux et reprend tout seul si la connexion coupe. |
| Messages, vidéos Loom, validations | Bouton « Ajouter » : l'e-mail part de l'adresse de celui qui ajoute. |
| Figma | Fiche client › Accès et infos › Outils de l'agence : coller l'adresse du fichier Figma, enregistrer, puis « Importer les visuels depuis Figma ». Les maquettes en direct se règlent dans l'onglet Liens. |
| Pipedrive | Dans Pipedrive › Réglages › Webhooks : « Deal mis à jour » vers `https://espace.agence-orem.fr/api/hooks/pipedrive`, identifiant `orem`, mot de passe = `PIPEDRIVE_WEBHOOK_SECRET` (dans `/etc/espace-orem.env`). Une affaire gagnée prépare un espace. |
| Abby, Qonto | Réglages › Outils connectés › « Synchroniser » : import des factures, paiements reçus (lecture seule). |
| Bilans mensuels | Fiche Huchet-Demorge › Évolution : publier un bilan avec le PDF présenté en visio. |

Les retours se notent directement dans l'espace (message à l'équipe) ou dans la conversation Claude : chaque retour devient une correction.

## Réglages utiles (`/etc/espace-orem.env`, puis `systemctl restart espace-orem`)

| Réglage | Effet |
|---|---|
| `MAIL_ALLOW=agence-orem.fr,gmail-de-test@gmail.com` | Ajoute des adresses autorisées à recevoir des e-mails pendant les tests. |
| `TEST_MODE=0` et `MAIL_ALLOW=` | Passage en production (plus de bandeau, e-mails à tous). **Seulement après validation de Louis.** |
| `MAX_UPLOAD_GB`, `PROJECT_QUOTA_GB` | Limites facultatives ; par défaut aucune (le serveur garde 2 Go libres sur son disque). |

Journal en direct : `journalctl -u espace-orem -f`. Données : `/var/lib/espace-orem` (base et fichiers déposés) ; à inclure dans les sauvegardes du VPS.

## Sécurité

- Les clés ne sont écrites que dans `/etc/espace-orem.env` (lisible par root et le service seulement), jamais dans le dépôt.
- Rappel du coffre Notion : des clés y sont marquées « à régénérer » (collées dans une conversation le 14/10). Les régénérer avant la mise en production, puis mettre à jour le coffre, `/root/pipeline/automatisation/.env` et `/etc/espace-orem.env`.
