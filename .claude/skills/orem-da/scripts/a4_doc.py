import re, html
OUT='/home/user/claude-code/offres-orem/'
CSS=r'''
@font-face{font-family:'Trykker';font-weight:400;src:url(assets/fonts/trykker-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Trykker';font-weight:400;src:url(assets/fonts/trykker-latin-ext.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+A720-A7FF}
@font-face{font-family:'Lexend Deca';font-weight:100 900;src:url(assets/fonts/lexend-deca-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Lexend Deca';font-weight:100 900;src:url(assets/fonts/lexend-deca-latin-ext.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+A720-A7FF}
:root{--ink:#000012;--paper-2:#f8f8f7;--muted:rgba(67,66,66,.75);--light:#f2f2f2;--light-muted:rgba(242,242,242,.7);--orange:#ff6200;--accent:#092482;--stroke:#cdcdcd;--serif:'Trykker',Georgia,serif;--sans:'Lexend Deca',system-ui,sans-serif}
@page{size:A4;margin:20mm 18mm 20mm 18mm;
  @bottom-left{content:"Orem · @@TITLE@@";font-family:'Lexend Deca';font-size:7.5pt;color:rgba(67,66,66,.7)}
  @bottom-right{content:counter(page);font-family:'Lexend Deca';font-size:7.5pt;color:#092482}}
@page:first{margin:0;@bottom-left{content:none}@bottom-right{content:none}}
*{box-sizing:border-box;margin:0;padding:0}
html{background:#e9e9e9}
@media print{html{background:#fff}}
.sh{break-inside:avoid;break-after:avoid;page-break-after:avoid}
.sh+*{break-before:avoid}
h3+*{break-before:avoid}
body{font-family:var(--sans);font-size:9.6pt;line-height:1.5;letter-spacing:-.01em;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact;font-weight:350}
@media screen{body{width:210mm;margin:24px auto;background:#fff;padding:0 18mm 20mm;box-shadow:0 0 0 1px #ddd}.cover{margin:0 -18mm}}
b,strong{font-weight:500}
.cover{width:210mm;height:297mm;position:relative;background:#000 url(assets/blob-chapter.jpg) 70% center/cover;color:var(--light);break-after:page;overflow:hidden}
.cover .logo{position:absolute;left:18mm;top:18mm;width:16mm}
.cover .top{position:absolute;right:18mm;top:20mm;text-align:right;font-size:8.5pt;color:var(--light-muted)}
.cover .mid{position:absolute;left:18mm;right:18mm;top:92mm}
.cover .eyebrow{color:var(--orange);font-size:10pt;margin-bottom:6mm}
.cover h1{font-family:var(--serif);font-weight:400;font-size:46pt;line-height:1.08;letter-spacing:-.02em}
.cover .sub{font-family:var(--serif);font-size:15pt;line-height:1.35;margin-top:6mm;color:var(--light);max-width:150mm}
.cover .ess{position:absolute;left:18mm;right:18mm;bottom:20mm;background:rgba(255,255,255,.07);border:1px solid rgba(242,242,242,.18);border-radius:5mm;padding:7mm 8mm}
.cover .ess .lab{color:var(--orange);font-size:8.5pt;margin-bottom:3mm}
.cover .ess p{font-size:10.5pt;line-height:1.55;color:var(--light)}
section{margin-top:12mm}
section:first-of-type{margin-top:0}
.num{color:var(--accent);font-size:8.5pt;margin-bottom:2mm}
h2{font-family:var(--serif);font-weight:400;font-size:21pt;line-height:1.15;letter-spacing:-.015em;margin-bottom:4mm;break-after:avoid}
h3{font-family:var(--serif);font-weight:400;font-size:13pt;margin:6mm 0 2.5mm;break-after:avoid}
p+p{margin-top:2.5mm}
.lead{font-size:10.5pt;color:var(--muted);margin-bottom:4mm}
ul.dash{margin:2mm 0 2mm 0;list-style:none}
ul.dash li{position:relative;padding-left:5mm}
ul.dash li+li{margin-top:1.2mm}
ul.dash li::before{content:"";position:absolute;left:1mm;top:.62em;width:1.4mm;height:1.4mm;border-radius:50%;background:var(--accent)}
table{width:100%;border-collapse:collapse;margin:3mm 0;break-inside:auto}
tr{break-inside:avoid}
th{text-align:left;font-weight:400;color:var(--accent);font-size:8.3pt;padding:2mm 3mm;border-bottom:1px solid var(--ink)}
td{padding:2.6mm 3mm;border-bottom:1px solid var(--stroke);vertical-align:top}
td:first-child{font-weight:500;width:30%}
table.c3 td:first-child,table.c4 td:first-child{width:22%}
table.cmp td{text-align:left}
table.cmp td:first-child{color:var(--muted);font-weight:400}
td br{content:"";display:block;margin-top:1mm}
.quote{border-left:2px solid var(--accent);padding:1mm 0 1mm 5mm;margin:5mm 0;font-family:var(--serif);font-size:12.5pt;line-height:1.4;break-inside:avoid}
.callout{background:var(--ink);color:var(--light);border-radius:4mm;padding:6mm 7mm;margin:5mm 0;break-inside:avoid}
.callout .lab{color:var(--orange);font-size:8.3pt;margin-bottom:2mm}
.callout p{font-family:var(--serif);font-size:12pt;line-height:1.45}
.cards{display:grid;gap:3.5mm;margin:4mm 0;break-inside:avoid}
.card{background:var(--paper-2);border-radius:3mm;padding:5mm}
.card .t{font-family:var(--serif);font-size:12.5pt;color:var(--accent);margin-bottom:2mm}
.card p{font-size:9pt;color:var(--muted)}
.prices{display:grid;grid-template-columns:repeat(3,1fr);gap:3.5mm;margin:4mm 0;break-inside:avoid}
.prices .card .p{font-family:var(--serif);font-size:20pt;margin:1mm 0 2mm}
.duo{display:grid;grid-template-columns:1fr 1fr;gap:3.5mm;margin:4mm 0;break-inside:avoid}
.duo .card .lab{color:var(--accent);font-size:8.3pt;margin-bottom:1.5mm}
.duo .card p{color:var(--ink);font-size:9.6pt}
.final{margin-top:12mm;background:var(--paper-2);border-radius:4mm;padding:8mm;break-inside:avoid}
.final .lab{color:var(--accent);font-size:8.3pt;margin-bottom:3mm}
table.pains td:first-child{width:7%;color:var(--accent)}
table.pains td:nth-child(2){font-weight:500;width:24%}
table.pains td:last-child{font-family:var(--serif);font-size:9.8pt;font-style:normal}
table.c3 td:nth-child(2){font-weight:350}
.final p{font-family:var(--serif);font-size:14pt;line-height:1.4}
'''
def md(t):
    t=html.escape(t,quote=False)
    t=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',t)
    return t.replace('\n','<br>')
def render(doc):
    o=[]
    for b in doc['blocks']:
        k=b[0]
        if k=='sec':
            o.append(f'</section><section><div class="sh"><p class="num">{b[1]}</p><h2>{md(b[2])}</h2></div>')
        elif k=='lead': o.append(f'<p class="lead">{md(b[1])}</p>')
        elif k=='p': o.append(f'<p>{md(b[1])}</p>')
        elif k=='h3': o.append(f'<h3>{md(b[1])}</h3>')
        elif k=='ul': o.append('<ul class="dash">'+''.join(f'<li>{md(x)}</li>' for x in b[1])+'</ul>')
        elif k=='quote': o.append(f'<div class="quote">« {md(b[1])} »</div>')
        elif k=='callout': o.append(f'<div class="callout"><p class="lab">{b[1]}</p><p>{md(b[2])}</p></div>')
        elif k=='table':
            hdr,rows=b[1],b[2]; cls=b[3] if len(b)>3 else ''
            th=''.join(f'<th>{md(h)}</th>' for h in hdr) if hdr else ''
            o.append(f'<table class="{cls}">'+(f'<thead><tr>{th}</tr></thead>' if th else '')+'<tbody>'+''.join('<tr>'+''.join(f'<td>{md(c)}</td>' for c in r)+'</tr>' for r in rows)+'</tbody></table>')
        elif k=='cards':
            n=len(b[1]); o.append(f'<div class="cards" style="grid-template-columns:repeat({n},1fr)">'+''.join(f'<div class="card"><p class="t">{md(t)}</p><p>{md(d)}</p></div>' for t,d in b[1])+'</div>')
        elif k=='prices':
            o.append('<div class="prices">'+''.join(f'<div class="card"><p class="t">{md(t)}</p><p class="p">{md(pr)}</p><p>{md(d)}</p></div>' for t,pr,d in b[1])+'</div>')
        elif k=='duo':
            o.append('<div class="duo">'+''.join(f'<div class="card"><p class="lab">{md(l)}</p><p>{md(t)}</p></div>' for l,t in b[1])+'</div>')
        elif k=='final': o.append(f'<div class="final"><p class="lab">À retenir</p><p>« {md(b[1])} »</p></div>')
    body=''.join(o).replace('</section>','',1)+'</section>'
    css=CSS.replace('@@TITLE@@',doc['short'])
    return f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{doc['short']} · Orem</title><style>{css}</style></head><body>
<div class="cover"><img class="logo" src="assets/logo-white.png" alt="Orem"><p class="top">{doc.get("kicker","Document interne · Offres Orem")}<br>Orem · Lille / Paris · {doc.get("date","Septembre 2026")}</p>
<div class="mid"><p class="eyebrow">{doc['eyebrow']}</p><h1>{doc['title']}</h1><p class="sub">{md(doc['sub'])}</p></div>
<div class="ess"><p class="lab">{doc.get("esslab","L’essentiel en 30 secondes")}</p><p>{md(doc['ess'])}</p></div></div>
{body}</body></html>'''

DOCS=[]
DOCS.append(dict(file='Offre-1-Conseil-Orem',short='Offre 1 · Conseil',eyebrow='Le « O » d’O.R.E.M. · Orienter',title='Offre 1<br>Conseil',
sub='L’offre socle sur laquelle repose tout le reste.',
ess='Nous prenons une entreprise qui vaut mieux que ce qu’elle montre, nous diagnostiquons où se situe le flou (message, offre, différence, présence), et nous livrons un plan clair et priorisé qui sert de base à tout le reste : image, site, acquisition. Toute collaboration commence par le Conseil. La seule question est : est-il facturé seul, ou absorbé par l’offre Site ou Image ?',
blocks=[
('sec','01 · Rôle de l’offre','Une offre socle, unique'),
('table',None,[['Nom interne','Conseil (le O d’O.R.E.M., Orienter)'],['Type','Offre socle, unique'],['Incluse','Quand le client achète un Site web et/ou une Direction artistique : la phase Conseil fait partie du projet, sans facturation séparée.'],['Payante seule','Uniquement si le client veut « juste » de la clarté (diagnostic et plan), sans partir sur l’image ni le site.']]),
('quote','La question n’est pas : est-ce qu’on fait le Conseil ? Mais : est-il facturé seul ou absorbé par l’offre Site / Image ?'),
('sec','02 · Cible et timing','À qui et à quel moment'),
('h3','Type d’entreprises'),
('p','PME et TPE ambitieuses, médias, SaaS, services B2B, marques de savoir-faire, qui ont déjà :'),
('ul',['une activité qui tourne (clients, CA, audience) ;','mais un positionnement, une offre ou un discours devenus flous, confus ou en retard.']),
('h3','Les moments où nous la vendons'),
('table',['Situation','Ce qu’on entend'],[['Refonte envisagée, motif flou','« Notre site n’est plus au niveau. »\n« Les gens ne comprennent pas ce qu’on fait. »'],['Changement stratégique','Montée en gamme, changement de cible, nouvelle offre : il faut trancher le message.'],['Site ou identité récents qui ne performent pas','Peu de demandes entrantes, leads qui ne correspondent pas.'],['Doute du décideur','« On sait qu’il y a un problème, mais on ne sait pas si c’est le site, l’offre ou le discours. »']]),
('sec','03 · Problèmes traités','Nous ne vendons pas un audit'),
('lead','Nous vendons la résolution de cinq douleurs précises.'),
('table',['Douleur','Ce que ça donne concrètement'],[['Positionnement flou','On ne comprend pas qui vous êtes ni où vous jouez. Vous êtes rangé avec des concurrents alors que votre niveau est différent.'],['Offre illisible','Trop de services, mal hiérarchisés. Impossible de résumer en une phrase claire. Le prospect ne sait pas par où entrer.'],['Différence peu lisible','Votre « plus » n’est pas visible en 5 à 10 secondes. Vous êtes facile à comparer, donc facile à négocier, voire à écarter.'],['Communication désalignée','Votre réalité (clients, résultats, CA, niveau d’exécution) dépasse votre image actuelle. Vous êtes sous-évalué par rapport à votre vrai niveau.'],['Absence de priorités','Vous ne savez pas par quoi commencer : site, image, contenus, acquisition ? Risque majeur : investir au mauvais endroit.']]),
('quote','Le Conseil est un outil de décision : il dit où est le vrai problème, ce qui doit changer, et dans quel ordre.'),
('sec','04 · Promesse','Ce que nous vendons'),
('callout','La promesse','Nous décidons ce que votre entreprise doit dire, à qui, et quelles actions vont générer le plus d’impact sur vos demandes entrantes et votre crédibilité.'),
('cards',[('Clarté','Vous savez exactement comment vous présenter et à qui vous parlez.'),('Priorisation','Vous savez ce qu’il faut faire d’abord, ce qui peut attendre et ce qu’il faut arrêter.'),('Alignement','Toute la suite (image, site, SEO, contenu, prospection) repose sur une décision claire et partagée.')]),
('sec','05 · Livrables','Une offre, deux blocs'),
('h3','Bloc 1 · Diagnostic'),
('table',['Audit','Ce qu’on regarde'],[['Positionnement','Comment vous vous définissez.\nComment le marché vous perçoit.\nVos concurrents et alternatives.'],['Offre','Structure, segments, hiérarchie, lisibilité.'],['Discours','Site, pitch, éléments de langage.\nCohérence entre ce qui est en ligne et ce que dit le dirigeant.'],['Présence actuelle','Site (UX, structure, contenus).\nSEO et signaux principaux.\nPerception vue de l’extérieur.']]),
('p','**Sortie :** un état des lieux clair de ce qui fonctionne, de ce qui crée de la confusion, et de ce qui manque.'),
('h3','Bloc 2 · Plan stratégique'),
('table',['Décision','Contenu'],[['Positionnement tranché','Qui vous êtes, pour qui, et sur quel problème vous êtes incontournable.'],['Message central','Une phrase, une structure explicable en 5 à 10 secondes.'],['Différence','Les 2 ou 3 leviers concrets qui vous rendent difficile à comparer.'],['Architecture d’offre','Comment organiser les offres pour que le prospect sache par où entrer, ce qui est cœur, ce qui est optionnel.'],['Hiérarchie des priorités','Ce qu’il faut traiter immédiatement, ce qui peut venir en phase 2 ou 3.'],['Plan d’actions business','**Image** : quand la DA ou l’identité est en cause.\n**Site** : quand la vitrine bloque.\n**Acquisition, contenu, SEO** : quand la visibilité manque.']]),
('h3','Format'),
('table',None,[['Document écrit (PDF ou Notion)','Partie 1 · Diagnostic (constats)\nPartie 2 · Décisions (positionnement, message, offre)\nPartie 3 · Plan priorisé (actions)'],['Visio de restitution (1h à 1h30)','Présentation, questions / réponses, ajustements.']]),
('sec','06 · Process (usage interne)','Six étapes, de l’appel à la suite logique'),
('table',['Étape','Ce que nous faisons'],[['0 · Cadre et contexte','Vérifier que le prospect est dans l’ICP, qu’il y a un vrai enjeu de clarté ou de perception, et que le décideur est dans la boucle. Clarifier : Conseil vendu seul, ou inclus dans un projet Site / Image.'],['1 · Collecte','Questionnaires et échanges pour récupérer chiffres clés (CA, clients, MRR…), clients types, offres, supports existants (site, présentations, pitch). Retenir 1 ou 2 exemples de clients ou de deals pour illustrer.'],['2 · Analyse','Lecture des supports, benchmark rapide face aux concurrents, diagnostic site et message, repérage des contradictions et angles morts.'],['3 · Construction du plan','Rédaction des constats synthétiques, des décisions (positionnement, message) et du plan priorisé.'],['4 · Restitution','Présenter le diagnostic, les décisions et le plan. Valider avec le dirigeant qu’il est aligné sur le positionnement et se reconnaît dans le message.'],['5 · Suite logique','**Conseil vendu seul** : nous remettons le document, point.\n**Première brique d’un projet** : bascule immédiate en cadrage Site (architecture, contenus) ou en cadrage Image (plateforme de marque, DA), en s’appuyant sur le plan, sans rediscuter le fond.']]),
('sec','07 · Carte des offres','Le Conseil face aux autres offres'),
('lead','Pour que toute l’équipe partage la même carte mentale.'),
('table',['Offre','Rôle','Conseil obligatoire ?','Conseil facturé ?'],[['Conseil','Décider, clarifier, prioriser','C’est l’offre elle-même','Oui (offre 1 autonome)'],['Image','Représenter','Oui','Inclus dans le prix Image'],['Site','Exécuter','Oui','Inclus dans le prix Site'],['Accompagnement Web','Mesurer et faire vivre','Oui (en amont)','Accompagnement facturé, Conseil inclus avant'],['Accompagnement Marque','Mesurer et faire vivre','Oui (en amont)','Accompagnement facturé, Conseil inclus avant']],'c4'),
('callout','La règle','On ne vend jamais un Site ou une Image sans passer par le Conseil. On ne facture le Conseil séparément que si le client achète uniquement cette phase.'),
('sec','08 · Règles commerciales','Quand le Conseil mène à un projet'),
('p','Diagnostic et plan forment l’offre 1. Si le client part ensuite sur une offre Image ou Site dans un délai défini (par exemple 30 jours), deux options :'),
('ul',['**Imputer** une partie du montant Conseil sur le projet ;','**Considérer** que le Conseil était inclus dès le début (diagnostic remboursé).']),
('duo',[('En interne','« Cette phase a une valeur monétisable. »'),('Côté client','« Ce que nous avons investi en clarté n’est pas une couche en plus : c’est la base du projet. »')]),
('final','Nous prenons une entreprise qui vaut mieux que ce qu’elle montre, nous diagnostiquons où se situe le flou (message, offre, différence, présence), et nous livrons un plan clair, priorisé, qui sert de base à tout le reste : image, site, acquisition.'),
]))

DOCS.append(dict(file='Offre-2-Image-Orem',short='Offre 2 · Image',eyebrow='Le « R » d’O.R.E.M. · Représenter',title='Offre 2<br>Image',
sub='Donner une forme claire à ce que l’entreprise est devenue.',
ess='Du positionnement à la direction artistique, nous construisons une identité alignée, cohérente et exploitable. Trois niveaux de profondeur, à prix fixes : Essentiel 1 490 €, Pro 3 990 €, Premium 6 990 € HT. Conseil = quoi, à qui, pourquoi. Image = à quoi ça ressemble, et comment on le décline partout.',
blocks=[
('sec','01 · Rôle de l’offre','Représenter ce que le Conseil a décidé'),
('table',None,[['Nom interne','Image (offre 2)'],['Place dans O.R.E.M.','R, Représenter'],['Intervient après','L’offre 1 Conseil, une fois le positionnement clarifié.'],['Mode de vente','Seule (le client vient pour revoir son image ou son identité). Ou intégrée dans un pack plus large (Conseil + Image + Site).'],['Périmètre','**Plateforme de marque** : ce que l’image doit exprimer.\n**Identité visuelle** : logo, couleurs, typographie, DA.\n**Design system et brand guidelines** : comment tout utiliser.\n**Déclinaisons** : supports concrets.']]),
('sec','02 · Packs et prix','Trois packs en un coup d’œil'),
('prices',[('Essentiel','1 490 € HT','Un socle visuel propre, exploitable rapidement.'),('Pro','3 990 € HT','Une charte de marque solide, déclinable.'),('Premium','6 990 € HT','Une architecture de marque complète et un UI kit.')]),
('table',['','Essentiel','Pro','Premium'],[['Livrable','Fiche d’identité PDF (4 à 6 pages) et fichiers sources','Brand guidelines PPTX / PDF (20 à 40 pages) et kit complet','Brand guidelines (PDF ou en ligne), UI kit Figma, public brand kit'],['Stratégie de marque','Non','Oui (synchronisée avec le Conseil)','Oui, version développée'],['Mockups','Aucun','8 à 10','20'],['Pour qui','Budget serré, délais courts, refonte légère','PME, médias, SaaS, agences, cabinets','Gros médias, régies, marques premium']],'c4 cmp'),
('sec','03 · Pack Essentiel · 1 490 € HT','Poser un socle propre'),
('quote','Nous ne faisons pas de charte complète : nous posons un socle propre pour que le site ait une base cohérente.'),
('table',None,[['Objectif','Donner un socle visuel propre, cohérent et exploitable rapidement, sans aller dans la stratégie complète.'],['Livrable','1 fiche d’identité graphique PDF (4 à 6 pages).\nFichiers sources : logo, palette, styles de base.'],['Usage type','Budget serré ou délais courts, refonte légère, sites où l’on aligne un minimum sans refaire toute la marque.']]),
('h3','Contenu'),
('table',['Brique','Contenu'],[['1 · Moodboard','Planche d’inspiration : couleurs, textures, typographies, univers visuel.'],['2 · Couleurs (base)','1 couleur principale et 2 à 3 déclinaisons.\nRègles simples : associations autorisées et déconseillées.'],['3 · Typographie (base)','1 typeface principale, graisses utilisables (regular, medium, bold).\nTyperamp web minimal : titres H1 / H2, corps de texte, boutons.'],['4 · Iconographie (base)','Choix d’un style (ligne, plein ou mix) et 2 à 3 icônes de référence.'],['5 · Composition (web)','Principes de grille (colonnes, espacements) et logique de blocs (sections, cartes).'],['6 · Logo','1 logo primaire (couleur, noir et blanc), 1 variante secondaire simple, 1 favicon.']]),
('sec','04 · Pack Pro · 3 990 € HT','Une charte de marque solide'),
('table',None,[['Objectif','Une charte pour les structures où l’image doit soutenir le positionnement, se décliner sur plusieurs supports (web, print, contenus) et être utilisable par plusieurs personnes ou prestataires.'],['Livrable','Brand guidelines complètes (PPTX / PDF, 20 à 40 pages).\nKit logo, typographies, palettes et exemples d’applications.'],['Usage type','PME, médias, SaaS, agences, cabinets qui veulent une vraie charte exploitable en interne et par leurs prestataires, sans tout l’arsenal Premium.']]),
('h3','Contenu (Essentiel, enrichi)'),
('table',['Brique','Contenu'],[['1 · Moodboard','Plus détaillé, aligné avec le positionnement issu du Conseil.'],['2 · Direction stratégique','Cibles, positionnement, vision, mission, valeurs, proposition de valeur synthétisée (synchronisée avec l’offre 1).'],['3 · Direction éditoriale (base)','Histoire de la marque (version courte), principes linguistiques, ton et style, 2 à 3 slogans ou baselines, vocabulaire recommandé.'],['4 · Couleurs +','Palette principale et secondaires, règles de tokenisation (noms, usages), exemples de proportions.'],['5 · Typographie +','Typefaces, graisses, style des chiffres et symboles.\nTyperamp web détaillé et typeramp print (plaquettes, flyers).'],['6 · Composition +','Grilles web et print, exemples de mise en page.'],['7 · Iconographie','Définition du style, set d’icônes d’exemple, règles d’utilisation (taille, esprit, usage).'],['8 · Objets de style','Ombres, contours, radius, lignes.'],['9 · Logo +','Versions primaire, secondaire et favicon, en couleur et noir et blanc.\nClearspace, applications sur fond clair et foncé, bons et mauvais usages.'],['10 · Applications visuelles','8 à 10 mockups : cartes de visite, slides, header de site, post LinkedIn…']]),
('sec','05 · Pack Premium · 6 990 € HT','Une architecture de marque complète'),
('table',None,[['Objectif','Une architecture de marque complète et un UI kit prêt pour le digital, pour des clients plus exigeants, plus exposés, avec plusieurs supports et équipes.'],['Livrable','Brand guidelines (PPTX / PDF ou version en ligne).\nUI kit livré dans Figma.\nPublic brand kit pour les partenaires.'],['Usage type','Clients pour qui l’image est stratégique (gros médias, régies, marques premium), avec beaucoup d’équipes ou de prestataires utilisant la charte, et un projet digital ambitieux derrière (site et produits).']]),
('h3','Contenu (Pro, avec des couches supplémentaires)'),
('table',['Brique','Contenu'],[['1 · Stylescape','Planche ultra détaillée, univers visuel complet, variations par cas d’usage (web, print, motion).'],['2 · Direction éditoriale complète','Histoire en version longue, ton et style détaillés, guidelines précises sur le copy et le vocabulaire.'],['3 · Typographie ++','Base Pro, plus règles de ponctuation.\nTyperamps : web, print, slides (Keynote, PowerPoint, Figma), documents (Word, Google Docs).'],['4 · Couleurs ++','Palette et proportions, associations détaillées, tokenisation avancée.'],['5 · Direction stratégique','Cibles, positionnement, proposition de valeur en version développée, alignées avec le document Conseil.'],['6 · Composition ++','Web, print, slides, systèmes de mise en page.'],['7 · Iconographie avancée','Set, variantes, usages finaux, règles de déclinaison.'],['8 · Illustrations','Style d’illustration et 3 exemples concrets.'],['9 · Photo (option)','Guidelines de prise de vue et exemples.'],['10 · Accessibilité (option)','Contrastes, règles AA / AAA.'],['11 · Objets de style','Version plus fine et détaillée que le Pro.'],['12 · Logo ++','Tout le Pro, plus échelles, clearspaces partenaires, exemples d’usage multi-marque.'],['13 · Applications +','20 mockups : web, print, social, affiches…'],['14 · Public brand kit','Kit prêt pour les partenaires : logos, templates de co-branding, règles.'],['15 · UI kit','20+ composants essentiels (boutons, cartes, sections…).\nTemplates : carte de visite, bannière LinkedIn, éventuellement base de slides.']]),
('sec','06 · Articulation','L’Image dans le système O.R.E.M.'),
('table',['Offre','Lien avec l’Image'],[['Conseil · offre 1','Prérequis logique. Sauf rare cas (positionnement déjà très clair), l’Image part du document Conseil.'],['Site · offre 3','Chaque pack nourrit le site :\n**Essentiel** : site simple mais propre.\n**Pro** : charte solide, design system aligné.\n**Premium** : UI kit complet.'],['Évolution · offre 4','Prend le relais pour les déclinaisons supplémentaires, les ajustements visuels et l’alignement dans le temps.']]),
('sec','07 · Garde-fous internes','Tenir le périmètre au prix fixé'),
('table',['Pack','Règle'],[['Essentiel · 1 490 €','Discipline totale : pas de dérapage vers la stratégie complète, pas de 20 maquettes, pas de projet qui s’étire sur 3 mois.'],['Pro · 3 990 €','Charte sérieuse, avec des limites posées : 10 mockups maximum, 2 allers-retours inclus.'],['Premium · 6 990 €','Nous acceptons la complexité, mais nous documentons clairement ce qui est inclus et ce qui passe en devis additionnel (motion, campagnes…).']]),
('final','Nous donnons une forme claire à ce que l’entreprise est devenue. Du positionnement à la direction artistique, nous construisons une identité alignée, cohérente et exploitable, à trois niveaux de profondeur : Essentiel, Pro, Premium, à prix fixes de 1 490, 3 990 et 6 990 € HT.'),
]))

DOCS.append(dict(file='Offre-3-Site-web-Orem',short='Offre 3 · Site web',eyebrow='Le « E » d’O.R.E.M. · Exécuter',title='Offre 3<br>Site web',
sub='Construire la machine qui travaille au quotidien.',
ess='Nous transformons un positionnement et une image travaillés en un site qui vend. Nous le construisons par composants : un socle (pages clés, tracking, SEO / GEO) et des modules (pages, CMS, intégrations, e-commerce). Puis nous le faisons vivre avec Évolution. Conseil = on décide. Image = on donne une forme. Site = on construit la machine.',
blocks=[
('sec','01 · Rôle de l’offre','Transformer la clarté en site vivant'),
('table',None,[['Nom interne','Site web (offre 3)'],['Place dans O.R.E.M.','E, Exécuter'],['Intervient après','L’offre 1 Conseil (positionnement, message, plan). Idéalement l’offre 2 Image (identité, DA, design system).'],['Ce qu’elle produit','Un site vivant, pensé pour convertir, se référencer (SEO) et être cité par les moteurs de réponse IA (GEO).']]),
('sec','02 · Cible','À qui s’adresse l’offre Site'),
('p','PME B2B, médias, SaaS, services spécialisés, régies, cabinets, hôtels, marques de savoir-faire, qui ont :'),
('ul',['un business déjà rentable et sérieux ;','un site en retard sur leur niveau réel ;','un enjeu direct en demandes entrantes, crédibilité, recrutement, partenaires ou investisseurs.']),
('h3','Trois cas typiques'),
('cards',[('1 · Correct techniquement','Mais illisible côté offre, pas aligné avec le nouveau positionnement, pas pensé pour convertir.'),('2 · Joli mais inerte','Peu de demandes, pas de tracking, pas de SEO sérieux.'),('3 · Structure en changement','Nouvelle offre, nouvelle cible, montée en gamme, internationalisation : le site actuel ne suit pas.')]),
('sec','03 · Problèmes traités','Nous ne vendons pas un « site Webflow »'),
('lead','Nous vendons la résolution de cinq blocages.'),
('table',['Blocage','Ce que ça donne concrètement'],[['L’offre n’est pas claire','On ne comprend pas qui vous êtes, pour qui, ni ce que vous proposez. Page d’accueil confuse ou généraliste.'],['Le site ne convertit pas','Formulaires mal pensés, CTA flous ou rares. Aucun chemin logique vers la prise de contact ou la démo.'],['Le niveau de la marque n’apparaît pas','Image datée ou générique, structure pauvre. Pas de cas clients ni de preuves.'],['Le site n’est pas mesuré','Peu ou pas de GA4, pas de GSC. Aucune idée de ce qui fonctionne.'],['Le site est invisible','SEO négligé, architecture non pensée pour le référencement. Aucune base pour le GEO (moteurs IA).']]),
('sec','04 · Promesse','Ce que nous vendons'),
('callout','La promesse','Nous construisons un site rapide, clair et crédible qui transforme un positionnement travaillé en demandes entrantes, en preuves et en visibilité (SEO et GEO), avec un système de mesure qui permet de le faire évoluer.'),
('cards',[('Clarté et conversion','Le site dit en 5 à 10 secondes ce que vous faites, pour qui, et pourquoi vous. Puis il guide vers l’action.'),('Preuve et crédibilité','Cas clients, chiffres, témoignages, pages fondateurs. Le site devient un appui commercial.'),('Visibilité et système vivant','SEO posé, GEO préparé, tracking en place. La base de l’offre 4 Évolution.')]),
('sec','05 · Logique de prix','Un socle, des composants'),
('lead','Pas de forfait unique : le prix = socle + composants.'),
('h3','Le socle site vitrine (BASE_VITRINE)'),
('ul',['1 page d’accueil','3 à 4 pages clés (services, à propos, contact, mentions)','Intégration Webflow','Tracking GA4 et GSC','SEO technique de base','2 mois d’assistance technique']),
('h3','Les composants à la carte'),
('p','Chaque composant est relié à un code du Google Sheet de chiffrage (ADD_SERV, ADD_STD, ADD_CMS, ADD_LANG…).'),
('table',['Composant','Contenu'],[['Pages supplémentaires','**Page stratégique** : service détaillé, fondateur, landing de campagne.\n**Page secondaire** : FAQ, simple page de contenu.'],['Collections CMS','Blog, cas clients, actualités, offres d’emploi, catalogue de programmes…'],['Langues supplémentaires','Versions FR / EN, etc., avec prise en compte du SEO.'],['Modules e-commerce','Pages produit, panier, intégration du paiement (Stripe…).'],['Intégrations','CRM (HubSpot ou autre), formulaires avancés, automation (Make, Brevo…), prise de rendez-vous.'],['Socle GEO','Contenus structurés, balisage factuel, llms.txt.'],['Système vivant','Optimisation des formulaires, tagging, base de reporting simplifiée.']]),
('sec','06 · Livrables','Ce que nous livrons, étape par étape'),
('table',['Bloc','Contenu','Livrable'],[['1 · Cadrage et architecture','À partir du Conseil (et de l’Image si prise) : arborescence complète, parcours utilisateurs (visiteur vers contact / démo), mapping des pages et collections, pages « business critical ».','Document d’architecture (Figma, Notion ou Miro)'],['2 · Design et contenus','**Design** : maquettes Figma des pages clés, réutilisation du design system (si offre 2), desktop et mobile.\n**Contenus** : rédaction ou réécriture du hero, des sections clés, cas clients, pages services.\n**SEO et GEO** : mots-clés, structure Hn, définitions « citables ».','Maquettes validées. Textes finalisés (ou cadre pour les textes du client)'],['3 · Développement et intégrations','**Webflow** : pages statiques, collections CMS, animations utiles sans surcharge.\n**Intégrations** : formulaires, CRM, automation, outils tiers (booking, paiement).','Site intégré et testé'],['4 · SEO et GEO (socle)','GA4 et Search Console configurés, sitemap propre, balisage (title, meta, Hn, données structurées), contenus compatibles GEO (questions / réponses, définitions factuelles).','Site mesurable et indexable'],['5 · Mise en ligne et migration','**Refonte** : redirections 301, surveillance des 404, déclaration de changement d’adresse (si rebrand).\n**Création** : mise en ligne propre, mise à jour des entrées (Google Business, liens…).','Site en ligne'],['6 · Assistance post-lancement','2 mois inclus : corrections mineures, ajustements simples de contenus, aide à la prise en main de Webflow.','Client autonome']],'c3'),
('sec','07 · Process (usage interne)','Huit étapes, de la qualification à Évolution'),
('table',['Étape','Ce que nous faisons'],[['1 · Qualification et offre','Vérifier : Conseil fait ou à faire ? Image existante cohérente ou non ? Proposer le pack adapté (vitrine simple ou site plus complexe) et mentionner Évolution comme suite.'],['2 · Conseil (si pas fait)','Toujours passer par l’offre 1.'],['3 · Image (si nécessaire)','Si l’image est trop faible ou datée : proposer au minimum l’Essentiel ou le Pro.'],['4 · Cadrage','Ateliers et document d’architecture.'],['5 · Design et contenus','Maquettes, textes, validations (2 allers-retours maximum, à fixer).'],['6 · Dev et intégrations','Intégration Webflow (en interne ou par un freelance cadré), tests.'],['7 · Mise en ligne','Déploiement, migration si besoin.'],['8 · Passation et bascule Évolution','Formation rapide, puis proposition formelle d’Évolution niveau 1 ou 2.']]),
('sec','08 · Articulation','Le Site dans le système O.R.E.M.'),
('table',['Offre','Lien avec le Site'],[['Conseil · offre 1','Prérequis. Nous refusons un projet site sans cette phase, même courte.'],['Image · offre 2','Recommandée dès qu’il y a un écart d’image. Essentiel = socle minimal. Pro ou Premium pour les projets plus lourds.'],['Évolution · offre 4','Suite naturelle : site livré, puis proposition Évolution. À poser dès la vente du site.']]),
('callout','À dire dès la vente','Le site est une base. L’offre Évolution est là pour le faire grandir et rentabiliser l’investissement.'),
('final','Nous transformons un positionnement et une image travaillés en un site qui vend. Nous le construisons par composants, avec un socle (pages clés, tracking, SEO / GEO) et des modules (pages, CMS, intégrations, e-commerce), puis nous le faisons vivre avec Évolution.'),
]))

DOCS.append(dict(file='Offre-4-Evolution-Orem',short='Offre 4 · Évolution',eyebrow='Le « M » d’O.R.E.M. · Mesurer',title='Offre 4<br>Évolution',
sub='Faire travailler et grandir ce que nous avons construit.',
ess='Nous ne laissons pas vos sites et vos marques redevenir obsolètes. Tous les mois (ou tous les 15 jours), nous lisons les données avec vous, décidons des priorités, les exécutons et documentons. Vos actifs gagnent de la valeur au lieu de se dégrader. Réservé aux clients Orem · 490 € ou 890 € HT / mois · engagement 3 mois.',
blocks=[
('sec','01 · Rôle de l’offre','Faire évoluer un système que nous connaissons'),
('table',None,[['Nom interne','Évolution'],['Place dans O.R.E.M.','M, Mesurer'],['Intervient après','Un projet de Conseil (Orienter), d’Image (Représenter) ou de Site (Exécuter).'],['Réservée à','Les clients pour lesquels nous avons déjà cadré la stratégie et livré un site et/ou une image.']]),
('quote','On n’ouvre jamais Évolution à un client dont on n’a pas fait le site ou l’image. L’objectif : faire évoluer un système que nous connaissons, pas rattraper celui de quelqu’un d’autre.'),
('sec','02 · Structure','Une offre, deux intensités'),
('table',['','Niveau 1 · Évolution','Niveau 2 · nom à fixer'],[['Prix','490 € HT / mois','890 € HT / mois'],['Visio de pilotage','1 par mois','1 tous les 15 jours'],['Améliorations','Environ 5 par mois','Environ 10 par mois'],['Réseau Orem','Non','Introductions ciblées quand c’est pertinent']],'c3 cmp'),
('p','Pistes de nom pour le niveau 2 : « Évolution+ », « Croissance », « Intensif ».'),
('p','**Engagement minimum : 3 mois**, puis reconduction mensuelle ou trimestrielle (à préciser dans les CGV). Philosophie : 3 mois pour installer le rythme, constater un effet, et décider de poursuivre ou non.'),
('sec','03 · Cible','À qui s’adresse Évolution, et à qui non'),
('duo',[('Éligibles','Clients existants avec un site ou une identité réalisés par Orem. Pour qui le site ou la marque a un impact direct sur les demandes entrantes, la crédibilité, le recrutement, les partenaires ou investisseurs.\n**Profils** : PME B2B, médias, SaaS, services spécialisés, hôtels et marques premium.\n**Exemples** : Le Crayon, Huchet Demorge, Logical, Concilium, Casa Zanoni.'),('Non éligibles','Site « nice to have » sans enjeu business (associations sans budget, side projects).\nGouvernance trop floue, sans pilote côté client.\nAucune volonté réelle de regarder des KPIs.')]),
('quote','Si le client ne se projette pas sur « on va regarder les chiffres chaque mois », ce n’est pas une bonne cible pour Évolution.'),
('sec','04 · Problèmes traités','Nous ne vendons pas « quelques mises à jour »'),
('lead','Nous vendons la préservation et l’augmentation de la valeur de ce que nous avons créé.'),
('table',['Problème','Ce qu’on observe'],[['Actifs qui stagnent','Site ou image livrés, peu ou pas mis à jour. Contenus figés, SEO et GEO laissés en roue libre.'],['Manque de pilotage','Personne ne prend 1h par mois pour lire les chiffres. Décisions au feeling, idées d’amélioration jamais traitées.'],['Business plus rapide que la vitrine','Nouvelle offre, nouveau segment, recrutement, levée… Mais site et supports restent figés sur la version d’avant.'],['Opportunités manquées','Gains de conversion possibles, mises à jour simples qui augmentent clarté ou visibilité, pages SEO / GEO pertinentes jamais produites.'],['Coûts futurs plus lourds','Sans évolution continue, tout finit par être à refaire en bloc. Une évolution progressive aurait été plus simple et moins chère.']]),
('sec','05 · Promesse','Ce que nous vendons'),
('callout','La promesse','Nous ne laissons pas votre site et votre image redevenir un problème. Chaque mois, nous lisons les résultats avec vous, décidons où intervenir, et améliorons ce qui existe pour que vos investissements prennent de la valeur au lieu d’en perdre.'),
('cards',[('Pilotage','Vous ne pilotez plus votre présence au feeling, mais avec des données et un regard externe.'),('Évolution continue','Votre site et votre image suivent vos enjeux : nouvelles offres, marchés, recrutements, campagnes.'),('Effet cumulé','Chaque mois, une ou plusieurs actions concrètes augmentent la clarté, la visibilité ou la conversion.')]),
('sec','06 · Contenu','Ce que nous faisons chaque mois'),
('lead','La structure est la même pour les deux niveaux. Seules la fréquence et l’intensité changent.'),
('table',['Brique','Contenu'],[['1 · Visio de pilotage','Niveau 1 : 1 visio de 45 à 60 min par mois.\nNiveau 2 : 2 visios de 45 à 60 min (tous les 15 jours).\nObjectif : faire le point sur les actions, les résultats et l’actualité business, puis décider des priorités suivantes.'],['2 · Revue des actions','Rappel des actions du mois précédent : ce qui a été livré, publié, mis en ligne, et ce qui reste à faire ou a dérapé.'],['3 · Analyse des résultats','**Site** : trafic (GA4, GSC), conversions (formulaires, clics clés), SEO / GEO (positions, requêtes, pages), comportement (heatmaps, enregistrements de session si outillé).\n**Image et supports** : usage réel, retours commerciaux, cohérence avec les nouvelles offres.'],['4 · Lecture des objectifs business','Actualité : lancement, nouvelle offre, événement, salon, campagne, recrutement.\nAjustement : les priorités du mois doivent-elles changer ?'],['5 · Recommandations et priorisation','Pages à ajuster, contenus à produire ou mettre à jour, sections à clarifier, optimisations SEO / GEO, supports de marque à adapter.\n1 priorité principale et plusieurs améliorations secondaires, chacune avec un responsable (Orem ou client) et une échéance.'],['6 · Exécution','**Site** : contenus, sections, UX, formulaires, pages, CMS.\n**Supports et messages** : decks, landings, présentations, campagnes.\n**Plateforme de marque / DA** si nécessaire : déclinaisons, adaptations, nouvelles composantes.'],['7 · Espace client','Toutes les tâches centralisées : à faire, en cours, faites, responsables, dates. Le client voit exactement ce qui a été fait, ce qui est en cours, ce qui est prévu.']]),
('h3','Niveau 1 face au niveau 2'),
('table',['','Niveau 1 · 490 € HT / mois','Niveau 2 · 890 € HT / mois'],[['Rythme','1 visio par mois','1 visio tous les 15 jours'],['Volume','Environ 5 interventions.\n1 priorité principale et 3 à 4 secondaires.','Environ 10 interventions.\n2 priorités principales et 6 à 8 secondaires.'],['Focus','Corrections, optimisations ciblées, petites évolutions (pages, sections, contenus, SEO / GEO de base).','Évolution plus soutenue, plus ouverture au réseau direct d’Orem : introductions et mises en relation ciblées quand c’est pertinent (non garanties, mais incluses dans la logique).'],['Pour qui','Clients qui veulent garder leurs actifs à niveau et progresser régulièrement.','Clients dont le site ou la marque est au cœur de l’acquisition, avec un rythme intense (médias, SaaS, régies).']],'c3 cmp'),
('sec','07 · Process (usage interne)','Le cycle mensuel'),
('table',['Moment','Ce que nous faisons'],[['1 · Avant la visio','Sortir les chiffres (GA4, GSC, rapports). Récupérer l’actualité business côté client (mail, Asana, Notion). Préparer 3 à 5 hypothèses ou axes de travail.'],['2 · Pendant la visio','Passer en revue actions, résultats et actualité. Co-décider la priorité principale, les améliorations secondaires, qui fait quoi.'],['3 · Après la visio','Consigner dans l’espace client : décisions, tâches, délais. Exécuter : design, dev, contenu, SEO, GEO selon le périmètre.'],['4 · Avant la visio suivante','Mesurer à nouveau et préparer la boucle suivante.']]),
('callout','Mesurer, décider, agir','Pas de mouvement sans lecture, pas de lecture sans mouvement.'),
('sec','08 · Articulation','Évolution face aux autres offres'),
('table',['Offre','Ce qu’elle fait','Ce qu’Évolution apporte'],[['Conseil · offre 1','Donne la direction : positionnement, message, plan.','S’assure qu’on ne la perd pas en route et l’adapte au temps réel.'],['Image · offre 2','Crée la plateforme visuelle.','L’actualise, la décline, l’empêche de vieillir.'],['Site · offre 3','Livre le site vivant.','Le fait travailler et monter en puissance.']],'c3'),
('quote','Sans Évolution, vos projets restent figés au moment de leur livraison. Avec Évolution, ils continuent de produire, alignés sur les objectifs du moment.'),
('sec','09 · Règles commerciales','Le cadre'),
('ul',['Réservé aux clients Orem (site et/ou image réalisés par nous).','Engagement minimum de 3 mois : le client peut arrêter après, pas avant.','Niveau 1 : 490 € HT / mois. Niveau 2 : 890 € HT / mois.']),
('h3','À clarifier dans les CGV'),
('table',None,[['Facturation','Mensuelle, en début de période.'],['Résiliation','Préavis à définir (x jours ou x semaines avant la date de renouvellement).'],['Périmètre','Ce qui est inclus, et ce qui nécessite un devis à part (grosse refonte, nouvelle section massive…).']]),
('final','Nous ne laissons pas vos sites et vos marques redevenir obsolètes. Tous les mois (ou tous les 15 jours), nous lisons les données avec vous, décidons des priorités, les exécutons et documentons. Vos actifs gagnent de la valeur au lieu de se dégrader.'),
]))
if __name__=='__main__':
  for d in DOCS:
    h=render(d)
    assert '—' not in h and '–' not in h, d['file']
    open(OUT+d['file']+'.html','w',encoding='utf-8').write(h)
print('ok')
