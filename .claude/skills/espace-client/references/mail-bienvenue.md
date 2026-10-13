# Mail de bienvenue

Court, une seule page d'entrée (l'espace Notion) et 3 actions numérotées. `create_draft` en `htmlBody` : liens cliquables avec libellé, jamais d'URL brute. Pas de pièce jointe. Registre tu/vous selon la fiche. Le lien Figma n'est **pas** dans ce mail : il arrive à la phase de design.

**Objet** : `Bienvenue chez ICONOKOM, <Prénom> : ton espace projet est prêt 🚀`

```html
<p>Hello <Prénom>,</p>
<p>Ravis de démarrer <projet> avec toi<, et tes associés>, merci pour la confiance !</p>
<p>Tout le projet se suit ici : 👉 <a href="<Notion>"><b>Ton espace client</b></a><br>
Étapes, planning, documents, contacts : tout y est centralisé.</p>
<p><b>3 actions pour bien démarrer :</b></p>
<ol>
<li><b>Réserve ta visio de cadrage (1 h)</b> → <a href="<cal.com>">Choisir un créneau</a><br>On y cale tes objectifs, ta cible, le plan du site et les premières pistes graphiques.</li>
<li><b>Dépose tes contenus</b> (photos, vidéos, textes, logos, charte…) → <a href="<02-CONTENUS CLIENT>">Ouvrir le Drive</a><br>Plus on a de matière tôt, plus on avance vite.</li>
<li><b>Règle l'acompte de X %</b> (<HT> € HT, soit <TTC> € TTC) → <a href="<facture>">Facture</a> · <a href="<RIB>">RIB</a><br>IBAN : FR76 1695 8000 0188 1420 4296 259 — BIC : QNTOFRP1XXX (titulaire ICONOKOM)</li>
</ol>
<p>Ton devis signé est aussi disponible ici : <a href="<devis>">Devis signé</a>.</p>
<p>Une question d'ici là ? Réponds simplement à ce mail ou écris-nous sur WhatsApp.</p>
<p>À très vite,<br>Louis</p>
```

- Visio déjà fixée : remplacer l'action 1 par « **Visio de cadrage le <jour date> à <heure>** (invitation dans ton agenda) ».
- Pas de signature à ajouter : Gmail ajoute celle d'ICONOKOM. Vérifier que les jours de la semaine correspondent aux dates.
