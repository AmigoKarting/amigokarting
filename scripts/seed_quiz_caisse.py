# -*- coding: utf-8 -*-
"""Génère le SQL pour les modules 7 à 12 (Manuel de la caisse) — catégorie
« Caisse - Amigo Karting ». Mêmes conventions que seed_quiz_text.py."""

CATEGORY = "Caisse - Amigo Karting"

def vf(stmt, correct):
    return ('vf', stmt, correct)

# (title, description, sort_order, passing, [questions])
MODULES = []

# ═══ MODULE 7 — KARTING SOUS LA PLUIE ═══
M7 = [
    ('mc', "Peut-on faire du karting lorsqu'il pleut ?", ["Non", "Oui", "Seulement les adultes", "Seulement les groupes"], 1, None),
    ('mc', "Pourquoi est-il important d'aviser les clients lorsqu'il pleut ?", ["Pour leur faire peur", "Pour qu'ils comprennent les conditions de piste", "Pour vendre moins de billets", "Pour éviter de répondre aux questions"], 1, None),
    ('mc', "Lorsque la piste est mouillée, elle devient :", ["Plus rapide", "Plus glissante", "Plus courte", "Plus large"], 1, None),
    ('mc', "Comment les clients doivent-ils adapter leur conduite ?", ["En étant plus prudents", "En accélérant davantage", "En freinant moins", "En ignorant les consignes"], 0, None),
    ('mc', "La pluie excuse-t-elle un mauvais comportement sur la piste ?", ["Oui", "Toujours", "Non", "Seulement pour les enfants"], 2, None),
    ('mc', "Un client qui perd le contrôle volontairement de son kart sous la pluie :", ["N'est pas responsable", "Est responsable de sa conduite", "Reçoit un remboursement", "Obtient un tour gratuit"], 1, None),
    ('mc', "Lorsqu'un client achète une course alors qu'il pleut déjà, il doit être informé :", ["Des conditions de piste", "Du nom du mécanicien", "Du nombre de karts", "Du prix du carburant"], 0, None),
    ('mc', "Que faut-il mentionner lorsqu'un orage semble possible ?", ["Aucun remboursement en raison de la pluie", "Les karts seront plus rapides", "La piste sera vide", "Les règles changent"], 0, None),
    ('mc', "La pluie fait généralement :", ["Augmenter l'adhérence", "Diminuer l'adhérence", "Disparaître les virages", "Doubler la vitesse"], 1, None),
    ('open', "Pourquoi la transparence est-elle importante avec les clients ?", "Pour éviter les malentendus et les plaintes."),
    vf("Le karting est automatiquement annulé lorsqu'il commence à pleuvoir.", 'F'),
    vf("La piste devient plus glissante sous la pluie.", 'V'),
    vf("Les clients doivent être informés des risques supplémentaires.", 'V'),
    vf("La pluie donne automatiquement droit à un remboursement.", 'F'),
    vf("Les règles de sécurité restent les mêmes sous la pluie.", 'V'),
    vf("Les clients doivent adapter leur conduite aux conditions.", 'V'),
    vf("Les pertes de contrôle répétées peuvent entraîner une intervention du personnel.", 'V'),
    vf("Une bonne communication réduit les conflits.", 'V'),
    vf("La météo peut influencer les attentes des clients.", 'V'),
    vf("Un client doit savoir dans quelles conditions il va rouler avant de payer.", 'V'),
    ('open', "Un client arrive et il pleut légèrement. Que dois-tu faire avant de lui vendre une course ?", "L'informer que la piste est mouillée et plus glissante."),
    ('open', "Un client affirme : « Je ne savais pas qu'on roulait sous la pluie. » Quelle erreur a probablement été commise ?", "Les conditions n'ont pas été expliquées clairement avant la vente."),
    ('open', "Un client demande : « Est-ce dangereux ? » Que réponds-tu ?", "Le karting est permis sous la pluie, mais les conditions sont plus glissantes et les consignes de sécurité doivent être respectées."),
    ('open', "Un client veut un remboursement parce que ses vêtements sont mouillés. Que fais-tu ?", "Expliquer la politique de l'entreprise et rappeler que les conditions avaient été annoncées."),
    ('open', "Un client hésite à acheter une course à cause de la météo. Que peux-tu faire ?", "Lui expliquer honnêtement les conditions actuelles de la piste."),
    ('open', "Un groupe a réservé plusieurs jours d'avance et il pleut le jour de l'activité. Que dois-tu faire ?", "Leur rappeler que les activités ont généralement lieu même sous la pluie."),
    ('open', "Un client croit que les collisions sont permises parce que la piste est mouillée. Que réponds-tu ?", "Les règles de sécurité sont exactement les mêmes."),
    ('open', "Pourquoi est-il important d'expliquer la météo avant la vente ?", "Pour que le client puisse prendre une décision éclairée."),
    ('open', "Un client devient frustré parce qu'il roule moins vite sous la pluie. Que fais-tu ?", "Lui expliquer que les conditions de piste influencent naturellement la conduite."),
    ('mc', "Quelle est la meilleure approche ?", ["Cacher les conditions météo", "Être transparent avec le client", "Éviter les questions", "Donner de fausses garanties"], 1, None),
    ('open', "Un client dit : « Je pensais que vous fermiez quand il pleut. » Quelle réponse est correcte ?", "Non, le karting peut se poursuivre sous la pluie."),
    ('open', "Un client affirme : « Personne ne m'a dit que la piste serait glissante. » Que dois-tu faire ?", "Écouter sa préoccupation et vérifier que les procédures d'information ont été respectées."),
    ('mc', "Pourquoi les clients réagissent parfois négativement à la pluie ?", ["Parce que l'expérience est différente de leurs attentes", "Parce que les karts sont brisés", "Parce que la piste ferme toujours", "Parce que les prix augmentent"], 0, None),
    ('mc', "Quel est le meilleur moyen de prévenir une plainte liée à la pluie ?", ["Offrir un remboursement", "Bien informer le client avant l'achat", "Éviter la conversation", "Réduire le temps de course"], 1, None),
    ('open', "Quel est le rôle du caissier lors d'une journée de pluie ?", "Informer clairement les clients des conditions et des politiques applicables."),
    ('open', "Pourquoi l'information donnée avant la vente est-elle importante ?", "Parce qu'un client bien informé est moins susceptible d'être déçu."),
    ('open', "Pourquoi la pluie est-elle un sujet sensible pour certains clients ?", "Parce qu'elle modifie l'expérience de conduite qu'ils s'attendaient à vivre."),
    ('mc', "Quelle qualité est essentielle lorsqu'on explique les conditions météo ?", ["La rapidité", "La transparence", "La négociation", "L'improvisation"], 1, None),
    ('mc', "Quel est l'objectif principal de la politique concernant la pluie ?", ["Vendre plus de billets", "Assurer que les clients comprennent les conditions avant de participer", "Réduire le travail", "Fermer plus souvent"], 1, None),
    ('mc', "Une excellente gestion des journées de pluie permet :", ["De réduire les plaintes", "D'améliorer l'expérience client", "D'éviter les malentendus", "Toutes ces réponses"], 3, None),
]
MODULES.append(("Karting sous la pluie et conditions météo", "Examen de certification — Niveau Employé. Procédures et communication par temps de pluie.", 16, 0.80, M7))

# ═══ MODULE 8 — OUVERTURE DE LA CAISSE ═══
M8 = [
    ('mc', "Quelle est la première étape de l'ouverture ?", ["Vendre des billets", "Démarrer l'ordinateur", "Nettoyer les toilettes", "Ouvrir la piste"], 1, None),
    ('mc', "Quel est le montant du fonds de caisse qui doit être présent ?", ["300 $", "400 $", "500 $", "1000 $"], 2, None),
    ('mc', "Pourquoi faut-il compter la caisse à l'ouverture ?", ["Pour vérifier que le fonds est exact", "Pour perdre du temps", "Pour compter les profits", "Pour préparer les remboursements"], 0, None),
    ('mc', "Si le montant n'est pas de 500 $, que faut-il faire en premier ?", ["Ignorer le problème", "Recompter la caisse", "Fermer la caisse", "Appeler la banque"], 1, None),
    ('mc', "Après avoir recompté, si l'écart demeure, il faut :", ["Laisser la situation ainsi", "Aviser le gérant", "Fermer l'entreprise", "Recommencer demain"], 1, None),
    ('mc', "Les écarts doivent être :", ["Cachés", "Inscrits au rapport", "Ignorés", "Déduits des ventes"], 1, None),
    ('mc', "Que faut-il vérifier après la caisse ?", ["Les messages vocaux", "Les pneus des karts", "Le stationnement", "Les uniformes"], 0, None),
    ('mc', "Pourquoi faut-il consulter les messages ?", ["Pour retourner les appels des clients", "Pour remplir le temps", "Pour fermer le téléphone", "Pour faire la comptabilité"], 0, None),
    ('mc', "Que faut-il consulter avant l'arrivée des clients ?", ["Les réservations du jour", "Les profits du mois", "Les réseaux sociaux", "Les horaires des mécaniciens"], 0, None),
    ('open', "Pourquoi faut-il connaître les réservations du jour ?", "Pour mieux gérer les attentes et l'achalandage."),
    vf("La caisse doit contenir exactement 500 $.", 'V'),
    vf("On peut vendre immédiatement sans compter la caisse.", 'F'),
    vf("Les messages vocaux font partie de l'ouverture.", 'V'),
    vf("Les réservations du jour doivent être vérifiées.", 'V'),
    vf("Un écart de caisse doit être signalé.", 'V'),
    vf("Le rapport du soir peut servir à expliquer un écart constaté le matin.", 'V'),
    vf("Les appels manqués doivent être rappelés.", 'V'),
    vf("Le téléphone est un outil important dès l'ouverture.", 'V'),
    vf("Les réservations influencent la gestion de la journée.", 'V'),
    vf("Une bonne ouverture facilite tout le reste du quart de travail.", 'V'),
    ('open', "Tu comptes la caisse et trouves 495 $. Que fais-tu ?", "Recompter immédiatement."),
    ('open', "Après recomptage, il manque toujours 5 $. Que fais-tu ?", "Aviser le gérant et noter l'écart."),
    ('open', "Tu arrives et vois plusieurs messages vocaux. Quelle est ta priorité ?", "Les écouter et rappeler les clients."),
    ('open', "Un client laisse un message concernant une réservation. Que fais-tu ?", "Le rappeler dès que possible."),
    ('open', "Pourquoi faut-il rappeler rapidement ?", "Pour offrir un bon service à la clientèle."),
    ('open', "Tu remarques une réservation importante à 14 h. Pourquoi est-ce utile de le savoir dès le matin ?", "Pour gérer les temps d'attente et les places disponibles."),
    ('open', "Tu oublies de consulter les réservations. Quel problème cela peut-il causer ?", "Une mauvaise gestion de l'achalandage."),
    ('open', "Tu oublies de compter la caisse. Quel risque cela crée-t-il ?", "Ne pas détecter un problème financier dès le début de la journée."),
    ('open', "Un client se présente avant l'ouverture. Peut-on parfois le servir ?", "Oui, si les tâches d'ouverture sont déjà complétées."),
    ('open', "Pourquoi faut-il terminer les tâches d'ouverture avant de vendre ?", "Pour s'assurer que les opérations sont prêtes et exactes."),
    ('mc', "Quel est l'objectif principal du fonds de caisse ?", ["Faire du profit", "Avoir suffisamment de monnaie pour les transactions", "Payer les employés", "Faire des remboursements seulement"], 1, None),
    ('open', "Pourquoi les appels manqués sont-ils importants ?", "Ils peuvent représenter des ventes ou des réservations."),
    ('open', "Pourquoi faut-il vérifier les réservations chaque jour même si on les connaît déjà ?", "Parce qu'il peut y avoir des changements ou des ajouts."),
    ('mc', "Quel est le danger de négliger les tâches d'ouverture ?", ["Retards", "Erreurs", "Mauvais service", "Toutes ces réponses"], 3, None),
    ('open', "Quel document aide à expliquer un problème de caisse observé le matin ?", "Le rapport de fermeture précédent."),
    ('open', "Pourquoi l'ouverture est-elle une étape critique de la journée ?", "Parce qu'elle prépare toutes les opérations qui suivront."),
    ('mc', "Quelle qualité est la plus importante lors de l'ouverture ?", ["La vitesse", "La rigueur", "L'humour", "La créativité"], 1, None),
    ('open', "Pourquoi faut-il être méthodique ?", "Pour éviter les oublis."),
    ('open', "Quel est le principal avantage d'une ouverture bien faite ?", "Une journée plus fluide et moins de problèmes opérationnels."),
    ('mc', "Un employé qui maîtrise parfaitement l'ouverture contribue à :", ["Réduire les erreurs", "Améliorer le service", "Faciliter la gestion de la journée", "Toutes ces réponses"], 3, None),
]
MODULES.append(("Ouverture de la caisse", "Examen de certification — Niveau Employé. Fonds de caisse, messages, réservations et tâches d'ouverture.", 17, 0.80, M8))

# ═══ MODULE 9 — FERMETURE DE LA CAISSE ═══
M9 = [
    ('mc', "Quelle est la première étape de la fermeture ?", ["Quitter", "Compter la caisse", "Éteindre les lumières", "Fermer les portes"], 1, None),
    ('mc', "Pourquoi faut-il compter la caisse ?", ["Vérifier l'exactitude des transactions", "Connaître les profits", "Préparer le lendemain", "Toutes ces réponses"], 3, None),
    ('mc', "À combien doit être remis le fonds de caisse pour le lendemain ?", ["300 $", "400 $", "500 $", "1000 $"], 2, None),
    ('open', "Que fait-on avec l'argent excédentaire au-delà du fonds de caisse ?", "Il doit être préparé selon les procédures de dépôt de l'entreprise."),
    ('mc', "Une différence de caisse doit être :", ["Ignorée", "Cachée", "Notée et expliquée", "Détruite"], 2, None),
    ('open', "Pourquoi faut-il identifier les écarts ?", "Pour assurer un suivi comptable précis."),
    ('mc', "Une fermeture incomplète peut causer :", ["Des erreurs financières", "Des problèmes administratifs", "Des difficultés à l'ouverture", "Toutes ces réponses"], 3, None),
    ('mc', "Avant de quitter, il faut vérifier :", ["Les rapports", "La caisse", "Les lieux", "Toutes ces réponses"], 3, None),
    ('mc', "La fermeture est aussi importante que :", ["Les ventes", "L'ouverture", "Les réservations", "Les appels"], 1, None),
    ('open', "Quel est l'objectif principal de la fermeture ?", "S'assurer que toutes les opérations de la journée sont correctement terminées."),
    vf("Le fonds de caisse doit être remis à 500 $.", 'V'),
    vf("Une différence de caisse doit être signalée.", 'V'),
    vf("On peut quitter sans vérifier les rapports.", 'F'),
    vf("La fermeture influence le travail du lendemain.", 'V'),
    vf("Toutes les transactions doivent être comptabilisées.", 'V'),
    vf("Les remboursements doivent apparaître dans les registres.", 'V'),
    vf("Les certificats-cadeaux peuvent influencer les chiffres de la journée.", 'V'),
    vf("Les erreurs non détectées deviennent plus difficiles à corriger.", 'V'),
    vf("Le nettoyage fait partie de la fermeture.", 'V'),
    vf("Une bonne fermeture réduit les problèmes futurs.", 'V'),
    ('open', "Tu comptes la caisse et trouves un surplus de 10 $. Que fais-tu ?", "Vérifier les transactions et noter l'écart."),
    ('open', "Tu constates un manque de 5 $. Quelle est la première étape ?", "Recompter la caisse."),
    ('open', "Après recomptage, l'écart demeure. Que fais-tu ?", "Noter l'écart et suivre la procédure prévue."),
    ('open', "Pourquoi les remboursements doivent-ils être vérifiés ?", "Parce qu'ils affectent directement les résultats financiers."),
    ('open', "Pourquoi les certificats-cadeaux doivent-ils être comptabilisés ?", "Pour assurer l'exactitude des rapports."),
    ('mc', "Un remboursement non inscrit peut causer :", ["Une erreur comptable", "Un écart de caisse", "Un problème de suivi", "Toutes ces réponses"], 3, None),
    ('open', "Pourquoi faut-il être précis dans les calculs ?", "Pour éviter les erreurs financières."),
    ('open', "Quel est le risque d'un mauvais calcul ?", "Créer un écart inexpliqué."),
    ('mc', "Les rapports de fermeture servent à :", ["Documenter la journée", "Vérifier les ventes", "Expliquer les écarts", "Toutes ces réponses"], 3, None),
    ('mc', "Quelle qualité est essentielle en comptabilité ?", ["Rapidité", "Précision", "Créativité", "Improvisation"], 1, None),
    ('open', "Pourquoi faut-il nettoyer avant de partir ?", "Pour que le site soit prêt à accueillir les clients le lendemain."),
    ('mc', "Les toilettes doivent être :", ["Vérifiées", "Nettoyées au besoin", "Approvisionnées", "Toutes ces réponses"], 3, None),
    ('mc', "Une fermeture propre améliore :", ["L'expérience client", "Le travail des collègues", "L'image de l'entreprise", "Toutes ces réponses"], 3, None),
    ('open', "Les déchets doivent être :", "Ramassés avant le départ."),
    ('open', "Pourquoi faut-il vérifier les espaces clients ?", "Pour s'assurer qu'ils sont sécuritaires et propres."),
    ('open', "Tu es pressé de partir et il reste des calculs à faire. Que fais-tu ?", "Tu termines la procédure correctement avant de quitter."),
    ('open', "Tu remarques un remboursement qui n'apparaît pas dans les rapports. Que fais-tu ?", "Vérifier la transaction immédiatement."),
    ('open', "Tu trouves un écart de 20 $. Peux-tu simplement partir ?", "Non."),
    ('open', "Pourquoi ne peux-tu pas simplement partir avec un écart de 20 $ ?", "Parce que l'écart doit être vérifié et documenté."),
    ('open', "Tu réalises qu'une réservation de demain n'est pas bien classée. Que fais-tu ?", "Corriger la situation avant de quitter."),
    ('open', "Pourquoi la fermeture est-elle une responsabilité importante ?", "Parce qu'elle garantit l'exactitude des opérations financières."),
    ('open', "Quel est le lien entre une bonne fermeture et une bonne ouverture ?", "Une fermeture bien faite facilite le travail du lendemain."),
    ('mc', "Quelle erreur est la plus grave ?", ["Oublier une poubelle", "Oublier un appel", "Quitter avec une caisse incorrecte", "Oublier un stylo"], 2, None),
    ('open', "Quel est l'objectif principal de tous les contrôles de fermeture ?", "Assurer que la journée est correctement documentée et complétée."),
    ('mc', "Un employé qui maîtrise parfaitement la fermeture contribue à :", ["Réduire les erreurs", "Faciliter l'ouverture", "Protéger les finances de l'entreprise", "Toutes ces réponses"], 3, None),
]
MODULES.append(("Fermeture de la caisse", "Examen de certification — Niveau Employé. Comptage, écarts, rapports et nettoyage de fin de journée.", 18, 0.80, M9))

# ═══ MODULE 10 — COMPTABILITÉ AVANCÉE ET RAPPORTS APEX ═══
M10 = [
    ('mc', "Pourquoi les rapports Apex sont-ils importants ?", ["Pour décorer le bureau", "Pour suivre les opérations de la journée", "Pour les clients", "Pour les mécaniciens"], 1, None),
    ('mc', "Les rapports permettent de vérifier :", ["Les ventes", "Les remboursements", "Les écarts", "Toutes ces réponses"], 3, None),
    ('mc', "Chaque transaction doit être :", ["Enregistrée", "Mémorisée", "Devinée", "Ignorée"], 0, None),
    ('open', "Un rapport exact aide à :", "Assurer un suivi financier fiable."),
    ('mc', "Une erreur dans Apex peut entraîner :", ["Un écart financier", "Une mauvaise comptabilité", "Des vérifications supplémentaires", "Toutes ces réponses"], 3, None),
    ('open', "Pourquoi faut-il vérifier les rapports avant de fermer ?", "Pour détecter les erreurs pendant qu'elles sont encore faciles à corriger."),
    ('mc', "Les remboursements doivent apparaître :", ["Dans Apex", "Dans les registres", "Dans les rapports", "Toutes ces réponses"], 3, None),
    ('open', "Un rapport incomplet peut causer :", "Des problèmes administratifs et financiers."),
    ('mc', "Les certificats-cadeaux doivent être :", ["Comptabilisés", "Suivis", "Vérifiés", "Toutes ces réponses"], 3, None),
    ('mc', "Le rôle principal d'Apex est :", ["Suivre les opérations de l'entreprise", "Contrôler les karts", "Gérer les pneus", "Gérer la météo"], 0, None),
    vf("Chaque remboursement doit être documenté.", 'V'),
    vf("Une erreur de saisie peut modifier les résultats financiers.", 'V'),
    vf("Les certificats-cadeaux n'affectent jamais les rapports.", 'F'),
    vf("Les rapports servent à vérifier les ventes.", 'V'),
    vf("Les écarts doivent être expliqués.", 'V'),
    vf("Une transaction oubliée peut créer un problème comptable.", 'V'),
    vf("Le montant en caisse doit correspondre aux rapports.", 'V'),
    vf("Les erreurs sont plus faciles à corriger lorsqu'elles sont détectées rapidement.", 'V'),
    vf("Tous les employés doivent appliquer les mêmes procédures.", 'V'),
    vf("Une bonne comptabilité protège l'entreprise.", 'V'),
    ('open', "Les ventes Apex indiquent 1 250 $. La caisse contient 1 230 $. Quelle est la première étape ?", "Recompter et vérifier les transactions."),
    ('open', "Un remboursement de 25 $ apparaît sur le rapport. Aucun employé ne s'en souvient. Que fais-tu ?", "Vérifier la transaction dans Apex."),
    ('open', "Pourquoi faut-il conserver les justifications ?", "Pour pouvoir expliquer les écarts."),
    ('open', "Tu observes plusieurs remboursements dans la journée. Que dois-tu vérifier ?", "Que chacun est correctement documenté."),
    ('open', "Un certificat-cadeau est utilisé. Pourquoi est-ce important de le noter ?", "Parce qu'il affecte les résultats de la journée."),
    ('open', "Tu remarques qu'une transaction semble avoir été entrée deux fois. Que fais-tu ?", "Vérifier immédiatement avant la fermeture."),
    ('mc', "Quel est le danger d'une double saisie ?", ["Gonfler les ventes", "Créer un écart", "Fausser les rapports", "Toutes ces réponses"], 3, None),
    ('open', "Tu trouves un écart de 50 $. Quelle est ta priorité ?", "Trouver la cause avant de finaliser les rapports."),
    ('mc', "Une erreur financière non corrigée peut affecter :", ["Les résultats", "Les dépôts", "La comptabilité", "Toutes ces réponses"], 3, None),
    ('open', "Pourquoi faut-il travailler méthodiquement ?", "Pour réduire les erreurs."),
    ('open', "Ventes Apex : 1 000 $. Remboursements : 50 $. Quel est le montant net ?", "950 $."),
    ('open', "Ventes Apex : 800 $. Certificats-cadeaux utilisés : 100 $. Pourquoi faut-il les noter ?", "Pour comprendre l'origine des montants enregistrés."),
    ('mc', "La caisse contient 20 $ de moins que prévu. Quelle est la première hypothèse ?", ["Une erreur de comptage", "Une erreur de transaction", "Un remboursement mal inscrit", "Toutes ces réponses"], 3, None),
    ('open', "Pourquoi faut-il vérifier plusieurs fois les chiffres ?", "Pour détecter les erreurs avant qu'elles deviennent des problèmes."),
    ('open', "Quel est le principal objectif du rapprochement entre Apex et la caisse ?", "Vérifier que les montants concordent."),
    ('open', "Tu trouves un remboursement dans Apex mais aucun billet annoté. Quelle erreur a probablement été commise ?", "Documentation incomplète."),
    ('open', "Pourquoi est-ce problématique (un remboursement sans billet annoté) ?", "Parce qu'il manque une justification."),
    ('open', "Un collègue affirme avoir corrigé une erreur sans l'inscrire. Est-ce acceptable ?", "Non."),
    ('open', "Pourquoi toutes les corrections doivent-elles être documentées ?", "Pour assurer la traçabilité."),
    ('mc', "Quel est le plus grand risque d'une mauvaise comptabilité ?", ["Perte d'information", "Erreurs financières", "Difficultés de vérification", "Toutes ces réponses"], 3, None),
    ('open', "Pourquoi la comptabilité est-elle importante même pour un employé à la caisse ?", "Parce qu'il participe directement à l'exactitude financière."),
    ('mc', "Quelle qualité est la plus importante (en comptabilité) ?", ["Rapidité", "Rigueur", "Force physique", "Créativité"], 1, None),
    ('open', "Pourquoi faut-il toujours pouvoir expliquer un chiffre ?", "Parce que chaque montant doit être vérifiable."),
    ('mc', "Un bon employé de caisse est aussi :", ["Un gestionnaire de données", "Un contrôleur financier de première ligne", "Un représentant de l'entreprise", "Toutes ces réponses"], 3, None),
    ('open', "Pourquoi les procédures existent-elles ?", "Pour assurer des résultats uniformes et fiables."),
    ('mc', "Une erreur détectée immédiatement est :", ["Plus facile à corriger", "Plus difficile à corriger", "Sans importance", "Impossible à corriger"], 0, None),
    ('open', "Quelle est la conséquence d'une comptabilité précise ?", "Une meilleure gestion de l'entreprise."),
    ('open', "Quel est le lien entre les ventes et les rapports ?", "Les rapports doivent refléter exactement les ventes réalisées."),
    ('mc', "Quel est l'objectif ultime de toutes les vérifications ?", ["Trouver des coupables", "Assurer l'exactitude des opérations", "Travailler plus longtemps", "Produire plus de papier"], 1, None),
    ('mc', "Un employé qui maîtrise parfaitement Apex et la comptabilité contribue à :", ["Réduire les erreurs", "Protéger les revenus", "Faciliter les vérifications", "Toutes ces réponses"], 3, None),
]
MODULES.append(("Comptabilité avancée et rapports Apex", "Examen de certification — Niveau Employé Senior. Ventes, remboursements, certificats-cadeaux et rapprochement Apex.", 19, 0.85, M10))

# ═══ MODULE 11 — PROPRETÉ, ENTRETIEN ET IMAGE ═══
M11 = [
    ('mc', "Pourquoi la propreté est-elle importante ?", ["Pour impressionner les employés", "Pour offrir une bonne expérience client", "Pour vendre moins", "Pour fermer plus tôt"], 1, None),
    ('mc', "Les toilettes doivent être :", ["Vérifiées régulièrement", "Ignorées", "Nettoyées une fois par semaine", "Fermées"], 0, None),
    ('mc', "Un client remarque des déchets au sol. Cela influence :", ["L'image de l'entreprise", "La météo", "Les réservations", "Les karts"], 0, None),
    ('mc', "Les espaces clients doivent être :", ["Sécuritaires et propres", "Rapides", "Vides", "Décorés"], 0, None),
    ('mc', "Qui est responsable de la propreté ?", ["Le gérant seulement", "Les employés seulement", "Toute l'équipe", "Les clients"], 2, None),
    ('open', "Pourquoi faut-il ramasser les déchets rapidement ?", "Pour maintenir un environnement propre et professionnel."),
    ('mc', "Les tables doivent être :", ["Propres", "Collantes", "Encombrées", "Sales"], 0, None),
    ('mc', "Une zone mal entretenue peut créer :", ["Une mauvaise impression", "Une meilleure expérience", "Plus de ventes", "Rien"], 0, None),
    ('mc', "L'image de l'entreprise dépend :", ["Seulement des karts", "Seulement du prix", "De l'ensemble de l'expérience", "Seulement de la météo"], 2, None),
    ('open', "Un employé professionnel doit :", "Contribuer à garder les lieux propres."),
    vf("Les clients remarquent la propreté.", 'V'),
    vf("Les toilettes font partie de l'expérience client.", 'V'),
    vf("Le nettoyage est seulement une tâche de fermeture.", 'F'),
    vf("Une zone propre améliore l'image de l'entreprise.", 'V'),
    vf("Les déchets doivent être ramassés rapidement.", 'V'),
    vf("La propreté contribue à la sécurité.", 'V'),
    vf("Les employés doivent signaler les problèmes.", 'V'),
    vf("Un environnement propre inspire confiance.", 'V'),
    vf("Les inspections visuelles sont utiles.", 'V'),
    vf("La propreté n'influence pas les clients.", 'F'),
    ('open', "Tu vois du papier au sol près de la caisse. Que fais-tu ?", "Le ramasser immédiatement."),
    ('open', "Les toilettes manquent de papier. Que fais-tu ?", "Les réapprovisionner rapidement."),
    ('open', "Une table est sale après le départ d'un groupe. Que fais-tu ?", "La nettoyer avant l'arrivée d'autres clients."),
    ('open', "Pourquoi faut-il agir rapidement ?", "Pour maintenir les standards de qualité."),
    ('open', "Un client signale un problème de propreté. Que fais-tu ?", "Le remercier et corriger la situation."),
    ('open', "Tu remarques un danger potentiel au sol. Que fais-tu ?", "Le corriger ou le signaler immédiatement."),
    ('open', "Une poubelle déborde. Quelle est la priorité ?", "La vider rapidement."),
    ('open', "Pourquoi la propreté aide-t-elle le service à la clientèle ?", "Elle améliore l'expérience globale."),
    ('open', "Un employé ignore plusieurs tâches de nettoyage. Quel risque cela crée-t-il ?", "Une dégradation de l'image de l'entreprise."),
    ('open', "Quel est l'objectif principal de l'entretien quotidien ?", "Maintenir un environnement accueillant et sécuritaire."),
]
MODULES.append(("Propreté, entretien et image", "Examen de certification — Niveau Employé. Propreté, entretien quotidien et image de l'entreprise.", 20, 0.80, M11))

# ═══ MODULE 12 — FAQ ET QUESTIONS FRÉQUENTES ═══
M12 = [
    ('mc', "Un client demande : « Avez-vous besoin d'une réservation ? » Pour moins de 10 personnes :", ["Oui", "Non", "Seulement la fin de semaine", "Seulement les adultes"], 1, None),
    ('mc', "Les réservations sont généralement offertes pour :", ["2 personnes", "5 personnes", "10 personnes ou plus", "Tout le monde"], 2, None),
    ('mc', "Les prix sont généralement :", ["Par personne", "Par kart", "Par groupe", "Variables"], 1, None),
    ('mc', "Les taxes sont :", ["Incluses", "En supplément", "Facultatives", "Variables"], 1, None),
    ('mc', "Un client demande : « Est-ce que vous êtes ouverts quand il pleut ? » La réponse est :", ["Non", "Oui, généralement", "Jamais", "Seulement le matin"], 1, None),
    ('mc', "Un groupe veut réserver. Quelle information faut-il obtenir ?", ["Nombre de personnes", "Date", "Heure", "Toutes ces réponses"], 3, None),
    ('open', "Pourquoi faut-il vérifier les réservations déjà prévues ?", "Pour informer correctement les clients de l'achalandage."),
    ('mc', "Un client demande les prix. Quelle question poser en premier ?", ["Adulte ou famille ?", "Couleur préférée ?", "Ville d'origine ?", "Taille"], 0, None),
    ('mc', "Les appels manqués doivent être :", ["Ignorés", "Rappelés", "Supprimés", "Archivés"], 1, None),
    ('open', "Pourquoi rappeler un client ?", "Pour offrir un bon service."),
    vf("Les prix sont négociables.", 'F'),
    vf("Les réservations influencent les temps d'attente.", 'V'),
    vf("Les clients apprécient des informations précises.", 'V'),
    vf("Le téléphone est important.", 'V'),
    vf("Les taxes doivent être mentionnées.", 'V'),
    vf("Les réservations de groupe doivent être bien documentées.", 'V'),
    vf("La météo peut influencer les attentes.", 'V'),
    vf("Les appels vocaux doivent être vérifiés.", 'V'),
    vf("Le service commence souvent au téléphone.", 'V'),
    vf("Une mauvaise réponse peut créer de la frustration.", 'V'),
    ('open', "Un client demande : « Combien de temps vais-je attendre ? »", "Donner une estimation réaliste."),
    ('open', "Un client demande : « Puis-je réserver pour 4 personnes ? »", "Généralement non, premier arrivé premier servi."),
    ('open', "Un client demande : « Est-ce que les prix incluent les taxes ? »", "Non."),
    ('open', "Un client demande : « Puis-je obtenir un rabais ? »", "Les prix ne sont pas négociables."),
    ('open', "Un client demande : « Est-ce que vous êtes ouverts sous la pluie ? »", "Oui, généralement."),
    ('open', "Un client demande : « Est-ce que les prix sont par personne ? »", "Non, par kart."),
    ('open', "Un client demande : « Dois-je appeler avant de venir ? »", "Ce n'est pas obligatoire, mais il est possible de vérifier l'achalandage."),
    ('open', "Un client demande : « Est-ce qu'il y a beaucoup de monde aujourd'hui ? »", "Vérifier les réservations et donner une estimation honnête."),
    ('open', "Un client demande : « Puis-je obtenir un remboursement ? »", "Expliquer la politique applicable."),
    ('open', "Un client demande : « Pourquoi dois-je attendre ? »", "Expliquer l'achalandage et les réservations prévues."),
    ('mc', "Quelle est la qualité la plus importante lorsqu'on répond aux questions ?", ["La rapidité", "L'exactitude", "L'humour", "L'improvisation"], 1, None),
    ('open', "Pourquoi faut-il répondre de façon uniforme ?", "Pour que tous les clients reçoivent la même information."),
    ('open', "Quel est le principal objectif d'une FAQ maîtrisée ?", "Réduire les malentendus."),
    ('open', "Pourquoi un employé doit-il bien connaître les réponses ?", "Pour inspirer confiance aux clients."),
    ('mc', "Un employé qui maîtrise la FAQ contribue à :", ["Améliorer le service", "Réduire les plaintes", "Répondre rapidement", "Toutes ces réponses"], 3, None),
]
MODULES.append(("FAQ et questions fréquentes des clients", "Examen de certification — Niveau Employé. Réponses aux questions fréquentes des clients.", 21, 0.80, M12))


# ──────────────── Génération SQL ────────────────
def esc(s):
    return s.replace("'", "''")

def choices_for(q):
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
    return q[4] if q[0] == 'mc' else None

def module_sql(title, desc, sort_order, passing, questions):
    out = []
    out.append(f"DELETE FROM public.training_modules WHERE title = '{esc(title)}';")
    out.append("DO $$")
    out.append("DECLARE m_id uuid; c_id uuid; q_id uuid; qq uuid;")
    out.append("BEGIN")
    out.append(f"  INSERT INTO public.training_modules (title, description, content_type, category, sort_order, is_active) "
               f"VALUES ('{esc(title)}', '{esc(desc)}', 'text', '{esc(CATEGORY)}', {sort_order}, true) RETURNING id INTO m_id;")
    out.append(f"  INSERT INTO public.training_chapters (module_id, title, sort_order) "
               f"VALUES (m_id, '{esc(title)}', 0) RETURNING id INTO c_id;")
    out.append(f"  INSERT INTO public.quizzes (chapter_id, title, description, passing_score, is_active) "
               f"VALUES (c_id, 'Examen — {esc(title)}', '{esc(desc)}', {passing}, true) RETURNING id INTO q_id;")
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
    for i, (title, desc, sort_order, passing, questions) in enumerate(MODULES, start=7):
        path = rf"C:\Users\xavpo\OneDrive\Desktop\amigo-karting\scripts\_caisse_m{i}.sql"
        with open(path, "w", encoding="utf-8") as f:
            f.write(module_sql(title, desc, sort_order, passing, questions))

    total_q = sum(len(m[4]) for m in MODULES)
    print(f"Modules: {len(MODULES)}  Questions: {total_q}")
    for i, m in enumerate(MODULES, start=7):
        print(f"  - M{i} {m[0]}: {len(m[4])} questions (passage {int(m[3]*100)}%)")
