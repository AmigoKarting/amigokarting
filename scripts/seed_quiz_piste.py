# -*- coding: utf-8 -*-
"""Quiz de la catégorie PISTE (11 modules). Les questions ouvertes (une seule
réponse) ont été complétées avec des choix plausibles pour devenir des
questions à choix multiples. Génère 3 fichiers SQL pour exécution via MCP."""

CATEGORY = "Piste"
PASSING = 0.70

def vf(stmt, correct):
    return ('vf', stmt, correct)

MODULES = []

# ═══ M1 — Mission, standards de qualité et culture Amigo ═══
M1 = [
    ('mc', "Quelle formule résume la philosophie de l'entreprise ?", ["Vitesse + Profit = Succès", "Sécurité + Marketing = Croissance", "Environnement sécuritaire + Service à la clientèle + Installations impeccables + Processus appliqués = Clients heureux", "Karts rapides + Bas prix = Clients heureux"], 2, None),
    ('mc', "Quel est l'objectif ultime de tous les employés ?", ["Faire rouler le plus de karts possible", "Créer des clients heureux", "Vendre davantage", "Réduire les dépenses"], 1, None),
    ('mc', "Pourquoi les procédures doivent-elles être appliquées rigoureusement ?", ["Pour impressionner les clients", "Parce qu'elles contribuent à la sécurité et à la qualité de l'expérience", "Pour faciliter les ventes", "Pour éviter de nettoyer"], 1, None),
    vf("La sécurité est uniquement la responsabilité du préposé de piste.", 'F'),
    ('mc', "Lorsqu'un employé voit une situation dangereuse, il doit :", ["Attendre le superviseur", "Corriger la situation immédiatement", "L'ignorer si ce n'est pas son département", "En parler à la fin du quart"], 1, None),
    ('mc', "Que signifie offrir un service à la clientèle hors pair ?", ["Faire tout ce que le client demande", "Respecter les standards de l'entreprise tout en offrant une excellente expérience", "Donner des rabais à tout le monde", "Éviter les conflits"], 1, None),
    ('mc', "Selon le manuel, le client a-t-il toujours raison ?", ["Oui", "Non", "Seulement les clients réguliers", "Seulement lorsqu'ils sont mécontents"], 1, None),
    ('mc', "Pourquoi le client n'a-t-il pas toujours raison ?", ["Parce qu'il n'est pas expert en sécurité et en karting", "Parce qu'il paie moins cher", "Parce qu'il ne connaît pas les employés", "Parce qu'il ne conduit pas bien"], 0, None),
    ('mc', "Un employé remarque qu'un kart est plus lent que les autres. Que doit-il faire ?", ["Ne rien faire", "Attendre que le client se plaigne", "Intervenir rapidement et offrir un autre kart", "Augmenter le temps de course"], 2, None),
    vf("Un client qui a payé cher pour son expérience devrait recevoir un kart en excellent état.", 'V'),
    ('mc', "Que signifie « Over Deliver » ?", ["Vendre davantage", "Dépasser les attentes du client", "Travailler plus vite", "Ajouter plus de karts"], 1, None),
    ('mc', "Si une interruption survient pendant une course, que doit-on faire ?", ["Ignorer le temps perdu", "Réduire le temps de tous", "Redonner le temps perdu aux clients", "Offrir une bouteille d'eau"], 2, None),
    ('mc', "Lorsqu'un client est insatisfait, quelle est la meilleure approche ?", ["Argumenter", "Ignorer sa plainte", "Écouter et comprendre la raison de son insatisfaction", "Lui dire qu'il a tort"], 2, None),
    ('mc', "Pourquoi faut-il rapporter les incidents de clients mécontents ?", ["Pour blâmer quelqu'un", "Pour trouver des solutions et éviter que la situation se reproduise", "Pour créer un dossier", "Pour réduire les remboursements"], 1, None),
    vf("Un employé calme aide souvent à calmer un client fâché.", 'V'),
    ('mc', "Que doit éviter un employé lorsqu'un client est frustré ?", ["Utiliser des exemples réels", "Rester calme", "Réagir avec les mêmes émotions que le client", "Expliquer les raisons de sécurité"], 2, None),
    ('mc', "Que préfèrent généralement les clients lorsqu'ils reçoivent des conseils de conduite ?", ["Ils détestent cela", "Ils aiment recevoir des conseils et progresser", "Ils quittent la piste", "Ils demandent un remboursement"], 1, None),
    ('mc', "Pourquoi faut-il engager des conversations avec les clients lorsqu'il y a moins d'achalandage ?", ["Pour faire passer le temps", "Pour améliorer leur expérience", "Pour vendre des produits", "Pour éviter de travailler"], 1, None),
    vf("Un transpondeur qui cesse de fonctionner doit être retiré rapidement afin d'éviter de nuire à l'expérience client.", 'V'),
    ('mc', "Quelle est la priorité numéro 1 dans toutes les décisions ?", ["Les profits", "La rapidité", "La sécurité", "Le marketing"], 2, None),
]
MODULES.append(("Mission, standards de qualité et culture Amigo", "Examen de certification — Niveau Piste. Mission, valeurs et culture d'Amigo Karting.", 30, M1))

# ═══ M2 — Service à la clientèle et expérience client ═══
M2 = [
    ('mc', "Après une course, quelle est la première chose à faire avec les clients ?", ["Leur demander de quitter", "Les libérer rapidement de leur casque", "Imprimer les temps", "Fermer la piste"], 1, None),
    ('mc', "Pourquoi faut-il aider rapidement les clients à enlever leur casque ?", ["Pour accélérer la sortie des puits", "Pour nettoyer les casques", "Pour préparer la piste", "Pour gagner du temps administratif"], 0, None),
    ('mc', "Que doit-on faire avec les cagoules usagées ?", ["Les jeter", "Les laisser sur un banc", "Les placer dans le bac prévu", "Les donner aux clients"], 2, None),
    ('mc', "Pourquoi demande-t-on au client comment il a aimé sa course ?", ["Pour remplir le temps", "Pour augmenter son enthousiasme et terminer son expérience positivement", "Pour vendre une autre course", "Pour faire un sondage"], 1, None),
    ('mc', "Que doit-on proposer au client après sa course ?", ["Un casque", "Une feuille de temps", "Une combinaison", "Une photo obligatoire"], 1, None),
    ('mc', "Quel est le rôle du raccompagnateur à la sortie ?", ["Ignorer les clients", "Les remercier et leur souhaiter une bonne journée", "Nettoyer les karts", "Vérifier l'essence"], 1, None),
    vf("Il faut s'assurer que les clients ne repartent pas avec l'équipement appartenant à l'entreprise.", 'V'),
    ('mc', "Un client mentionne que son kart fonctionne mal. Quelle est la bonne réponse ?", ["Retournez sur la piste", "Continuez jusqu'à la fin", "On vous donne un autre kart et on vérifie celui-ci", "Ce n'est probablement rien"], 2, None),
    ('mc', "Pourquoi doit-on tester le kart signalé par un client ?", ["Parce que le client a toujours raison", "Pour confirmer son état avant de le réutiliser", "Pour gagner du temps", "Pour rassurer les autres employés"], 1, None),
    vf("Même si plusieurs plaintes de kart sont causées par le pilote, le kart doit quand même être vérifié.", 'V'),
    ('mc', "Lorsqu'un kart brise et que le changement prend plus d'une minute, quelle compensation est prévue ?", ["Rien", "5 minutes gratuites", "Certificat-cadeau de 10 minutes", "Remboursement complet"], 2, None),
    ('mc', "Si un client manque de gaz ou que son kart brise sans sa faute ?", ["Rien", "Course gratuite de 15 minutes", "Réduction de prix", "Casque gratuit"], 1, None),
    vf("Lorsqu'on retire du temps à un client avant la fin de sa séance, il faut compenser ce temps.", 'V'),
    ('mc', "Pourquoi faut-il toujours être empathique avec un client insatisfait ?", ["Pour éviter les discussions", "Pour redresser son expérience", "Pour obtenir une meilleure note", "Pour vendre davantage"], 1, None),
    ('mc', "Un client est très fâché à propos d'une décision de sécurité. Quelle est la meilleure attitude ?", ["Hausser le ton", "Être calme et expliquer les raisons de sécurité", "Quitter la conversation", "Le contredire immédiatement"], 1, None),
    ('mc', "Pourquoi utiliser des exemples de la vraie vie avec les clients ?", ["Pour les divertir", "Pour mieux faire comprendre les risques", "Pour paraître expert", "Pour gagner du temps"], 1, None),
    vf("Les émotions d'un employé peuvent influencer les émotions d'un client.", 'V'),
    ('mc', "Lorsqu'un client est satisfait de son expérience, il est plus susceptible :", ["De revenir", "De se plaindre", "De demander un remboursement", "D'éviter l'entreprise"], 0, None),
    ('mc', "Quel est l'objectif principal du service à la clientèle ?", ["Créer une expérience mémorable et sécuritaire", "Vendre plus", "Finir rapidement", "Réduire les tâches"], 0, None),
    ('mc', "Que doit faire un employé lorsqu'il n'est pas occupé ?", ["Utiliser son téléphone", "Aider les clients et améliorer leur expérience", "Attendre une tâche", "Quitter son poste"], 1, None),
]
MODULES.append(("Service à la clientèle et expérience client", "Examen de certification — Niveau Piste. Accueil, sortie de piste et expérience client.", 31, M2))

# ═══ M3 — Briefing des clients et préparation avant la course ═══
M3 = [
    ('mc', "Combien de temps avant la fin prévue d'un groupe doit-on aller chercher le prochain groupe ?", ["5 minutes", "10 minutes", "15 minutes minimum", "Lorsque la piste est vide"], 2, None),
    ('mc', "Pourquoi faut-il aller chercher le prochain groupe à l'avance ?", ["Pour éviter les temps morts", "Pour vendre davantage", "Pour réduire le nettoyage", "Pour finir plus tôt"], 0, None),
    ('mc', "Lors du briefing, quelle est la responsabilité principale de l'employé ?", ["Faire rire les clients", "S'assurer qu'ils comprennent les règles de sécurité", "Imprimer les feuilles de temps", "Distribuer des prix"], 1, None),
    vf("Un client qui parle constamment durant le briefing peut manquer des informations importantes de sécurité.", 'V'),
    ('mc', "Que doit faire l'employé si quelqu'un discute pendant la vidéo de sécurité ?", ["L'ignorer", "Arrêter la vidéo et demander son attention", "Continuer quand même", "Expulser immédiatement le client"], 1, None),
    ('mc', "Avant qu'un client embarque dans un kart, il doit être capable :", ["De toucher le volant", "D'appuyer complètement sur les pédales en gardant le dos appuyé", "D'atteindre le pare-chocs", "De conduire une automobile"], 1, None),
    ('mc', "Quel est le poids maximal autorisé pour un pilote ?", ["250 lb", "275 lb", "300 lb", "350 lb"], 2, None),
    ('mc', "Quel est l'âge minimum pour conduire un Mini-Kart ?", ["6 ans", "7 ans", "8 ans", "10 ans"], 2, None),
    ('mc', "Quel est l'âge minimum pour conduire un Go-Kart ?", ["10 ans", "11 ans", "12 ans", "14 ans"], 2, None),
    ('mc', "Quel est l'âge minimum pour conduire un Super-Kart ?", ["14 ans", "15 ans", "16 ans", "18 ans"], 2, None),
    ('mc', "Quelle taille minimale est exigée pour un Super-Kart ?", ["4'10\"", "5'0\"", "5'4\"", "5'6\""], 1, None),
    vf("Le port du chandail est obligatoire.", 'V'),
    ('mc', "Un enfant de 2 ans peut-il être passager dans un kart double ?", ["Oui", "Non"], 1, None),
    ('mc', "Quel est l'âge minimal pour être passager dans un kart double ?", ["2 ans", "3 ans", "4 ans", "5 ans"], 1, None),
    ('mc', "Une personne de 12 ans peut-elle conduire un passager dans un kart double ?", ["Oui", "Non"], 1, None),
    ('mc', "Pourquoi les cheveux longs doivent-ils être attachés ?", ["Pour être plus professionnels", "Pour des raisons de sécurité", "Pour les photos", "Pour le confort"], 1, None),
    ('mc', "Un client affirme qu'il a déjà fait du kart ailleurs et refuse d'écouter le briefing. Que fais-tu ?", ["Tu le laisses faire", "Tu exiges qu'il participe au briefing comme tout le monde", "Tu lui fais signer un papier", "Tu ignores la situation"], 1, None),
    ('mc', "Un client mesure moins que la taille minimale exigée pour le Super-Kart. Que fais-tu ?", ["On le laisse conduire", "On lui donne un kart plus lent", "On refuse pour des raisons de sécurité", "On demande à un ami de confirmer sa taille"], 2, None),
    ('mc', "Pourquoi faut-il être rigoureux avec les prérequis ?", ["Pour compliquer l'accès", "Pour assurer la sécurité", "Pour limiter les clients", "Pour gagner du temps"], 1, None),
    ('mc', "Quel est l'objectif final du briefing ?", ["Faire signer les clients", "Préparer des pilotes sécuritaires", "Faire respecter les horaires", "Imprimer les résultats"], 1, None),
]
MODULES.append(("Briefing des clients et préparation avant la course", "Examen de certification — Niveau Piste. Briefing de sécurité, prérequis d'âge, taille et poids.", 32, M3))

# ═══ M4 — Gestion de piste, supervision et sécurité ═══
M4 = [
    ('mc', "La gestion de piste peut être résumée en un mot. Lequel ?", ["Vitesse", "Discipline", "Sécurité", "Contrôle"], 2, None),
    ('mc', "Quel est l'équivalent du rôle du préposé de piste selon le manuel ?", ["Un arbitre", "Un policier", "Un garde de sécurité", "Un mécanicien"], 2, None),
    ('mc', "Pourquoi faut-il demeurer visible lorsqu'on surveille la piste ?", ["Pour paraître occupé", "Pour réduire les comportements dangereux", "Pour impressionner les clients", "Pour voir les temps"], 1, None),
    vf("Le simple fait de surveiller activement la piste réduit les comportements dangereux.", 'V'),
    ('mc', "Quelle position est recommandée pour surveiller la piste ?", ["Assis", "Couché", "Debout", "Peu importe"], 2, None),
    ('mc', "Si des pneus sont déplacés et créent un danger, tu dois :", ["Attendre la fin du groupe", "Les replacer immédiatement", "Aviser un client", "Attendre le mécanicien"], 1, None),
    ('mc', "Quand faut-il arrêter une course ?", ["Lorsqu'un client est lent", "Lorsqu'un danger important risque de blesser quelqu'un", "Lorsqu'il pleut légèrement", "Lorsqu'un kart est rapide"], 1, None),
    ('mc', "Un préposé au fond de la piste perd le contrôle de la situation. Que doit-il faire ?", ["Continuer seul", "Demander du renfort", "Ignorer certains incidents", "Fermer la piste"], 1, None),
    ('mc', "Quel est le rôle principal du renfort envoyé au fond ?", ["Faire le plein", "Utiliser le drapeau rouge", "Remplacer le superviseur", "Imprimer les temps"], 1, None),
    ('mc', "Quelle est la priorité lorsque l'on déprend un client coincé ?", ["Le temps", "Le kart", "La sécurité", "La vitesse"], 2, None),
    ('mc', "Avant d'aider un client coincé, il faut :", ["Utiliser le drapeau jaune", "Courir immédiatement", "Arrêter tous les groupes", "Déplacer le kart"], 0, None),
    ('mc', "Pourquoi faut-il attendre que le trafic passe avant d'intervenir ?", ["Pour économiser son énergie", "Pour sa propre sécurité", "Pour éviter les plaintes", "Pour gagner du temps"], 1, None),
    ('mc', "Un client se coince une première fois dans les pneus. Quelle est l'intervention normale ?", ["Expulsion", "Jogger pour le déprendre", "Fermer la piste", "Changer son kart"], 1, None),
    ('mc', "Un même client se coince une deuxième fois. Que doit-on ajouter ?", ["Une expulsion", "Une explication sur sa conduite", "Une récompense", "Un changement de piste"], 1, None),
    ('mc', "Pourquoi doit-on coacher les clients qui conduisent mal ?", ["Pour améliorer leur sécurité", "Pour réduire les accidents", "Pour faciliter le travail du personnel", "Toutes ces réponses"], 3, None),
    vf("Si un client n'a pas le contrôle de son kart, il sera encore plus dangereux lorsque des employés sont dans la piste.", 'V'),
    ('mc', "Que doit-on faire si un client mentionne que son kart fonctionne mal ?", ["Lui demander de continuer", "Lui fournir un autre kart", "Ignorer sa plainte", "Attendre la fin de la course"], 1, None),
    ('mc', "Quelle visibilité minimale est nécessaire pour garder la piste ouverte ?", ["50 mètres", "75 mètres", "100 mètres", "125 mètres"], 3, None),
    ('mc', "Que doit-on faire en présence d'éclairs ?", ["Continuer", "Fermer la piste", "Réduire la vitesse", "Ajouter un surveillant"], 1, None),
    ('mc', "Un groupe complet devient agressif et dangereux. Quelle est la bonne procédure ?", ["Expulser tout le monde immédiatement", "Arrêter tout le groupe, expliquer le problème et donner un dernier avertissement général", "Réduire le temps de course", "Ignorer la situation"], 1, None),
]
MODULES.append(("Gestion de piste, supervision et sécurité", "Examen de certification — Niveau Piste. Surveillance, interventions et arrêts de course.", 33, M4))

# ═══ M5 — Les drapeaux et les interventions sur la piste ═══
M5 = [
    ('mc', "À quoi servent principalement les drapeaux ?", ["Décorer la piste", "Protéger les employés et les clients", "Identifier les employés", "Faire ralentir les karts dans les courbes"], 1, None),
    ('mc', "Pourquoi l'utilisation des drapeaux est-elle essentielle ?", ["Pour faire respecter les horaires", "Pour projeter une image professionnelle et être plus visible", "Pour vendre plus de courses", "Pour impressionner les clients"], 1, None),
    ('mc', "Les drapeaux doivent être :", ["Cachés dans le garage", "À portée rapide et bien entretenus", "Conservés dans un kart", "Déposés dans les puits"], 1, None),
    ('mc', "Pourquoi faut-il garder les drapeaux propres ?", ["Pour qu'ils durent plus longtemps", "Parce qu'ils reflètent l'image de l'entreprise", "Pour éviter les amendes", "Pour les photos"], 1, None),
    vf("Un drapeau devrait être visible en permanence afin que les clients s'y habituent.", 'F'),
    ('mc', "Pourquoi ne faut-il pas laisser les drapeaux visibles lorsqu'ils ne sont pas utilisés ?", ["Ils se salissent", "Les clients finissent par moins les respecter", "Ils bloquent la vue", "Ils prennent de la place"], 1, None),
    ('mc', "Quand utilise-t-on le drapeau jaune ?", ["Lorsqu'il y a un danger ou une intervention sur la piste", "Pour annoncer la fin d'une course", "Pour expulser un client", "Pour démarrer un groupe"], 0, None),
    ('mc', "Un pilote passe trop vite près d'un drapeau jaune. Que doit-on faire ?", ["Rien", "Lui donner un avertissement", "Lui offrir un nouveau kart", "Fermer la piste"], 1, None),
    ('mc', "Si le même pilote recommence après un avertissement concernant un drapeau jaune ?", ["Deuxième avertissement", "Expulsion", "Changement de kart", "Suspension d'une minute"], 1, None),
    ('mc', "Quel équipement supplémentaire est recommandé au fond de la piste avec le drapeau jaune ?", ["Radio supplémentaire", "Lampe de poche", "Lumière clignotante", "Casque supplémentaire"], 2, None),
    ('mc', "Le drapeau rouge sert principalement à :", ["Signaler une intervention disciplinaire", "Démarrer une course", "Signaler un kart rapide", "Signaler la pluie"], 0, None),
    ('mc', "Où doit-on donner un avertissement avec drapeau rouge ?", ["Au milieu d'une courbe", "Dans une zone sécuritaire", "Derrière un mur", "N'importe où"], 1, None),
    ('mc', "Pourquoi faut-il éviter les sorties de courbe lors d'un avertissement ?", ["Les clients ont peu de temps pour réagir", "Le bruit est trop fort", "La radio fonctionne mal", "Les drapeaux sont moins visibles"], 0, None),
    ('mc', "Lorsque tu utilises le drapeau rouge, tu dois :", ["Tourner le dos aux clients", "Être visible et pointer le pilote concerné", "Garder le drapeau caché", "T'approcher du kart"], 1, None),
    ('mc', "Après combien de passages devant le drapeau rouge un client peut-il être expulsé s'il refuse d'obéir ?", ["2", "3", "4", "5"], 2, None),
    ('mc', "Un pilote ignore trois fois ton drapeau rouge. Que fais-tu ?", ["Dernier avertissement", "Expulsion", "Changement de kart", "Réduction du temps"], 1, None),
    ('mc', "Pourquoi la courbe Nascar est-elle considérée spéciale ?", ["Elle est plus lente", "Les pilotes y arrivent à très haute vitesse avec peu de visibilité", "Les karts y tombent en panne", "Elle est réservée aux experts"], 1, None),
    ('mc', "Un kart est immobilisé dans la courbe Nascar. Quelle est la procédure ?", ["Drapeau jaune", "Arrêt complet de la course", "Ignorer", "Envoyer un client aider"], 1, None),
    ('mc', "Lors d'un déblocage de kart, quelle est la première priorité ?", ["Le temps", "Le kart", "La sécurité", "Le classement"], 2, None),
    ('mc', "Quelle règle doit toujours guider l'utilisation des drapeaux ?", ["Être visible", "Être rapide", "Être bruyant", "Être proche des karts"], 0, None),
]
MODULES.append(("Les drapeaux et les interventions sur la piste", "Examen de certification — Niveau Piste. Drapeaux jaune et rouge, avertissements et interventions.", 34, M5))

# ═══ M6 — Avertissements, expulsions et clients difficiles ═══
M6 = [
    ('mc', "Pourquoi doit-on donner des avertissements rapidement ?", ["Pour démontrer son autorité", "Parce que les comportements dangereux empirent généralement", "Pour terminer plus vite", "Pour respecter les horaires"], 1, None),
    ('mc', "Même un léger bumping doit être :", ["Toléré", "Ignoré", "Considéré sérieusement", "Récompensé"], 2, None),
    ('mc', "Quelle approche est recommandée lors d'un avertissement ?", ["Menace", "Approche conseil", "Moquerie", "Confrontation"], 1, None),
    ('mc', "Quel est l'ordre normal des interventions ?", ["Expulsion immédiate", "Avertissement → Dernier avis → Expulsion", "Suspension → Remboursement", "Changement de kart → Expulsion"], 1, None),
    vf("Un employé témoin d'un incident devrait normalement donner lui-même l'avertissement.", 'V'),
    ('mc', "Peut-on simplement demander à un collègue par radio de donner tous nos avertissements ?", ["Oui", "Non"], 1, None),
    ('mc', "Pourquoi faut-il utiliser le drapeau jaune lorsqu'on donne un avertissement ?", ["Pour être plus visible et sécuritaire", "Pour ralentir tous les pilotes", "Pour décorer la piste", "Pour aider la radio"], 0, None),
    ('mc', "Que doit-on faire avant d'entrer dans la piste pour parler à un pilote ?", ["Vérifier le trafic", "Courir immédiatement", "Arrêter tous les karts", "Enlever son casque"], 0, None),
    ('mc', "Un client refuse d'écouter ton avertissement. Quelle est la première action recommandée ?", ["Ignorer", "Éteindre son moteur", "Le rembourser", "Appeler la police"], 1, None),
    ('mc', "Pourquoi ne faut-il jamais laisser partir un client avant qu'il ait compris l'intervention ?", ["Pour conserver la crédibilité et le contrôle de la piste", "Pour gagner du temps", "Pour éviter les papiers", "Pour respecter le règlement municipal"], 0, None),
    ('mc', "Un client pousse volontairement les autres karts. Quelle comparaison recommande le manuel ?", ["Le hockey", "Le vélo", "Une voiture poussée à 70 km/h", "La motoneige"], 2, None),
    ('mc', "Que doit-on expliquer à un client qui pousse les autres ?", ["Que c'est amusant", "Que les protections d'un kart sont limitées", "Que les pneus sont solides", "Que c'est permis"], 1, None),
    ('mc', "Quelles sont les quatre causes principales d'un spin-out mentionnées dans le manuel ?", ["Pneus usés seulement", "Courbe trop rapide, freinage en courbe, brake/gaz, blocage de l'essieu", "Mauvais moteur seulement", "Mauvaise météo seulement"], 1, None),
    ('mc', "Un client effectue constamment des spin-out. Quelle doit être ton intervention ?", ["Le coacher et lui expliquer comment corriger sa conduite", "L'ignorer", "Lui donner un kart plus rapide", "Le féliciter"], 0, None),
    ('mc', "Pourquoi les spin-out sont-ils dangereux ?", ["Ils ralentissent la course", "Ils augmentent la consommation d'essence", "Ils peuvent provoquer des collisions majeures", "Ils usent les pneus"], 2, None),
    ('mc', "Peut-on demander à un client lent d'aller plus vite ?", ["Oui", "Non"], 1, None),
    ('mc', "Que doit-on faire avec un client très lent mais sécuritaire ?", ["L'expulser", "Lui demander d'aller plus vite", "Lui demander de garder la droite", "Arrêter la course"], 2, None),
    ('mc', "Combien d'avertissements minimum faut-il généralement donner avant une expulsion ?", ["Aucun", "Au moins un, sauf faute très grave", "Trois obligatoirement", "Cinq obligatoirement"], 1, None),
    ('mc', "Lorsqu'un client est expulsé, où doit-on l'arrêter ?", ["Dans une courbe", "À l'autre bout de la piste", "Dans les puits", "Sur la ligne de course"], 2, None),
    ('mc', "Un client est blessé à cause d'un geste dangereux d'un autre pilote clairement identifié. Quelle est la conséquence ?", ["Avertissement verbal", "Changement de kart", "Expulsion automatique du pilote fautif", "Réduction du temps de course"], 2, None),
]
MODULES.append(("Avertissements, expulsions et clients difficiles", "Examen de certification — Niveau Piste. Avertissements, expulsions, spin-out et clients difficiles.", 35, M6))

# ═══ M7 — Les puits, gestion des groupes et opérations de piste ═══
M7 = [
    ('mc', "Lorsqu'un groupe termine sa course, combien de groupes doivent être présents dans les puits à la fois ?", ["2", "3", "1", "Illimité"], 2, None),
    ('mc', "Pourquoi ne doit-on jamais avoir deux groupes dans les puits en même temps ?", ["Pour éviter la confusion et les risques d'accident", "Pour économiser de l'essence", "Pour améliorer les temps", "Pour réduire le bruit"], 0, None),
    ('mc', "Si un groupe termine moins de 3 minutes après un autre groupe, que doit-on faire ?", ["Les arrêter séparément", "Les arrêter ensemble", "Ajouter du temps", "Les envoyer dans un autre puits"], 1, None),
    ('mc', "Lorsque tu arrêtes les karts dans les puits, dans quel ordre dois-tu les immobiliser ?", ["Avant vers arrière", "Milieu vers extérieur", "Arrière vers avant", "Peu importe"], 2, None),
    ('mc', "Pourquoi faut-il arrêter les karts de l'arrière vers l'avant ?", ["Pour empêcher les karts de foncer dans ceux dont les pilotes se lèvent", "Pour accélérer la sortie", "Pour faciliter le nettoyage", "Pour voir les numéros"], 0, None),
    ('mc', "Comment les karts doivent-ils être placés dans les puits ?", ["Avec un espace d'un kart", "En diagonale", "Bumper à bumper", "Face à face"], 2, None),
    vf("Il est permis de laisser les clients sortir de leur kart avant que tout le groupe soit immobilisé.", 'F'),
    ('mc', "Que dois-tu faire si un client tente de sortir de son kart trop tôt ?", ["L'ignorer", "Lui demander de se rasseoir immédiatement", "Arrêter toute la piste", "Lui retirer du temps"], 1, None),
    ('mc', "Pourquoi cette règle (rester assis jusqu'à l'arrêt complet) existe-t-elle ?", ["Pour protéger les chevilles et éviter les blessures", "Pour accélérer les opérations", "Pour économiser l'essence", "Pour les assurances seulement"], 0, None),
    ('mc', "Qui peut traverser la clôture des puits ?", ["N'importe qui", "Les spectateurs", "Les personnes qui vont faire du kart", "Les amis des clients"], 2, None),
    ('mc', "Un ami veut prendre une photo sur le bord de la piste. Quelle est la réponse ?", ["Oui", "Oui avec un casque", "Non, c'est trop dangereux", "Seulement 30 secondes"], 2, None),
    ('mc', "À quelle distance minimale les spectateurs doivent-ils rester de la piste ?", ["2 m", "5 m", "10 m", "20 m"], 2, None),
    ('mc', "Que doit faire un raccompagnateur lorsqu'il retire les casques ?", ["Les empiler au hasard", "Vérifier que les clients ne partent pas avec l'équipement", "Les laisser aux clients", "Les déposer sur la piste"], 1, None),
    ('mc', "Que doit-on faire des cagoules sales ?", ["Les jeter", "Les laisser sur une table", "Les rapporter à l'endroit prévu", "Les remettre aux clients"], 2, None),
    ('mc', "Quel est l'objectif de demander aux clients s'ils ont aimé leur course ?", ["Créer une expérience positive jusqu'à la fin", "Gagner du temps", "Réduire les plaintes", "Vendre des casques"], 0, None),
    ('mc', "Que doit faire un employé lorsqu'il change un client de kart ?", ["Rien", "Informer les collègues par radio selon la procédure prévue", "Écrire le numéro sur un papier seulement", "Attendre la fin de la course"], 1, None),
    vf("Lors d'un changement de kart, le message radio doit être répété jusqu'à confirmation du préposé au temps.", 'V'),
    ('mc', "Quelle est la règle de 3 mentionnée dans le manuel ?", ["Trois avertissements", "Trois employés minimum", "Lorsque trois karts sont partis dans la même rangée, il faut avancer les karts immédiatement", "Trois groupes maximum"], 2, None),
    ('mc', "Si la piste est vide et qu'un nouveau groupe arrive dans cinq minutes, que doit faire le préposé au fond ?", ["Utiliser son téléphone", "Replacer les pneus ou aider aux puits", "Quitter son poste", "Attendre"], 1, None),
    ('mc', "Quelle est la priorité générale dans les puits ?", ["Rapidité", "Apparence", "Sécurité", "Productivité"], 2, None),
]
MODULES.append(("Les puits, gestion des groupes et opérations de piste", "Examen de certification — Niveau Piste. Puits, immobilisation des karts et opérations.", 36, M7))

# ═══ M8 — Karts, mécanique de base, essence et inspections ═══
M8 = [
    ('mc', "Lorsqu'un client affirme que son kart fonctionne mal, quelle est la première chose à faire ?", ["Lui demander de continuer", "Lui fournir un autre kart", "L'ignorer", "Lui offrir un remboursement"], 1, None),
    ('mc', "Pourquoi doit-on tester le kart signalé ?", ["Pour confirmer son état réel", "Pour rassurer le client", "Pour vérifier la vitesse", "Toutes ces réponses"], 3, None),
    vf("Un kart signalé comme défectueux peut être immédiatement donné à un autre client sans vérification.", 'F'),
    ('mc', "Quel est le but principal d'un test de kart ?", ["Avoir du plaisir", "Vérifier que le kart est sécuritaire", "Faire un meilleur temps", "User les pneus"], 1, None),
    ('mc', "Lors d'un test, comment doit-on conduire ?", ["Comme un pilote professionnel", "Comme si le kart était en parfait état", "Comme si le kart était dans sa pire condition possible", "Le plus vite possible"], 2, None),
    ('mc', "Un frein qui demande beaucoup plus d'effort est :", ["Normal", "Un signe de problème", "Un avantage", "Un ajustement mineur"], 1, None),
    ('mc', "Des freins bruyants doivent mener à :", ["Rien", "Une inspection mécanique", "Une augmentation de vitesse", "Un nettoyage seulement"], 1, None),
    ('mc', "Une colonne de direction lousse est :", ["Acceptable", "Dangereuse", "Normale", "Temporaire"], 1, None),
    ('mc', "Que faut-il faire si une composante est brisée ?", ["Continuer à utiliser le kart", "Envoyer le kart au garage", "Donner le kart à un client expérimenté", "Réduire son temps de piste"], 1, None),
    ('mc', "Que signifie un gaz qui colle ?", ["Le moteur ne démarre pas", "Le kart avance sans pression sur l'accélérateur", "Le volant est bloqué", "Le frein est coincé"], 1, None),
    ('mc', "Que faut-il faire si le gaz colle ?", ["Retirer immédiatement le kart du service", "Continuer à l'utiliser", "Diminuer la vitesse", "Ajouter de l'essence"], 0, None),
    ('mc', "Une switch ON/OFF qui ne fonctionne pas est :", ["Un défaut critique", "Sans importance", "Normale", "Seulement un problème électrique mineur"], 0, None),
    ('mc', "Un kart beaucoup trop rapide ou beaucoup trop lent doit :", ["Être inspecté", "Continuer à rouler", "Être réservé aux experts", "Être utilisé seulement le soir"], 0, None),
    ('mc', "Pourquoi faut-il laisser passer le trafic avant de tester un kart ?", ["Pour mieux évaluer le kart", "Pour éviter de gêner les clients", "Pour améliorer la sécurité", "Toutes ces réponses"], 3, None),
    ('mc', "Que signifie le phénomène « brake/gaz » ?", ["Le pilote freine seulement", "Le pilote accélère seulement", "Le pilote appuie simultanément sur l'accélérateur et le frein", "Le moteur cale"], 2, None),
    ('mc', "Pourquoi le brake/gaz est-il problématique ?", ["Il endommage la transmission", "Il use les freins", "Il peut entraîner des défaillances", "Toutes ces réponses"], 3, None),
    ('mc', "Comment repère-t-on souvent un conducteur qui fait du brake/gaz ?", ["Le moteur devient plus bruyant dans les courbes", "Le kart fume", "Les pneus crient", "Le volant vibre"], 0, None),
    ('mc', "Si un kart est arrêté et que le client continue d'appuyer sur l'accélérateur, que faut-il faire ?", ["Attendre", "Courir pousser la pédale vers le client", "Éteindre la piste", "Changer le moteur"], 1, None),
    ('mc', "Combien de Super-Karts peut-on mettre en piste si 15 sont disponibles dans les puits ?", ["15", "14", "13", "12"], 2, None),
    ('mc', "Pourquoi doit-on conserver au moins deux Super-Karts en réserve ?", ["Pour les photos", "Pour remplacer rapidement un kart défectueux", "Pour les employés", "Pour économiser du carburant"], 1, None),
]
MODULES.append(("Karts, mécanique de base, essence et inspections", "Examen de certification — Niveau Piste. Tests de karts, mécanique de base et inspections.", 37, M8))

# ═══ M9 — Accidents, blessures et procédures d'urgence ═══
# Q11-20 : mises en situation complétées avec des choix
M9 = [
    ('mc', "Qu'est-ce qu'un accident majeur ?", ["Un kart coincé dans les pneus", "Un accident avec blessé ou grand impact", "Une panne mécanique", "Une sortie de piste mineure"], 1, None),
    ('mc', "Quelle est la première étape lors d'un accident majeur ?", ["Remplir un rapport", "Arrêter immédiatement la course par radio", "Appeler les parents", "Déplacer les karts"], 1, None),
    ('mc', "Après l'arrêt de la course, quelle est la priorité ?", ["Trouver le responsable", "S'occuper du blessé", "Repartir la course", "Déplacer les pneus"], 1, None),
    ('mc', "Que doit-on demander au blessé en premier ?", ["Qui est responsable ?", "Es-tu correct ?", "Quel kart conduisais-tu ?", "Veux-tu un remboursement ?"], 1, None),
    ('mc', "Qui appelle l'ambulance si nécessaire ?", ["Le client", "Le préposé au fond", "Le gérant", "Le mécanicien"], 2, None),
    vf("Il faut répondre aux demandes du blessé au meilleur de ses capacités.", 'V'),
    ('mc', "Après que la situation soit stabilisée, que faut-il faire ?", ["Repartir la course", "Chercher les causes et circonstances", "Fermer le site", "Changer les pneus"], 1, None),
    ('mc', "Quel document doit être rempli après un accident majeur ?", ["Feuille de temps", "Rapport d'accident", "Bon de travail", "Contrat"], 1, None),
    ('mc', "Pourquoi faut-il noter les détails observés après l'accident ?", ["Pour améliorer les statistiques", "Pour documenter correctement l'événement", "Pour calculer les temps", "Pour la maintenance"], 1, None),
    ('mc', "Si la course est arrêtée pour un accident majeur, que faut-il faire avec le temps perdu ?", ["Rien", "Le remettre aux clients", "Couper le temps restant", "Offrir un breuvage"], 1, None),
    ('mc', "Un client dit avoir mal au cou après un impact. Quelle est ta priorité ?", ["Repartir la course rapidement", "Prendre la situation au sérieux et s'occuper du blessé avant toute autre chose", "Lui demander de terminer sa course", "Remplir le rapport avant de l'aider"], 1, None),
    ('mc', "Tu ne sais pas si la blessure est grave. Dois-tu minimiser la situation ?", ["Oui", "Non"], 1, None),
    ('mc', "Un collègue veut repartir la course rapidement. Est-ce prioritaire ?", ["Oui", "Non"], 1, None),
    ('mc', "Un blessé demande de l'eau. Que fais-tu ?", ["Refuser systématiquement", "Répondre à sa demande dans la mesure du possible", "L'ignorer", "Lui demander d'attendre la fin de la journée"], 1, None),
    ('mc', "Qui est responsable de déterminer les causes de l'accident ?", ["Le client blessé", "L'équipe doit recueillir les informations après avoir sécurisé la situation", "Personne", "Le pilote fautif seulement"], 1, None),
    ('mc', "Pourquoi faut-il poser des questions au blessé ?", ["Pour gagner du temps", "Pour comprendre les circonstances et ses besoins", "Pour le distraire", "Pour remplir le rapport plus vite"], 1, None),
    ('mc', "Peut-on ignorer un impact important si le client semble correct ?", ["Oui", "Non"], 1, None),
    ('mc', "Quelle est la priorité absolue lors d'un accident ?", ["Le temps de course", "La sécurité et l'état du blessé", "Le classement", "La satisfaction des autres clients"], 1, None),
    ('mc', "Que doit-on faire avant de discuter des responsabilités ?", ["Contrôler la situation et aider le blessé", "Trouver le coupable", "Repartir la course", "Appeler les parents"], 0, None),
    ('mc', "Quel est l'objectif de toute intervention d'urgence ?", ["Gagner du temps", "Éviter les plaintes", "Assurer la sécurité et limiter les conséquences de l'accident", "Protéger l'équipement"], 2, None),
]
MODULES.append(("Accidents, blessures et procédures d'urgence", "Examen de certification — Niveau Piste. Accidents majeurs, blessés et procédures d'urgence.", 38, M9))

# ═══ M10 — Grand Prix et opérations avancées ═══
M10 = [
    ('mc', "Avant d'asseoir les clients pour un Grand Prix, que faut-il vérifier ?", ["Les pneus", "Que les karts sont pleins d'essence", "Les casques", "Les radios"], 1, None),
    ('mc', "Quand faut-il changer la session dans Apex ?", ["Après la qualification", "Avant la qualification", "Après la finale", "À la fermeture"], 1, None),
    ('mc', "À la fin de la qualification, que doit faire un préposé ?", ["Nettoyer les karts", "Imprimer la feuille de temps", "Faire le plein", "Fermer la piste"], 1, None),
    ('mc', "Que ne faut-il surtout pas oublier après la qualification ?", ["Le drapeau jaune", "Partir la course", "Les casques", "Le souffleur"], 1, None),
    ('mc', "Où doit-on arrêter les coureurs après la qualification ?", ["Dans les puits", "Au fond de la piste", "À l'entrée", "Dans le garage"], 1, None),
    ('mc', "Comment les pilotes sont-ils replacés pour le départ ?", ["Au hasard", "Selon l'ordre d'arrivée", "Selon l'ordre de qualification", "Par âge"], 2, None),
    ('mc', "Quel drapeau est utilisé pour le départ ?", ["Rouge", "Jaune", "Vert", "Noir"], 2, None),
    ('mc', "Pourquoi faut-il surveiller les passages sur la ligne après avoir démarré la course ?", ["Pour compter les spectateurs", "Pour s'assurer qu'aucun pilote ne complète un tour de façon incorrecte avant le départ officiel", "Pour vérifier l'essence", "Pour chronométrer les puits"], 1, None),
    ('mc', "Les karts personnels peuvent-ils rouler avec les karts de location ?", ["Oui", "Non"], 1, None),
    ('mc', "Si les deux pistes sont utilisées par les clients, que doit faire le propriétaire d'un kart personnel ?", ["Rouler quand même", "Attendre qu'une piste se libère", "Rouler plus lentement", "Payer un supplément"], 1, None),
]
MODULES.append(("Grand Prix et opérations avancées", "Examen de certification — Niveau Piste. Déroulement d'un Grand Prix et opérations avancées.", 39, M10))

# ═══ M11 — Service client avancé et gestion des plaintes ═══
M11 = [
    ('mc', "Le client a-t-il toujours raison ?", ["Oui", "Non"], 1, None),
    ('mc', "Pourquoi le client n'a-t-il pas toujours raison ?", ["Parce qu'il n'est pas l'expert en sécurité", "Parce qu'il paie moins", "Parce qu'il ne connaît pas les règles", "Parce qu'il conduit mal"], 0, None),
    ('mc', "Que doit-on faire lorsqu'un transpondeur cesse de fonctionner ?", ["Attendre", "Retirer le kart immédiatement", "Redémarrer la course", "Ignorer"], 1, None),
    ('mc', "Un kart est clairement plus lent que les autres. Que fais-tu ?", ["Rien", "Tu offres un autre kart au client", "Tu réduis le temps", "Tu avertis le client"], 1, None),
    ('mc', "Que signifie « Over Deliver » ?", ["Dépasser les attentes du client", "Vendre davantage", "Rouler plus vite", "Faire plus de publicité"], 0, None),
    ('mc', "Quel type de compensation peut être offert ?", ["Temps de piste", "Breuvage", "Rabais futur", "Toutes ces réponses"], 3, None),
    ('mc', "Comment doit-on réagir avec un client fâché ?", ["En s'énervant aussi", "En restant calme et rationnel", "En argumentant", "En l'ignorant"], 1, None),
    ('mc', "Pourquoi utiliser des exemples de la vraie vie ?", ["Pour mieux expliquer les risques", "Pour impressionner", "Pour gagner du temps", "Pour divertir"], 0, None),
    ('mc', "Que faut-il faire avec un incident impliquant un client mécontent ?", ["L'oublier", "Le rapporter au superviseur", "Le cacher", "Attendre une plainte"], 1, None),
    ('mc', "Pourquoi faut-il comprendre la raison de l'insatisfaction du client ?", ["Pour trouver des solutions", "Pour améliorer le service", "Pour éviter que ça se reproduise", "Toutes ces réponses"], 3, None),
]
MODULES.append(("Service client avancé et gestion des plaintes", "Examen de certification — Niveau Piste. Service client avancé, plaintes et compensations.", 40, M11))


# ──────────────── Génération SQL ────────────────
def esc(s):
    return s.replace("'", "''")

def choices_for(q):
    if q[0] == 'mc':
        opts, correct = q[2], q[3]
        return [(o, i == correct) for i, o in enumerate(opts)]
    if q[0] == 'vf':
        return [("Vrai", q[2] == 'V'), ("Faux", q[2] == 'F')]
    raise ValueError(q[0])

def explanation_for(q):
    return q[4] if q[0] == 'mc' else None

def module_sql(title, desc, sort_order, questions):
    out = [f"DELETE FROM public.training_modules WHERE title = '{esc(title)}';",
           "DO $$", "DECLARE m_id uuid; c_id uuid; q_id uuid; qq uuid;", "BEGIN",
           f"  INSERT INTO public.training_modules (title, description, content_type, category, sort_order, is_active) "
           f"VALUES ('{esc(title)}', '{esc(desc)}', 'text', '{esc(CATEGORY)}', {sort_order}, true) RETURNING id INTO m_id;",
           f"  INSERT INTO public.training_chapters (module_id, title, sort_order) VALUES (m_id, '{esc(title)}', 0) RETURNING id INTO c_id;",
           f"  INSERT INTO public.quizzes (chapter_id, title, description, passing_score, is_active) "
           f"VALUES (c_id, 'Examen — {esc(title)}', '{esc(desc)}', {PASSING}, true) RETURNING id INTO q_id;"]
    for idx, q in enumerate(questions, start=1):
        expl = explanation_for(q)
        expl_sql = "NULL" if not expl else "'" + esc(expl) + "'"
        out.append(f"  INSERT INTO public.quiz_questions (quiz_id, question_text, explanation, points, sort_order) "
                   f"VALUES (q_id, '{esc(q[1])}', {expl_sql}, 1, {idx}) RETURNING id INTO qq;")
        rows = [f"(qq, '{esc(t)}', {'true' if c else 'false'}, {i})" for i, (t, c) in enumerate(choices_for(q), start=1)]
        out.append("  INSERT INTO public.quiz_choices (question_id, choice_text, is_correct, sort_order) VALUES " + ", ".join(rows) + ";")
    out.append("END $$;")
    return "\n".join(out)

if __name__ == "__main__":
    base = r"C:\Users\xavpo\OneDrive\Desktop\amigo-karting\scripts"
    groups = {"a": MODULES[0:4], "b": MODULES[4:8], "c": MODULES[8:11]}
    for key, mods in groups.items():
        sql = "\n\n".join(module_sql(t, d, so, qs) for (t, d, so, qs) in mods)
        open(base + rf"\_piste_{key}.sql", "w", encoding="utf-8").write(sql)
    total = sum(len(m[3]) for m in MODULES)
    print(f"Modules: {len(MODULES)} | Questions: {total}")
    for m in MODULES:
        print(f"  - {m[0]}: {len(m[3])}")
