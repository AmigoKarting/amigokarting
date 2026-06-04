# -*- coding: utf-8 -*-
"""Génère le SQL pour insérer les 6 examens texte (quiz) d'Amigo Karting.
Types de questions :
  ('mc',   question, [options], index_correct, explication|None)
  ('vf',   énoncé, 'V'|'F')           -> 2 choix Vrai/Faux
  ('open', question, réponse_modèle)  -> 1 choix (la réponse), style révélation
"""

def vf(stmt, correct):
    return ('vf', stmt, correct)

MODULES = []

# ════════════════ MODULE 1 — LES RÉSERVATIONS ════════════════
M1 = [
    ('mc', "Quel est le délai minimal pour accepter une réservation ?",
        ["Le jour même", "24 heures", "3 jours", "1 semaine"], 2, None),
    ('mc', "Pourquoi cette règle existe-t-elle ?",
        ["Pour réduire le travail administratif",
         "Pour protéger les clients qui planifient leur visite à l'avance",
         "Pour diminuer l'achalandage", "Pour augmenter les prix"], 1, None),
    ('mc', "Lorsqu'un client demande une réservation à 13h, que faut-il clarifier ?",
        ["S'il veut arriver à 13h ou courir à 13h", "Son âge", "Son poids", "Son adresse"], 0, None),
    ('mc', "Combien de temps avant le départ les participants doivent-ils arriver ?",
        ["15 minutes", "20 minutes", "30 minutes", "45 minutes"], 2, None),
    ('mc', "Si un groupe est en retard, que doit-on lui expliquer ?",
        ["Il sera remboursé", "Il passera lorsque de la place sera disponible",
         "Il peut dépasser son temps réservé", "Sa réservation devient prioritaire"], 1, None),
    ('mc', "Quel numéro de téléphone doit être demandé ?",
        ["Résidence", "Travail", "Cellulaire", "Aucun"], 2, None),
    ('mc', "Que faut-il faire avant de remplir une réservation ?",
        ["Encaisser le dépôt", "Imprimer les billets",
         "Expliquer les conditions au client", "Faire signer le dégagement"], 2, None),
    ('mc', "Lors d'une réservation, quels champs doivent être remplis ?",
        ["Seulement le nom", "Seulement le téléphone", "Tous les champs",
         "Seulement le nombre de participants"], 2, None),
    ('mc', "Pourquoi faut-il inscrire le jour de la semaine en plus de la date ?",
        ["Pour éviter les erreurs", "Pour les statistiques", "Pour l'assurance",
         "Ce n'est pas important"], 0, None),
    ('mc', "Après avoir reçu un dépôt par carte de crédit, que faut-il faire du reçu ?",
        ["Le jeter", "Le remettre au client seulement", "L'agrafer à la réservation",
         "Le mettre dans la caisse"], 2, None),
    vf("Une réservation peut être acceptée 24 heures avant l'événement.", 'F'),
    vf("Les clients doivent arriver 30 minutes avant leur départ.", 'V'),
    vf("Une réservation est prioritaire sur les clients réguliers.", 'V'),
    vf("On peut oublier d'envoyer les conditions si le client semble les comprendre.", 'F'),
    vf("Le mode de paiement du dépôt doit être inscrit.", 'V'),
    vf("Toutes les réservations doivent être enregistrées dans Apex.", 'V'),
    vf("Il est acceptable de ne pas demander de numéro cellulaire.", 'F'),
    vf("Les retards peuvent créer de la frustration chez les autres clients.", 'V'),
    ('open', "Un client appelle jeudi pour réserver un groupe dimanche. Peut-on accepter la réservation ?", "Oui."),
    ('open', "Un client appelle vendredi pour réserver un groupe samedi. Peut-on accepter la réservation ?", "Non. Premier arrivé, premier servi."),
    ('open', "Un groupe arrive 10 minutes avant son départ prévu. Que dois-tu vérifier ?", "Vérifier si les formalités sont déjà complétées et informer le groupe qu'il devait arriver 30 minutes avant."),
    ('open', "Un client affirme qu'on lui avait promis qu'il n'y aurait aucune attente. Que fais-tu ?", "Vérifier les réservations de la journée et expliquer poliment la situation."),
    ('open', "Tu encaisses un dépôt mais oublies d'agrafer le reçu. Pourquoi est-ce un problème ?", "La transaction n'est plus correctement documentée."),
    ('open', "Tu as rempli la réservation mais oublié de l'entrer dans Apex. Quel risque cela crée-t-il ?", "La réservation pourrait être oubliée ou mal gérée."),
    ('open', "Un client veut réserver pour demain parce qu'il fait 2 heures de route. Que lui réponds-tu ?", "Les réservations doivent être faites au moins 3 jours à l'avance. Pour demain, ce sera premier arrivé, premier servi."),
    ('open', "Pourquoi les réservations de dernière minute peuvent-elles nuire à l'expérience client ?", "Elles peuvent créer de longues attentes imprévues pour des clients qui ont appelé plusieurs jours à l'avance."),
    ('open', "Pourquoi est-il important d'expliquer les retards dès la prise de réservation ?", "Pour établir des attentes claires et réduire les conflits."),
    ('open', "Pourquoi demande-t-on un numéro cellulaire plutôt qu'un téléphone résidentiel ?", "Pour pouvoir communiquer rapidement avec le client le jour de l'événement."),
    ('open', "Quel est le principal objectif du processus de réservation ?", "Assurer une expérience fluide et prévisible pour les clients et l'entreprise."),
    ('mc', "Quelle est l'erreur la plus grave dans le processus de réservation ?",
        ["Oublier le jour de la semaine", "Oublier d'envoyer les conditions",
         "Oublier d'inscrire la réservation dans Apex", "Écrire en bleu au lieu de noir"], 2, None),
]
MODULES.append(("Les réservations", "Examen de certification — Niveau Employé. Prise de réservations, délais, conditions et saisie dans Apex.", 10, M1))

# ════════════════ MODULE 2 — SERVICE À LA CLIENTÈLE ════════════════
M2 = [
    ('mc', "Quelle doit être votre première réaction lorsqu'un client est mécontent ?",
        ["Lui expliquer pourquoi il a tort", "Ignorer ses commentaires",
         "Faire preuve d'empathie et l'écouter", "Appeler immédiatement le gérant"], 2, None),
    ('mc', "Lorsqu'un client est frustré, quel est votre objectif principal ?",
        ["Gagner l'argument", "Régler la situation",
         "Mettre fin rapidement à la conversation", "Trouver un responsable"], 1, None),
    ('mc', "Si vous n'êtes pas capable de régler le problème d'un client, vous devez :",
        ["Lui demander de revenir plus tard", "Faire semblant de connaître la solution",
         "Demander l'aide du gérant", "Lui offrir un remboursement"], 2, None),
    ('mc', "Quel comportement ne doit jamais être toléré ?",
        ["Une plainte", "Une question répétée", "Un comportement agressif", "Une demande de précision"], 2, None),
    ('mc', "Que devez-vous faire si un client devient agressif ?",
        ["Hausser le ton", "Fermer la fenêtre et appeler le gérant", "L'ignorer", "Quitter votre poste"], 1, None),
    ('mc', "Pourquoi est-il important d'écouter un client jusqu'au bout ?",
        ["Pour gagner du temps", "Pour comprendre le problème réel",
         "Pour éviter de parler", "Parce que c'est obligatoire"], 1, None),
    ('mc', "Un client vous interrompt constamment. Vous devez :",
        ["Faire la même chose", "Garder votre calme", "L'ignorer", "Mettre fin à la conversation"], 1, None),
    ('mc', "Lorsqu'un client se plaint du temps d'attente, vous devez :",
        ["Minimiser son problème", "Le blâmer", "Écouter sa préoccupation", "L'ignorer"], 2, None),
    ('mc', "Quel est le meilleur moyen de désamorcer une situation tendue ?",
        ["Utiliser un ton calme", "Parler plus fort", "Argumenter", "Ignorer le client"], 0, None),
    ('mc', "Lorsqu'un client est contrarié, il faut :",
        ["Rester professionnel", "Répliquer", "Quitter la conversation", "Faire des promesses impossibles"], 0, None),
    vf("Un client mécontent doit être écouté avant qu'une solution soit proposée.", 'V'),
    vf("Un employé peut tolérer des insultes pour éviter une plainte.", 'F'),
    vf("Le gérant doit être impliqué lorsque la situation dépasse vos capacités.", 'V'),
    vf("Le calme est souvent plus efficace que la confrontation.", 'V'),
    vf("Un client agressif doit recevoir exactement le même comportement qu'il démontre.", 'F'),
    vf("L'objectif est de protéger à la fois les clients et les employés.", 'V'),
    vf("Une plainte est toujours une attaque personnelle.", 'F'),
    vf("Un client peut être frustré sans être agressif.", 'V'),
    vf("Le respect doit être maintenu même lors d'un conflit.", 'V'),
    vf("Chaque plainte doit être prise au sérieux.", 'V'),
    ('open', "Un client affirme avoir attendu plus longtemps que le temps annoncé. Que faites-vous ?", "Écouter sa plainte, vérifier la situation et lui expliquer les raisons du délai."),
    ('mc', "Un client vous dit : « C'est ridicule, votre organisation est mauvaise ! » Quelle est la meilleure réponse ?",
        ["« Vous avez tort. »", "« Je comprends votre frustration, laissez-moi vérifier la situation. »",
         "« Ce n'est pas mon problème. »", "« Vous pouvez partir si vous voulez. »"], 1, None),
    ('open', "Un client commence à crier devant d'autres clients. Quelle est votre priorité ?", "Garder votre calme et éviter que la situation dégénère."),
    ('open', "Un client demande à parler au responsable. Que faites-vous ?", "Contacter le gérant immédiatement."),
    ('open', "Un client utilise un langage irrespectueux. Quelle est la procédure ?", "Mettre fin à l'échange si nécessaire et demander l'aide du gérant."),
    ('open', "Un parent est frustré parce que son enfant n'a finalement pas voulu faire du karting. Que devez-vous faire ?", "Expliquer calmement les options disponibles selon la politique de remboursement."),
    ('open', "Un client vous accuse d'avoir mal expliqué les règles. Que faites-vous ?", "Réécouter sa version, clarifier les informations et demeurer professionnel."),
    ('open', "Une longue file d'attente rend plusieurs clients impatients. Que pouvez-vous faire ?", "Donner des informations claires sur les délais et mettre à jour les temps d'attente."),
    ('open', "Deux clients commencent à se disputer devant la caisse. Que faites-vous ?", "Garder le contrôle de votre espace de travail et demander l'intervention du gérant si nécessaire."),
    ('open', "Pourquoi un excellent service à la clientèle est-il important pour Amigo Karting ?", "Parce qu'il favorise la satisfaction, les recommandations et les avis positifs."),
    ('open', "Pourquoi est-il préférable de résoudre un problème rapidement ?", "Plus un problème dure, plus la frustration du client augmente."),
    ('open', "Pourquoi l'empathie est-elle importante dans le service à la clientèle ?", "Elle aide le client à se sentir écouté et compris."),
    ('open', "Quelle différence y a-t-il entre un client frustré et un client agressif ?", "Un client frustré exprime son mécontentement; un client agressif adopte un comportement irrespectueux ou menaçant."),
    ('open', "Pourquoi ne faut-il jamais prendre une plainte personnellement ?", "Parce que la plainte vise généralement la situation et non l'employé."),
    ('mc', "Quelle qualité est la plus importante pour un employé à la caisse ?",
        ["La rapidité", "La patience", "La force physique", "La discrétion"], 1, None),
]
MODULES.append(("Service à la clientèle et clients difficiles", "Examen de certification — Niveau Employé. Communication, gestion des conflits et des clients difficiles.", 11, M2))

# ════════════════ MODULE 3 — TEMPS D'ATTENTE ET ACHALANDAGE ════════════════
M3 = [
    ('mc', "Lorsque vous annoncez un temps d'attente, il est préférable de :",
        ["Donner un temps plus court", "Donner exactement le temps estimé",
         "Donner un temps légèrement plus long", "Refuser de répondre"], 2, None),
    ('mc', "Pourquoi est-il préférable d'annoncer un temps plus long que trop court ?",
        ["Pour faire peur aux clients", "Pour éviter les plaintes",
         "Pour réduire le nombre de clients", "Pour faciliter la comptabilité"], 1, None),
    ('mc', "Si vous ne connaissez pas le temps d'attente exact, vous devez :",
        ["Deviner", "Dire qu'il n'y a pas d'attente",
         "Consulter le gérant avec le walkie-talkie", "Refuser de répondre"], 2, None),
    ('mc', "Quel élément doit toujours être pris en compte dans le calcul du temps d'attente ?",
        ["La météo", "Les réservations à venir", "Le nombre d'employés", "Le prix des billets"], 1, None),
    ('mc', "Si un client est servi plus rapidement que le temps annoncé :",
        ["Il sera généralement satisfait", "Il sera mécontent",
         "Il demandera un remboursement", "Il quittera"], 0, None),
    ('mc', "Quelle méthode rapide est proposée dans le manuel pour estimer l'attente ?",
        ["Nombre de personnes × 5 minutes", "Nombre de personnes + 20 minutes",
         "Nombre de karts × 10", "Nombre de réservations × 30"], 1, None),
    ('mc', "Qui a priorité lorsqu'une réservation approche ?",
        ["Les clients déjà en attente", "Les employés", "Les réservations", "Les clients qui paient comptant"], 2, None),
    ('mc', "Lorsqu'on approche de la fermeture, il faut :",
        ["Continuer à vendre sans calcul", "Estimer le nombre de places restantes",
         "Arrêter immédiatement les ventes", "Accepter tout le monde"], 1, None),
    ('mc', "Le nombre de places restantes dépend principalement :",
        ["Du nombre de karts disponibles", "Du nombre de caissiers", "De la météo", "Du prix des billets"], 0, None),
    ('mc', "Pourquoi faut-il bien gérer les attentes des clients ?",
        ["Pour éviter les conflits et les plaintes", "Pour vendre moins de billets",
         "Pour réduire le travail", "Pour accélérer les courses"], 0, None),
    vf("Il vaut mieux annoncer 30 minutes d'attente lorsqu'on pense que ce sera 50 minutes.", 'F'),
    vf("Les réservations peuvent modifier complètement le temps d'attente.", 'V'),
    vf("Un client préfère généralement attendre moins longtemps que prévu.", 'V'),
    vf("Le temps d'attente doit être réévalué régulièrement.", 'V'),
    vf("Une mauvaise estimation peut créer de la frustration.", 'V'),
    vf("Tous les clients doivent être informés honnêtement des délais.", 'V'),
    vf("Le nombre de personnes en ligne est un facteur important.", 'V'),
    vf("Les réservations n'ont aucun impact sur les clients réguliers.", 'F'),
    vf("Le gérant peut aider à confirmer une estimation.", 'V'),
    vf("Une bonne gestion des attentes améliore l'expérience client.", 'V'),
    ('open', "Tu comptes environ 15 personnes en attente. Selon la méthode du manuel, quel temps d'attente annonces-tu ?", "Environ 35 minutes. (15 + 20 = 35)"),
    ('mc', "Il reste 3 vagues avant une réservation et 16 karts disponibles. Combien de places restent disponibles ?",
        ["32", "48", "24", "64"], 1, "16 × 3 = 48 places."),
    ('open', "Il reste 2 vagues avant la fermeture et 16 karts disponibles. Combien de places peux-tu encore vendre ?", "32 places. (16 × 2 = 32)"),
    ('open', "Tu peux faire passer 48 personnes avant une réservation et il y a déjà 40 personnes en attente. Combien de places restent disponibles ?", "8 places. (48 − 40 = 8)"),
    ('open', "Tu peux faire passer 32 personnes avant la fermeture et 35 personnes sont déjà en attente. Peux-tu continuer à vendre librement ?", "Non. La capacité est déjà dépassée (35 > 32)."),
    ('open', "Pourquoi faut-il faire ces calculs ?", "Pour éviter de vendre plus de places qu'il est possible d'en offrir."),
    ('mc', "Que risque-t-il d'arriver si on vend trop de billets ?",
        ["Plus de profits seulement", "Des attentes excessives et des clients mécontents",
         "Rien", "Une fermeture plus rapide"], 1, None),
    ('open', "Une réservation de 20 personnes arrive dans une heure. Que dois-tu faire ?", "L'inclure immédiatement dans tes calculs de capacité."),
    ('mc', "Le calcul des places disponibles doit être fait particulièrement :",
        ["Lorsqu'une réservation approche", "Avant la fermeture", "Dans les deux cas", "Jamais"], 2, None),
    ('open', "Pourquoi est-il important de connaître le nombre de karts disponibles ?", "Parce qu'il détermine directement la capacité de service."),
    ('open', "Un client demande : « Combien de temps vais-je attendre ? » Tu n'es pas certaine. Que fais-tu ?", "Consulter le gérant et fournir une estimation réaliste."),
    ('open', "Tu annonces 45 minutes d'attente. Le client passe après 35 minutes. Quelle sera probablement sa réaction ?", "Positive, car l'attente a été plus courte que prévu."),
    ('open', "Tu annonces 20 minutes d'attente. Le client attend finalement 45 minutes. Quelle sera probablement sa réaction ?", "Négative, car les attentes n'ont pas été respectées."),
    ('open', "Une réservation de 15 personnes arrive dans 20 minutes. Tu continues à vendre des billets sans ajuster tes calculs. Quelle erreur as-tu commise ?", "Tu n'as pas tenu compte de la priorité de la réservation."),
    ('open', "Pourquoi la gestion de l'achalandage est-elle importante chez Amigo Karting ?", "Parce qu'elle permet de servir le plus grand nombre de clients possible tout en respectant les réservations et en maintenant une bonne expérience client."),
]
MODULES.append(("Temps d'attente et achalandage", "Examen de certification — Niveau Employé. Estimer les temps d'attente et gérer la capacité.", 12, M3))

# ════════════════ MODULE 4 — TÉLÉPHONE ET COMMUNICATION ════════════════
M4 = [
    ('mc', "Le téléphone doit être :",
        ["Dans la caisse", "Dans le bureau", "Toujours sur vous", "Branché seulement"], 2, None),
    ('mc', "Pourquoi est-il important d'avoir le téléphone sur soi ?",
        ["Pour écouter de la musique", "Pour entendre les appels entrants",
         "Pour vérifier l'heure", "Pour parler aux employés"], 1, None),
    ('mc', "Quand devez-vous prendre les messages vocaux ?",
        ["À la fermeture seulement", "Dès que vous en avez la chance",
         "Une fois par semaine", "Seulement si le gérant le demande"], 1, None),
    ('mc', "Si un appel est manqué sans message vocal, vous devez :",
        ["L'ignorer", "Attendre un autre appel", "Rappeler le client", "Supprimer l'appel"], 2, None),
    ('mc', "Pourquoi est-il important de rappeler même sans message ?",
        ["Parce que le client a probablement besoin d'information", "Pour augmenter les ventes",
         "Pour remplir la journée", "Pour réduire les réservations"], 0, None),
    ('mc', "Lorsqu'un client dit vouloir venir dans quelques jours, vous devez :",
        ["Lui souhaiter bonne journée", "Lui demander la date prévue",
         "Lui vendre immédiatement un billet", "Lui parler du prix seulement"], 1, None),
    ('mc', "Pourquoi faut-il vérifier les réservations futures avec ce client ?",
        ["Pour éviter qu'il soit surpris par une longue attente", "Pour remplir le calendrier",
         "Pour vendre plus", "Pour faire plaisir au gérant"], 0, None),
    ('mc', "Quel risque existe lorsqu'on ne mentionne pas une grosse réservation prévue ?",
        ["Aucun", "Le client pourrait devoir attendre longtemps sans le savoir",
         "Le téléphone pourrait sonner", "Le prix pourrait changer"], 1, None),
    ('mc', "Une bonne communication téléphonique permet :",
        ["De réduire les malentendus", "De vendre moins de billets",
         "D'éviter le travail", "D'accélérer les courses"], 0, None),
    ('mc', "Le téléphone est un outil :",
        ["Facultatif", "Essentiel au service client", "Administratif seulement", "Peu utilisé"], 1, None),
    vf("Il est acceptable de laisser plusieurs messages vocaux non écoutés.", 'F'),
    vf("Les appels manqués doivent être suivis.", 'V'),
    vf("Les réservations importantes doivent être mentionnées aux clients qui prévoient venir.", 'V'),
    vf("Un client qui appelle a souvent besoin d'information avant de se déplacer.", 'V'),
    vf("Le téléphone doit être accessible durant le quart de travail.", 'V'),
    vf("Les clients apprécient recevoir des informations claires avant leur visite.", 'V'),
    vf("Un appel manqué peut représenter une réservation potentielle.", 'V'),
    vf("La communication téléphonique influence l'expérience client.", 'V'),
    vf("Un client qui appelle de loin doit être bien informé de l'achalandage.", 'V'),
    vf("Le téléphone n'a aucun impact sur la satisfaction client.", 'F'),
    ('mc', "Un client demande : « Êtes-vous ouverts aujourd'hui ? » Quelle est la meilleure réponse ?",
        ["« Je pense que oui. »", "« Oui, nous sommes ouverts. »",
         "« Regardez sur Internet. »", "« Je ne sais pas. »"], 1, None),
    ('mc', "Un client demande les prix. Que devez-vous faire avant de répondre ?",
        ["Lui demander si c'est pour adultes ou pour une famille", "Donner immédiatement le premier prix",
         "Lui demander son âge", "Lui parler des réservations"], 0, None),
    ('open', "Un client demande : « Est-ce que les prix sont par personne ou par kart ? »", "Les prix sont par kart."),
    ('open', "Un client demande : « Avons-nous besoin d'une réservation ? » Pour un groupe de moins de 10 personnes, quelle est la réponse ?", "Non. Premier arrivé, premier servi."),
    ('mc', "Pour quel type de groupe les réservations sont-elles généralement offertes ?",
        ["2 personnes", "5 personnes", "10 personnes ou plus", "Tout le monde"], 2, None),
    ('mc', "Un client veut faire une réservation. Quelle est la première chose à vérifier ?",
        ["Le nombre de personnes", "Le prix", "La météo", "Le mode de paiement"], 0, None),
    ('open', "Pourquoi faut-il déterminer si le groupe est composé d'adultes ou d'enfants ?", "Pour proposer le type de kart approprié."),
    ('open', "Lorsqu'un client veut réserver une fin de semaine, quelle restriction particulière doit être mentionnée ?", "Il n'y a généralement pas de réservations entre 13 h et 16 h les fins de semaine."),
    ('mc', "Avant de confirmer une réservation, vous devez :",
        ["Encaisser immédiatement", "Expliquer les conditions", "Donner un rabais", "Faire signer un contrat"], 1, None),
    ('open', "Un client demande si les autres activités sont ouvertes. Quelle réponse doit être donnée selon le manuel ?", "Elles rouvrent généralement autour du 20 mai."),
    ('open', "Tu remarques trois appels manqués datant d'une heure. Que fais-tu ?", "Tu rappelles les trois numéros dès que possible."),
    ('open', "Un client appelle de très loin et veut savoir s'il risque d'attendre. Que fais-tu ?", "Tu vérifies les réservations et l'achalandage prévu avant de répondre."),
    ('open', "Un client se présente mécontent parce qu'une réservation importante n'avait pas été mentionnée lors de son appel. Quelle erreur a été commise ?", "Une mauvaise communication de l'achalandage prévu."),
    ('mc', "Un client appelle pendant une période très occupée. Quelle est la priorité ?",
        ["Raccrocher rapidement", "Fournir une information claire et exacte",
         "Le transférer automatiquement", "Ignorer l'appel"], 1, None),
    ('open', "Pourquoi la qualité des réponses au téléphone est-elle importante pour Amigo Karting ?", "Parce qu'elle influence directement les attentes du client, sa satisfaction et sa décision de visiter le site."),
    ('open', "Quel est le principal objectif d'un appel de retour après un appel manqué ?", "Offrir le service que le client cherchait et éviter de perdre une occasion d'affaire."),
    ('open', "Pourquoi faut-il être précis lorsqu'on parle des réservations à venir ?", "Pour permettre au client de planifier sa visite correctement."),
    ('mc', "Quel impact peut avoir une mauvaise information donnée au téléphone ?",
        ["Aucun", "Une expérience client négative", "Plus de ventes", "Une fermeture temporaire"], 1, None),
    ('open', "Quel est le lien entre le téléphone et le service à la clientèle ?", "Le téléphone est souvent le premier contact du client avec l'entreprise."),
    ('mc', "Une excellente communication téléphonique permet :",
        ["De créer de la confiance", "De réduire les attentes irréalistes",
         "D'améliorer l'expérience client", "Toutes ces réponses"], 3, None),
]
MODULES.append(("Téléphone et communication client", "Examen de certification — Niveau Employé. Appels, messages vocaux, rappels et FAQ téléphonique.", 13, M4))

# ════════════════ MODULE 5 — TARIFS ET VENTES ════════════════
M5 = [
    ('mc', "Lorsque vous donnez un prix à un client, vous devez toujours préciser que :",
        ["Les taxes sont incluses", "Les taxes ne sont pas incluses",
         "Le prix peut changer", "Le prix dépend du caissier"], 1, None),
    ('mc', "Pourquoi est-il important de mentionner que les taxes ne sont pas incluses ?",
        ["Pour éviter les malentendus à la caisse", "Pour augmenter les ventes",
         "Pour accélérer le service", "Pour faire plaisir au client"], 0, None),
    ('mc', "Les prix sont-ils négociables ?",
        ["Oui", "Seulement pour les groupes", "Seulement avec le gérant", "Non"], 3, None),
    ('open', "Lorsqu'un client dit : « Pouvez-vous me faire un meilleur prix ? » Que devez-vous répondre ?", "Les prix ne sont pas négociables."),
    ('mc', "Quel argument peut être utilisé pour expliquer les prix ?",
        ["Nous sommes parmi les moins chers de la région et avons une très grande piste.",
         "Les prix changent selon le client.", "Les prix sont temporaires.", "Nous pouvons négocier."], 0, None),
    ('mc', "Un client demande un tarif. Quelle question devez-vous poser en premier selon la FAQ ?",
        ["Quel âge avez-vous ?", "Est-ce pour des adultes ou une famille ?",
         "Avez-vous réservé ?", "Combien pesez-vous ?"], 1, None),
    ('mc', "Les prix réguliers sont généralement :",
        ["Par personne", "Par groupe", "Par kart", "Par famille"], 2, None),
    ('mc', "Lorsqu'un client demande les tarifs, vous pouvez aussi lui indiquer :",
        ["Le site web", "Facebook seulement", "Le bureau municipal", "Google Maps"], 0, None),
    ('open', "Quel est le risque de donner un prix taxes incluses ?", "Créer de la confusion lorsqu'un autre employé donne les prix avant taxes."),
    ('open', "Quel est votre rôle lorsque vous annoncez un tarif ?", "Donner une information exacte et uniforme."),
    vf("Tous les employés doivent annoncer les prix de la même façon.", 'V'),
    vf("Les taxes doivent être mentionnées.", 'V'),
    vf("On peut accorder un rabais à un ami.", 'F'),
    vf("Les prix affichés sont les prix officiels.", 'V'),
    vf("Le client doit connaître le coût réel avant de payer.", 'V'),
    vf("Les tarifs de groupe sont différents des tarifs réguliers.", 'V'),
    vf("Le prix dépend du caissier qui travaille.", 'F'),
    vf("Un client peut négocier si son groupe est grand.", 'F'),
    vf("Le site web est une source officielle de prix.", 'V'),
    vf("Un employé doit être capable d'expliquer les tarifs.", 'V'),
    ('open', "Un client dit : « Mon ami a payé moins cher la semaine passée. » Que faites-vous ?", "Expliquer les tarifs actuels et les prix officiels."),
    ('open', "Un client insiste pour obtenir un rabais parce qu'il vient souvent. Que faites-vous ?", "Expliquer poliment que les prix ne sont pas négociables."),
    ('open', "Un client demande : « Est-ce que le prix affiché inclut les taxes ? » Quelle est la bonne réponse ?", "Non, les taxes sont en supplément."),
    ('open', "Un groupe de clients veut connaître les options disponibles. Que faites-vous ?", "Présenter les différents types de karts et leurs tarifs."),
    ('open', "Un client semble surpris par le total à payer. Quelle est probablement la cause ?", "Les taxes n'ont peut-être pas été clairement mentionnées."),
    ('open', "Tu réalises qu'un collègue annonce les prix taxes incluses. Pourquoi cela pose-t-il problème ?", "Les clients reçoivent des informations incohérentes."),
    ('open', "Un client affirme avoir vu un prix différent en ligne. Que fais-tu ?", "Vérifier l'information et consulter les tarifs officiels."),
    ('open', "Un client compare vos prix à ceux d'un concurrent. Que peux-tu mettre de l'avant ?", "La qualité de l'installation et la grandeur de la piste."),
    ('open', "Pourquoi faut-il rester confiant lorsqu'on annonce les prix ?", "Parce que les tarifs sont officiels et justifiés."),
    ('mc', "Quel est l'objectif d'une bonne présentation des prix ?",
        ["Faire payer plus", "Être transparent avec le client", "Aller plus vite", "Réduire les questions"], 1, None),
    ('mc', "Un client demande le prix d'une activité. Tu n'es pas certain du tarif exact. Que fais-tu ?",
        ["Inventer un prix", "Vérifier avant de répondre", "Donner une estimation", "Ignorer la question"], 1, None),
    ('open', "Pourquoi est-il important d'être précis avec les prix ?", "Parce que les erreurs peuvent créer des plaintes ou des pertes financières."),
    ('mc', "Que vaut mieux faire :",
        ["Donner une mauvaise réponse rapidement", "Vérifier et donner la bonne réponse"], 1, None),
    ('open', "Quel est le danger de promettre un prix incorrect ?", "Le client pourrait exiger ce prix à son arrivée."),
    ('mc', "Une erreur de tarification peut affecter :",
        ["La confiance du client", "La réputation de l'entreprise", "Les revenus", "Toutes ces réponses"], 3, None),
    ('open', "Pourquoi tous les employés doivent-ils suivre la même méthode lorsqu'ils annoncent les prix ?", "Pour assurer une expérience uniforme à tous les clients."),
    ('open', "Pourquoi les prix ne doivent-ils pas être négociés individuellement ?", "Pour garantir l'équité entre tous les clients."),
    ('open', "Quel est le principal avantage d'une politique de prix claire ?", "Réduire les conflits et les malentendus."),
    ('open', "Quel lien existe entre la connaissance des tarifs et le service à la clientèle ?", "Un employé bien informé inspire confiance."),
    ('mc', "Selon toi, quelle est la qualité la plus importante lorsqu'on présente les prix ?",
        ["La rapidité", "La transparence", "L'humour", "La persuasion"], 1, None),
]
MODULES.append(("Tarifs, ventes et présentation des prix", "Examen de certification — Niveau Employé. Annoncer les tarifs, taxes en sus et règles de vente.", 14, M5))

# ════════════════ MODULE 6 — REMBOURSEMENTS ════════════════
M6 = [
    ('mc', "Un remboursement peut être effectué lorsque :",
        ["Le client a changé d'idée", "Le service n'a pas pu être offert dans un délai raisonnable",
         "Le client n'aime pas la couleur des karts", "Le client trouve le prix trop élevé"], 1, None),
    ('mc', "Selon le manuel, quel délai d'attente peut justifier un remboursement ?",
        ["20 minutes", "30 minutes", "45 minutes", "Plus d'une heure"], 3, None),
    ('mc', "Si un client ne rentre pas dans un kart, un remboursement est-il permis ?",
        ["Oui", "Non"], 0, None),
    ('mc', "Si un enfant refuse de faire du karting par peur après avoir payé, un remboursement est-il permis ?",
        ["Oui", "Non"], 0, None),
    ('mc', "Avant d'effectuer un remboursement, quelle solution doit être envisagée en premier ?",
        ["Rabais", "Tour gratuit", "Certificat-cadeau", "Coupon alimentaire"], 2, None),
    ('mc', "Qui peut autoriser des exceptions aux règles normales ?",
        ["N'importe quel employé", "Le gérant", "Le client", "Le mécanicien"], 1, None),
    ('mc', "Lorsqu'un remboursement est effectué, il faut :",
        ["Ne rien inscrire", "Justifier la raison", "Détruire le billet", "Fermer la caisse"], 1, None),
    ('mc', "Où la raison du remboursement doit-elle être inscrite ?",
        ["Dans Apex", "Sur un papier libre seulement", "Nulle part", "Sur Facebook"], 0, None),
    ('mc', "Un remboursement doit aussi être noté :",
        ["Sur les billets concernés", "Dans le stationnement", "Sur le site web", "Dans les toilettes"], 0, None),
    ('open', "Pourquoi faut-il documenter chaque remboursement ?", "Pour assurer un suivi financier précis et justifier la transaction."),
    vf("Un client qui change simplement d'idée a automatiquement droit à un remboursement.", 'F'),
    vf("Le certificat-cadeau est souvent préférable à un remboursement immédiat.", 'V'),
    vf("Tous les remboursements doivent être justifiés.", 'V'),
    vf("Un remboursement peut être fait sans explication.", 'F'),
    vf("Le gérant peut intervenir dans les cas particuliers.", 'V'),
    vf("Une longue attente peut justifier un remboursement.", 'V'),
    vf("Un remboursement doit laisser une trace administrative.", 'V'),
    vf("Les remboursements sont une décision importante.", 'V'),
    vf("Les règles doivent être appliquées de façon équitable à tous les clients.", 'V'),
    vf("Un remboursement mal documenté peut créer un problème comptable.", 'V'),
    ('open', "Un client a payé mais réalise ensuite qu'il n'a plus envie de faire du karting. Que fais-tu ?", "Expliquer que le changement d'idée seul ne justifie pas automatiquement un remboursement."),
    ('open', "Un enfant pleure et refuse d'embarquer dans le kart. Que fais-tu ?", "Appliquer la politique de remboursement prévue pour cette situation."),
    ('open', "Un client attend depuis 1 h 15. Que dois-tu considérer ?", "Un remboursement ou une autre solution prévue par la politique."),
    ('open', "Un client demande immédiatement son argent. Quelle alternative peux-tu proposer ?", "Un certificat-cadeau."),
    ('open', "Tu effectues un remboursement mais oublies de l'inscrire dans Apex. Quelle erreur as-tu commise ?", "Une erreur administrative et comptable."),
    ('mc', "Un client ne respecte pas les règles sur la piste et est retiré de sa séance. A-t-il droit à un remboursement ?",
        ["Oui", "Non"], 1, None),
    ('open', "Pourquoi (le client retiré pour non-respect des règles n'a-t-il pas droit à un remboursement) ?", "Parce que le retrait est causé par son propre comportement."),
    ('open', "Un client devient insistant pour obtenir une exception. Que fais-tu ?", "Expliquer la politique et demander l'aide du gérant si nécessaire."),
    ('mc', "Un remboursement est accepté. Quelle est la prochaine étape ?",
        ["Rien", "Documenter la transaction", "Fermer la caisse", "Informer tous les clients"], 1, None),
    ('open', "Pourquoi faut-il rester calme lorsqu'un remboursement est refusé ?", "Pour maintenir un service professionnel et éviter les conflits."),
    ('open', "Un client affirme qu'il pleut et qu'il veut récupérer son argent. Selon la politique générale, est-ce automatique ?", "Non."),
    ('open', "Un client est arrivé en retard et manque son départ. A-t-il automatiquement droit à un remboursement ?", "Non."),
    ('open', "Un client demande un remboursement parce qu'il trouve les karts trop lents. Que fais-tu ?", "Expliquer que cela ne constitue pas une raison prévue par la politique."),
    ('open', "Un groupe de plusieurs personnes demande un remboursement collectif. Quelle est la première étape ?", "Vérifier les raisons exactes et appliquer la politique."),
    ('mc', "Quel est le plus grand risque lorsqu'on rembourse sans suivre les procédures ?",
        ["Aucun", "Des erreurs financières et des injustices entre clients",
         "Une file plus courte", "Une meilleure réputation"], 1, None),
    ('open', "Pourquoi les remboursements doivent-ils rester exceptionnels ?", "Parce qu'ils concernent une transaction déjà complétée et doivent respecter les règles de l'entreprise."),
    ('open', "Pourquoi le certificat-cadeau est-il souvent une bonne solution ?", "Il permet au client de revenir tout en évitant une perte immédiate pour l'entreprise."),
    ('open', "Pourquoi faut-il traiter tous les clients de la même façon ?", "Pour assurer l'équité et éviter les favoritismes."),
    ('mc', "Quelle qualité est la plus importante lorsqu'on gère une demande de remboursement ?",
        ["La rapidité", "L'improvisation", "Le jugement et le respect des procédures", "La négociation"], 2, None),
    ('mc', "Quel est l'objectif principal de la politique de remboursement ?",
        ["Donner raison à tous les clients", "Protéger à la fois le client et l'entreprise",
         "Réduire le travail administratif", "Augmenter les profits"], 1, None),
]
MODULES.append(("Remboursements et certificats-cadeaux", "Examen de certification — Niveau Employé. Politiques de remboursement, certificats-cadeaux et exceptions.", 15, M6))


# ──────────────── Génération SQL ────────────────
def esc(s):
    return s.replace("'", "''")

def choices_for(q):
    """Retourne [(texte, is_correct)] dans l'ordre d'affichage."""
    kind = q[0]
    if kind == 'mc':
        opts, correct = q[2], q[3]
        return [(opt, i == correct) for i, opt in enumerate(opts)]
    if kind == 'vf':
        correct = q[2]
        return [("Vrai", correct == 'V'), ("Faux", correct == 'F')]
    if kind == 'open':
        return [(q[2], True)]
    raise ValueError(kind)

def explanation_for(q):
    if q[0] == 'mc':
        return q[4]
    if q[0] == 'open':
        return None
    return None

def module_sql(title, desc, sort_order, questions):
    out = []
    out.append(f"DELETE FROM public.training_modules WHERE title = '{esc(title)}';")
    out.append("DO $$")
    out.append("DECLARE m_id uuid; c_id uuid; q_id uuid; qq uuid;")
    out.append("BEGIN")
    out.append(f"  INSERT INTO public.training_modules (title, description, content_type, sort_order, is_active) "
               f"VALUES ('{esc(title)}', '{esc(desc)}', 'text', {sort_order}, true) RETURNING id INTO m_id;")
    out.append(f"  INSERT INTO public.training_chapters (module_id, title, sort_order) "
               f"VALUES (m_id, '{esc(title)}', 0) RETURNING id INTO c_id;")
    out.append(f"  INSERT INTO public.quizzes (chapter_id, title, description, passing_score, is_active) "
               f"VALUES (c_id, 'Examen — {esc(title)}', '{esc(desc)}', 0.80, true) RETURNING id INTO q_id;")
    for idx, q in enumerate(questions, start=1):
        expl = explanation_for(q)
        expl_sql = "NULL" if not expl else "'" + esc(expl) + "'"
        out.append(f"  INSERT INTO public.quiz_questions (quiz_id, question_text, explanation, points, sort_order) "
                   f"VALUES (q_id, '{esc(q[1])}', {expl_sql}, 1, {idx}) RETURNING id INTO qq;")
        rows = []
        for ci, (ctext, correct) in enumerate(choices_for(q), start=1):
            rows.append(f"(qq, '{esc(ctext)}', {'true' if correct else 'false'}, {ci})")
        out.append("  INSERT INTO public.quiz_choices (question_id, choice_text, is_correct, sort_order) VALUES "
                   + ", ".join(rows) + ";")
    out.append("END $$;")
    return "\n".join(out)

if __name__ == "__main__":
    for i, (title, desc, sort_order, questions) in enumerate(MODULES, start=1):
        path = rf"C:\Users\xavpo\OneDrive\Desktop\amigo-karting\scripts\_quiz_m{i}.sql"
        with open(path, "w", encoding="utf-8") as f:
            f.write(module_sql(title, desc, sort_order, questions))

    total_q = sum(len(m[3]) for m in MODULES)
    print(f"Modules: {len(MODULES)}  Questions: {total_q}")
    for m in MODULES:
        print(f"  - {m[0]}: {len(m[3])} questions")
