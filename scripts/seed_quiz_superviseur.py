# -*- coding: utf-8 -*-
"""Quiz de la catégorie « Superviseur du service à la clientèle » (9 modules).
Les questions ouvertes (une seule réponse) ont été complétées avec des choix.
Génère 3 fichiers SQL pour exécution via MCP."""

CATEGORY = "Superviseur du service à la clientèle"
PASSING = 0.70

def vf(stmt, correct):
    return ('vf', stmt, correct)

MODULES = []

# ═══ M1 — Rôle et responsabilités du superviseur (25 q) ═══
M1 = [
    ('mc', "Quel est l'objectif ultime du superviseur ?", ["Faire plus de ventes", "Partir tôt", "Assurer la sécurité, le service, la propreté et l'application des processus", "Réparer les karts"], 2, None),
    ('mc', "Selon le manuel, la satisfaction des clients repose sur :", ["Prix bas seulement", "Service seulement", "Sécurité + service + installations + processus", "Vitesse des karts"], 2, None),
    ('mc', "Le superviseur doit maîtriser :", ["Seulement son manuel", "Seulement la caisse", "Son manuel, celui des préposés et celui de la caisse", "Seulement les procédures d'ouverture"], 2, None),
    ('mc', "Qui est responsable de vérifier que les employés effectuent correctement leur travail ?", ["Les clients", "Le superviseur", "Le mécanicien", "La caissière"], 1, None),
    ('mc', "Pourquoi le superviseur doit-il connaître les procédures de tous les postes ?", ["Pour remplacer les employés au besoin et vérifier leur travail", "Pour faire leur travail à leur place", "Pour fermer plus vite", "Pour réduire les ventes"], 0, None),
    vf("Le superviseur peut ignorer les erreurs mineures des employés.", 'F'),
    vf("Le superviseur doit maintenir les standards même lors des périodes occupées.", 'V'),
    vf("La sécurité est aussi importante que le service client.", 'V'),
    vf("Les processus doivent être appliqués de façon constante.", 'V'),
    vf("Une bonne expérience client dépend seulement du karting.", 'F'),
    ('mc', "Nomme les quatre éléments de la formule du succès mentionnée dans le manuel.", ["Sécurité, service à la clientèle, installations impeccables, processus appliqués", "Prix, vitesse, marketing, profits", "Karts, casques, piste, essence", "Ventes, rapidité, publicité, rabais"], 0, None),
    ('mc', "Pourquoi la maîtrise des manuels est-elle essentielle ?", ["Pour impressionner la direction", "Pour superviser efficacement et corriger les erreurs", "Pour gagner du temps", "Pour remplacer la formation"], 1, None),
    ('mc', "Un employé affirme qu'il connaît sa tâche et refuse les corrections. Que fais-tu ?", ["Le laisser faire à sa façon", "Rappeler les procédures et exiger le respect des standards", "L'ignorer", "Le renvoyer immédiatement"], 1, None),
    ('mc', "Un client se plaint de la propreté du site. Qui est responsable ?", ["La caissière seulement", "Le mécanicien", "Le superviseur demeure responsable de l'état général du site", "Personne"], 2, None),
    ('mc', "La caisse fonctionne bien mais la piste est mal entretenue. L'objectif est-il atteint ?", ["Oui, la caisse suffit", "Non. Tous les éléments de la formule doivent être respectés simultanément", "Oui, la piste n'est pas importante", "Cela dépend des ventes"], 1, None),
    ('mc', "Pourquoi un superviseur ne peut-il pas se limiter à son propre département ?", ["Parce que l'expérience client dépend de l'ensemble des opérations", "Parce qu'il s'ennuie", "Pour faire plus de ventes", "Pour fermer plus tôt"], 0, None),
    ('mc', "Quel est le danger principal d'un manque de supervision ?", ["Plus de profits", "Une baisse des standards", "Une meilleure ambiance", "Rien"], 1, None),
    ('mc', "Pourquoi les procédures existent-elles ?", ["Pour compliquer le travail", "Pour assurer la constance et la qualité", "Pour ralentir les employés", "Pour réduire les ventes"], 1, None),
    ('mc', "Quel est le rôle principal d'un leader sur le terrain ?", ["Surveiller sans intervenir", "Guider, corriger et soutenir son équipe", "Faire le travail à la place des employés", "Rester au bureau"], 1, None),
    ('mc', "Quelle responsabilité ne peut jamais être déléguée complètement ?", ["Le nettoyage", "La supervision globale du site", "La caisse", "Les pauses"], 1, None),
    ('mc', "Un excellent service peut-il compenser un manque de sécurité ?", ["Oui", "Non"], 1, None),
    ('mc', "Une piste impeccable compense-t-elle un mauvais service ?", ["Oui", "Non"], 1, None),
    ('mc', "Le superviseur doit-il vérifier le travail déjà effectué ?", ["Oui", "Non"], 0, None),
    ('mc', "Peut-on considérer une journée réussie malgré plusieurs procédures oubliées ?", ["Oui", "Non"], 1, None),
    ('mc', "Quel est le principal indicateur de succès ?", ["Le nombre de karts", "Des clients heureux", "Les heures travaillées", "La rapidité de fermeture"], 1, None),
]
MODULES.append(("Rôle et responsabilités du superviseur", "Examen de certification — Superviseur du service à la clientèle. Rôle global, formule du succès et responsabilités.", 50, M1))

# ═══ M2 — Ouverture du site et inspection de sécurité (20 q) ═══
M2 = [
    ('mc', "Lors de l'ouverture, le superviseur doit vérifier :", ["Seulement la caisse", "Seulement les karts", "L'ensemble du site", "Seulement les garages"], 2, None),
    ('mc', "Pourquoi faut-il inspecter la piste avant l'ouverture ?", ["Pour sauver du temps", "Pour identifier les dangers potentiels", "Pour augmenter les ventes", "Pour préparer les pauses"], 1, None),
    ('mc', "Lors de l'inspection, il faut vérifier :", ["Les pneus", "Le béton exposé", "Les chemins entre les pistes", "Toutes ces réponses"], 3, None),
    ('mc', "Les chemins entre les pistes doivent être :", ["Ouverts", "Fermés par des pneus", "Barrés par une chaîne", "Ignorés"], 1, None),
    ('mc', "Avant de programmer l'ordinateur du garage :", ["L'ordinateur de la cabane doit être ouvert", "Le mécanicien doit être présent", "La caisse doit être fermée", "Les clients doivent être arrivés"], 0, None),
    vf("Une inspection visuelle rapide est suffisante.", 'F'),
    vf("Un béton exposé représente un risque de sécurité.", 'V'),
    vf("Le superviseur est responsable de l'inspection du site.", 'V'),
    vf("L'ouverture peut commencer même si certains dangers n'ont pas été vérifiés.", 'F'),
    vf("La sécurité doit être validée avant l'arrivée des clients.", 'V'),
    ('mc', "Pourquoi faut-il vérifier les pneus de la piste ?", ["Pour s'assurer qu'ils sont bien positionnés et protègent les zones dangereuses", "Pour les compter", "Pour les nettoyer", "Pour vérifier leur couleur"], 0, None),
    ('mc', "Pourquoi vérifier les chemins entre les pistes ?", ["Pour décorer", "Pour empêcher l'accès à des zones non sécurisées", "Pour gagner du temps", "Pour les clients VIP"], 1, None),
    ('mc', "Quel est l'objectif principal de l'inspection préouverture ?", ["Faire plus de ventes", "Assurer la sécurité du personnel et des clients", "Préparer les pauses", "Tester les karts"], 1, None),
    ('mc', "Tu découvres un bloc de béton exposé durant l'inspection. Que fais-tu ?", ["L'ignorer", "Corriger immédiatement ou empêcher l'accès à la zone", "Attendre le mécanicien", "Ouvrir quand même"], 1, None),
    ('mc', "Un employé dit que la vérification n'est pas nécessaire aujourd'hui. Que fais-tu ?", ["Le croire", "Exiger que l'inspection complète soit effectuée", "Sauter l'inspection", "Le renvoyer"], 1, None),
    ('mc', "Tu observes plusieurs pneus déplacés. Que fais-tu ?", ["Les laisser ainsi", "Les replacer avant l'ouverture", "Les jeter", "Attendre la fermeture"], 1, None),
    ('mc', "Pourquoi l'ouverture influence-t-elle toute la journée ?", ["Les erreurs non détectées peuvent créer des problèmes toute la journée", "Parce qu'elle est longue", "Parce que les clients arrivent tôt", "Elle n'a aucun impact"], 0, None),
    ('mc', "Quel risque est créé par une inspection incomplète ?", ["Plus de ventes", "Accident, blessure ou mauvaise expérience client", "Aucun risque", "Une meilleure ambiance"], 1, None),
    ('mc', "Le superviseur peut-il déléguer l'inspection ?", ["Non, jamais", "Oui, mais il demeure responsable du résultat final", "Oui, sans aucune responsabilité", "Seulement au mécanicien"], 1, None),
    ('mc', "Quel est le lien entre sécurité et expérience client ?", ["Aucun lien", "Une expérience sécuritaire améliore la satisfaction globale", "La sécurité ralentit le service", "Les clients s'en moquent"], 1, None),
]
MODULES.append(("Ouverture du site et inspection de sécurité", "Examen de certification — Superviseur du service à la clientèle. Inspection préouverture et sécurité du site.", 51, M2))

# ═══ M3 — Huddle, gestion d'équipe et rotation des postes (20 q) ═══
M3 = [
    ('mc', "Selon le manuel, le Huddle doit avoir lieu :", ["30 minutes avant l'ouverture", "15 minutes avant l'ouverture", "À l'ouverture", "Après l'ouverture"], 1, None),
    ('mc', "Pendant le Huddle, le superviseur doit remettre :", ["Les horaires seulement", "Les walkie-talkies", "Les clés seulement", "Les uniformes"], 1, None),
    ('mc', "Quels objets doivent être remis aux préposés ?", ["Walkie-talkies", "Calepins", "Stylos", "Toutes ces réponses"], 3, None),
    ('mc', "Le superviseur doit s'assurer que chaque employé :", ["Est punché in", "Possède son équipement", "Connaît sa position", "Toutes ces réponses"], 3, None),
    ('mc', "Pourquoi la rotation des postes est-elle importante ?", ["Pour répartir efficacement le travail", "Pour réduire les ventes", "Pour éviter les inspections", "Pour fermer plus tôt"], 0, None),
    vf("Le Huddle est facultatif.", 'F'),
    vf("Chaque employé doit connaître son poste.", 'V'),
    vf("Les walkie-talkies sont importants pour la communication.", 'V'),
    vf("Un employé peut travailler sans oreillette.", 'F'),
    vf("Le superviseur doit vérifier que tout le monde est punché in.", 'V'),
    ('mc', "Quels sont les trois éléments principaux du Huddle ?", ["Communication, préparation et répartition des tâches", "Ventes, vitesse, profits", "Pauses, repas, départs", "Karts, casques, pneus"], 0, None),
    ('mc', "Pourquoi faut-il vérifier les positions de rotation ?", ["Pour gagner du temps", "Pour éviter la confusion durant le quart", "Pour réduire les pauses", "Pour impressionner les clients"], 1, None),
    ('mc', "Pourquoi les communications radio sont-elles importantes ?", ["Pour écouter de la musique", "Pour coordonner les opérations rapidement", "Pour passer le temps", "Pour parler aux clients"], 1, None),
    ('mc', "Un employé ne connaît pas sa position. Que fais-tu ?", ["Le laisser deviner", "Lui expliquer immédiatement sa position avant l'ouverture", "L'ignorer", "Le renvoyer chez lui"], 1, None),
    ('mc', "Un employé n'a pas son walkie-talkie. Que fais-tu ?", ["Le laisser travailler sans", "Lui fournir son équipement avant le début du quart", "Lui retirer une pause", "Attendre la fin du quart"], 1, None),
    ('mc', "Le Huddle est commencé mais deux employés ne sont pas punchés in. Que fais-tu ?", ["Continuer sans eux", "Corriger la situation immédiatement", "Les ignorer", "Annuler le Huddle"], 1, None),
    ('mc', "Quel impact un mauvais Huddle peut-il avoir ?", ["Aucun impact", "Désorganisation et baisse de performance", "Plus de ventes", "Une meilleure ambiance"], 1, None),
    ('mc', "Pourquoi la communication est-elle essentielle ?", ["Elle ralentit le travail", "Elle permet une coordination efficace du personnel", "Elle n'est pas nécessaire", "Elle dérange les clients"], 1, None),
    ('mc', "Quel est le rôle du superviseur pendant le Huddle ?", ["Rester silencieux", "Diriger, informer et préparer l'équipe", "Faire les tâches lui-même", "Vérifier la caisse"], 1, None),
    ('mc', "Comment reconnaître un Huddle efficace ?", ["Il est court", "Tous les employés comprennent leurs responsabilités", "Personne ne parle", "Il finit en retard"], 1, None),
]
MODULES.append(("Huddle, gestion d'équipe et rotation des postes", "Examen de certification — Superviseur du service à la clientèle. Huddle, équipement, communication et rotation.", 52, M3))

# ═══ M4 — Fermeture du site et checklist du gérant (20 q) ═══
M4 = [
    ('mc', "Selon le manuel, la première étape de fermeture est :", ["Fermer les lumières", "Ranger les caisses", "S'assurer que le site est propre", "Barrer la clôture"], 2, None),
    ('mc', "Le superviseur doit vérifier :", ["La checklist de la caissière", "Les garages", "Les walkie-talkies", "Toutes ces réponses"], 3, None),
    ('mc', "Combien de portes doivent être barrées à la cabane et aux salles de bain ?", ["2", "3", "5", "8"], 2, None),
    ('mc', "Les walkie-talkies doivent être :", ["Rangés", "Chargés", "Vérifiés", "Toutes ces réponses"], 3, None),
    ('mc', "Quelle est la dernière étape de fermeture ?", ["Fermer les lumières", "Barrer la clôture du chemin", "Ranger les rapports", "Vérifier la piste"], 1, None),
    vf("La fermeture commence seulement lorsque le site est vide.", 'F'),
    vf("Le close devrait commencer environ une heure avant la fermeture.", 'V'),
    vf("La qualité du service ne doit jamais diminuer pendant le close.", 'V'),
    vf("Les employés peuvent arrêter de surveiller la piste pour ranger les karts.", 'F'),
    vf("Tous les walkie-talkies doivent être retournés.", 'V'),
    ('mc', "Pourquoi faut-il vérifier la checklist de la caissière ?", ["Pour confirmer que toutes les tâches ont été réalisées correctement", "Pour la critiquer", "Pour gagner du temps", "Ce n'est pas nécessaire"], 0, None),
    ('mc', "Pourquoi faut-il fermer l'ordinateur du garage ?", ["Pour économiser l'électricité seulement", "Pour terminer les opérations de façon sécuritaire", "Pour le redémarrer", "Ce n'est pas obligatoire"], 1, None),
    ('mc', "Pourquoi vérifier les garages ?", ["Pour compter les karts", "Pour s'assurer qu'ils sont fermés et sécurisés", "Pour les nettoyer", "Pour faire le plein"], 1, None),
    ('mc', "Tu remarques qu'un walkie-talkie manque. Que fais-tu ?", ["Partir quand même", "Le localiser avant de quitter le site", "En commander un autre", "L'oublier"], 1, None),
    ('mc', "La piste est propre mais plusieurs déchets sont dans le stationnement. Que fais-tu ?", ["Ignorer le stationnement", "Faire nettoyer avant de fermer", "Fermer quand même", "Attendre demain"], 1, None),
    ('mc', "La checklist de la caissière n'est pas terminée. Que fais-tu ?", ["La compléter soi-même en cachette", "Exiger qu'elle soit complétée avant le départ", "La laisser incomplète", "Partir sans vérifier"], 1, None),
    ('mc', "Pourquoi le superviseur doit-il vérifier que les karts brisés sont inscrits au tableau ?", ["Pour faciliter le travail du mécanicien et assurer la sécurité", "Pour compter les karts", "Pour les vendre", "Ce n'est pas important"], 0, None),
    ('mc', "Pourquoi un close mal exécuté crée-t-il des problèmes le lendemain ?", ["Les erreurs et oublis s'accumulent pour l'équipe suivante", "Cela n'a aucun effet", "Cela améliore l'ouverture", "Cela réduit les ventes"], 0, None),
    ('mc', "Selon le manuel, combien de fois faut-il vérifier que le site est propre ?", ["Une seule fois", "Au moins deux fois durant la journée et avant la fermeture", "Jamais", "À chaque heure"], 1, None),
    ('mc', "Quel est l'objectif principal d'une fermeture exemplaire ?", ["Partir le plus vite possible", "Laisser un site sécuritaire, propre, organisé et prêt pour la prochaine journée", "Économiser l'électricité", "Réduire les tâches du lendemain seulement"], 1, None),
]
MODULES.append(("Fermeture du site et checklist du gérant", "Examen de certification — Superviseur du service à la clientèle. Procédure de fermeture et checklists.", 53, M4))

# ═══ M5 — Gestion des employés, pauses et performance (20 q) ═══
M5 = [
    ('mc', "Qui est responsable de gérer les pauses ?", ["Chaque employé", "La caissière", "Le superviseur", "Le mécanicien"], 2, None),
    ('mc', "Pourquoi faut-il éviter que tout le monde mange en même temps ?", ["Pour économiser", "Pour maintenir le service aux clients", "Pour finir plus tôt", "Pour réduire les coûts"], 1, None),
    ('mc', "Selon le manuel, la paresse chez certains employés peut :", ["N'avoir aucun effet", "Être contagieuse", "Améliorer l'ambiance", "Augmenter la productivité"], 1, None),
    ('mc', "Lorsqu'un employé termine sa tâche :", ["Il attend", "Il part en pause", "Il aide les autres", "Il quitte"], 2, None),
    ('mc', "Le superviseur doit :", ["Donner des tâches", "Aider l'équipe", "Superviser", "Toutes ces réponses"], 3, None),
    vf("Un employé peu performant doit être encadré.", 'V'),
    vf("Le superviseur doit tolérer les employés constamment négatifs.", 'F'),
    vf("Une bonne gestion des pauses influence le service.", 'V'),
    vf("Les employés peuvent choisir librement leurs pauses sans supervision.", 'F'),
    vf("La motivation d'un employé influence les autres.", 'V'),
    ('mc', "Trois employés veulent partir manger ensemble. Que fais-tu ?", ["Les laisser tous partir", "Répartir les pauses afin de maintenir le service", "Annuler les pauses", "Fermer le service"], 1, None),
    ('mc', "Un employé termine sa tâche et reste assis. Que fais-tu ?", ["Le laisser se reposer", "Le rediriger vers une autre tâche utile", "Le renvoyer", "L'ignorer"], 1, None),
    ('mc', "Un employé démotive constamment ses collègues. Que fais-tu ?", ["L'ignorer", "Intervenir rapidement et recadrer la situation", "Le récompenser", "Changer d'équipe"], 1, None),
    ('mc', "Pourquoi faut-il gérer activement les pauses ?", ["Pour compliquer l'horaire", "Pour maintenir l'efficacité opérationnelle", "Pour réduire les salaires", "Ce n'est pas nécessaire"], 1, None),
    ('mc', "Quel est le danger d'un manque d'encadrement ?", ["Plus de motivation", "Une baisse de performance générale", "Rien", "Une meilleure ambiance"], 1, None),
    ('mc', "Pourquoi le superviseur doit-il être visible sur le terrain ?", ["Pour surveiller de loin", "Pour soutenir l'équipe et corriger rapidement les problèmes", "Pour impressionner les clients", "Pour passer le temps"], 1, None),
    ('mc', "Quelle qualité d'un superviseur est mentionnée dans le manuel ?", ["Paresse", "Initiative", "Indifférence", "Lenteur"], 1, None),
    ('mc', "Quelle autre qualité est mentionnée ?", ["Négativité", "Positivisme", "Autorité brutale", "Distance"], 1, None),
    ('mc', "Quel est le rôle du superviseur envers les employés moins constants ?", ["Les ignorer", "Les remettre sur la bonne voie", "Les renvoyer immédiatement", "Les laisser faire"], 1, None),
    ('mc', "Quel est l'objectif final d'une bonne gestion d'équipe ?", ["Réduire les coûts", "Offrir une expérience client exceptionnelle", "Finir plus tôt", "Faire plus de pauses"], 1, None),
]
MODULES.append(("Gestion des employés, pauses et performance", "Examen de certification — Superviseur du service à la clientèle. Pauses, encadrement et performance de l'équipe.", 54, M5))

# ═══ M6 — Service recovery et clients mécontents (20 q) ═══
M6 = [
    ('mc', "Qui est principalement responsable des clients mécontents ?", ["La caisse", "Le mécanicien", "Le superviseur", "Le client"], 2, None),
    ('mc', "Le manuel indique que les actions :", ["Parlent plus fort que les mots", "Sont secondaires", "Coûtent trop cher", "Ne changent rien"], 0, None),
    ('mc', "Le concept de Service Recovery vise à :", ["Réparer les karts", "Corriger l'expérience client", "Réduire les ventes", "Éviter les remboursements"], 1, None),
    ('mc', "Selon le manuel, offrir un petit geste au client démontre :", ["De la faiblesse", "De la confiance et du souci du client", "Une erreur", "Une perte d'argent"], 1, None),
    ('mc', "Les employés doivent être :", ["Autorisés à résoudre certains problèmes", "Ignorés", "Limités", "Remplacés"], 0, None),
    vf("Un client frustré doit être ignoré.", 'F'),
    vf("Le superviseur doit intervenir rapidement.", 'V'),
    vf("Une petite attention peut améliorer l'expérience.", 'V'),
    vf("Le service recovery vise uniquement les remboursements.", 'F'),
    vf("La satisfaction client est une priorité.", 'V'),
    ('mc', "Un client attend depuis longtemps et devient frustré. Que fais-tu ?", ["L'ignorer", "Aller lui parler et lui donner une estimation claire", "Le faire attendre encore", "Lui dire de partir"], 1, None),
    ('mc', "Un groupe est mécontent du délai. Que fais-tu ?", ["Les ignorer", "Expliquer la situation et proposer une solution raisonnable", "Les rembourser tous", "Leur demander de revenir un autre jour"], 1, None),
    ('mc', "Un client quitte fâché. Que fais-tu ?", ["Le laisser partir sans rien faire", "Chercher à comprendre et récupérer l'expérience si possible", "Le bannir", "L'oublier"], 1, None),
    ('mc', "Pourquoi informer les clients des temps d'attente ?", ["Pour les décourager", "Réduire l'incertitude et la frustration", "Pour gagner du temps", "Ce n'est pas utile"], 1, None),
    ('mc', "Pourquoi le superviseur doit-il aller voir les clients ?", ["Pour vendre plus", "Communication proactive", "Pour les surveiller", "Par obligation légale"], 1, None),
    ('mc', "Quel est l'objectif du service recovery ?", ["Éviter de payer", "Transformer une mauvaise expérience en expérience acceptable ou positive", "Fermer le dossier", "Blâmer le client"], 1, None),
    ('mc', "Pourquoi l'autonomie des employés est-elle importante ?", ["Pour réduire la supervision", "Résoudre rapidement les problèmes fréquents", "Pour éviter le travail", "Ce n'est pas important"], 1, None),
    ('mc', "Quel message est envoyé lorsqu'on aide un client rapidement ?", ["Qu'on veut s'en débarrasser", "Que son expérience compte", "Qu'on est pressé", "Rien"], 1, None),
    ('mc', "Qui peut faire ou briser l'expérience client ?", ["Seulement le gérant", "Chaque employé", "Seulement la caisse", "Le client lui-même"], 1, None),
    ('mc', "Quel est le résultat recherché ?", ["Moins de plaintes écrites", "Des clients satisfaits malgré le problème initial", "Plus de remboursements", "Fermer plus vite"], 1, None),
]
MODULES.append(("Service recovery et clients mécontents", "Examen de certification — Superviseur du service à la clientèle. Récupération de l'expérience et clients mécontents.", 55, M6))

# ═══ M7 — Leadership et culture d'excellence (20 q) ═══
M7 = [
    ('mc', "Le manuel parle d'une culture de :", ["Productivité minimale", "Excellence", "Tolérance", "Rapidité"], 1, None),
    ('mc', "Un leader doit :", ["Être visible", "Être exigeant", "Être positif", "Toutes ces réponses"], 3, None),
    ('mc', "Le superviseur doit :", ["Inspirer", "Motiver", "Corriger", "Toutes ces réponses"], 3, None),
    ('mc', "La médiocrité doit être :", ["Acceptée", "Tolérée", "Refusée", "Ignorée"], 2, None),
    ('mc', "Selon le manuel, l'excellence est :", ["Un hasard", "Un état d'esprit", "Une règle", "Une récompense"], 1, None),
    vf("Le superviseur doit être positif.", 'V'),
    vf("Les bons comportements doivent être reconnus.", 'V'),
    vf("Le leadership repose uniquement sur l'autorité.", 'F'),
    vf("Les employés doivent se sentir importants.", 'V'),
    vf("Le superviseur doit demander de la rétroaction.", 'V'),
    ('mc', "Pourquoi reconnaître les bons coups ?", ["Pour perdre du temps", "Renforcer les comportements souhaités", "Pour favoriser certains", "Ce n'est pas utile"], 1, None),
    ('mc', "Pourquoi parler des reviews avec l'équipe ?", ["Pour blâmer", "Apprendre et s'améliorer", "Pour faire peur", "Pour gagner du temps"], 1, None),
    ('mc', "Quel est le rôle d'un leader lors d'un rush ?", ["Disparaître", "Garder l'équipe concentrée et organisée", "Paniquer", "Faire des pauses"], 1, None),
    ('mc', "Pourquoi l'excellence doit-elle être constante ?", ["Pour impressionner une fois", "Pour maintenir l'expérience client", "Ce n'est pas nécessaire", "Pour les inspections seulement"], 1, None),
    ('mc', "Comment une culture d'excellence se développe-t-elle ?", ["Par la peur", "En valorisant les bonnes actions", "Par hasard", "En ignorant les erreurs"], 1, None),
    ('mc', "Quel est le danger du « c'est assez bon » ?", ["Plus de motivation", "Une baisse progressive des standards", "Rien", "Une meilleure efficacité"], 1, None),
    ('mc', "Pourquoi faut-il célébrer les succès ?", ["Pour perdre du temps", "Maintenir la motivation", "Pour faire la fête", "Ce n'est pas important"], 1, None),
    ('mc', "Quel est le rôle du superviseur dans la culture d'entreprise ?", ["Rester invisible", "Donner l'exemple", "Critiquer", "Suivre les autres"], 1, None),
    ('mc', "Pourquoi corriger les mauvaises habitudes rapidement ?", ["Pour punir", "Pour éviter qu'elles deviennent normales", "Pour gagner du temps", "Ce n'est pas nécessaire"], 1, None),
    ('mc', "Quel est l'objectif ultime du leadership ?", ["Réduire les coûts", "Créer une équipe performante et engagée", "Imposer l'autorité", "Finir plus tôt"], 1, None),
]
MODULES.append(("Leadership et culture d'excellence", "Examen de certification — Superviseur du service à la clientèle. Leadership, reconnaissance et culture d'excellence.", 56, M7))

# ═══ M8 — Sécurité du site et prévention des risques (10 q) ═══
M8 = [
    ('mc', "Que faut-il vérifier sur la piste avant l'ouverture ?", ["Pneus, béton exposé, accès entre les pistes", "Les ventes de la veille", "La météo seulement", "Les uniformes"], 0, None),
    ('mc', "Pourquoi les pneus doivent-ils être bien placés ?", ["Pour la décoration", "Protection et sécurité", "Pour le bruit", "Pour la vitesse"], 1, None),
    ('mc', "Qui est responsable de la sécurité globale du site ?", ["Le client", "Le superviseur", "Le mécanicien seulement", "Personne"], 1, None),
    ('mc', "Un danger non corrigé doit-il être signalé ?", ["Non", "Oui, immédiatement", "Seulement à la fermeture", "Seulement s'il y a un blessé"], 1, None),
    ('mc', "Les règlements de piste doivent être appliqués :", ["Seulement le week-end", "En tout temps", "Seulement quand c'est occupé", "Quand le superviseur regarde"], 1, None),
    ('mc', "Les employés peuvent-ils tolérer l'alcool ou le cannabis sur le site ?", ["Oui", "Non"], 1, None),
    ('mc', "Pourquoi la sécurité influence-t-elle l'expérience client ?", ["Elle ne l'influence pas", "Les clients doivent se sentir en sécurité", "Elle ralentit le service", "Pour les assurances seulement"], 1, None),
    ('mc', "Que faire avec un client blessé ?", ["Attendre la fin de la course", "Intervention rapide et supervision immédiate", "L'ignorer s'il marche", "Remplir le rapport d'abord"], 1, None),
    ('mc', "Pourquoi inspecter le site plusieurs fois ?", ["Pour perdre du temps", "Détecter rapidement les problèmes", "Une fois suffit", "Pour les clients VIP"], 1, None),
    ('mc', "Quel est l'objectif principal de la sécurité du site ?", ["Vendre plus", "Prévenir les accidents", "Fermer plus vite", "Réduire le personnel"], 1, None),
]
MODULES.append(("Sécurité du site et prévention des risques", "Examen de certification — Superviseur du service à la clientèle. Prévention des risques et sécurité du site.", 57, M8))

# ═══ M9 — Gestion des opérations et efficacité (10 q) ═══
M9 = [
    ('mc', "Pourquoi utiliser les outils déjà en place ?", ["Pour compliquer", "Maintenir l'organisation", "Pour impressionner", "Ce n'est pas nécessaire"], 1, None),
    ('mc', "La feuille de rotation doit être :", ["Ignorée", "Utilisée constamment", "Utilisée une fois", "Cachée"], 1, None),
    ('mc', "Que se produit-il souvent lors d'un rush ?", ["Tout s'améliore", "Les employés arrêtent de suivre les procédures", "Rien ne change", "Les ventes baissent"], 1, None),
    ('mc', "Quel est le rôle du superviseur lors d'un rush ?", ["Disparaître", "Maintenir les processus", "Faire des pauses", "Réduire le service"], 1, None),
    ('mc', "Pourquoi vérifier la checklist de caisse aux 3 heures ?", ["Pour déranger la caissière", "Assurer le suivi des tâches", "Pour gagner du temps", "Ce n'est pas nécessaire"], 1, None),
    ('mc', "À quel moment les flats doivent-ils être terminés selon le manuel ?", ["À l'ouverture", "Avant le départ du personnel", "À midi", "Le lendemain"], 1, None),
    ('mc', "Pourquoi faut-il surveiller les fermetures ?", ["Pour ralentir", "Pour éviter les oublis", "Pour critiquer", "Ce n'est pas utile"], 1, None),
    ('mc', "Quel est le risque d'une mauvaise organisation ?", ["Plus de profits", "Retards et baisse du service", "Rien", "Une meilleure ambiance"], 1, None),
    ('mc', "Pourquoi faut-il être constant ?", ["Pour varier", "Maintenir la qualité opérationnelle", "Pour surprendre", "Ce n'est pas important"], 1, None),
    ('mc', "Quel est l'objectif principal de la gestion des opérations ?", ["Réduire le personnel", "Offrir un service efficace et constant", "Fermer plus tôt", "Augmenter les prix"], 1, None),
]
MODULES.append(("Gestion des opérations et efficacité", "Examen de certification — Superviseur du service à la clientèle. Constance opérationnelle et gestion des rushs.", 58, M9))


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
    groups = {"a": MODULES[0:3], "b": MODULES[3:6], "c": MODULES[6:9]}
    for key, mods in groups.items():
        sql = "\n\n".join(module_sql(t, d, so, qs) for (t, d, so, qs) in mods)
        open(base + rf"\_sup_{key}.sql", "w", encoding="utf-8").write(sql)
    total = sum(len(m[3]) for m in MODULES)
    print(f"Modules: {len(MODULES)} | Questions: {total}")
    for m in MODULES:
        print(f"  - {m[0]}: {len(m[3])}")
