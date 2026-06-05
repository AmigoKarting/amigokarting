# -*- coding: utf-8 -*-
"""Met le contenu de lecture (manuels de formation) dans le champ
training_chapters.content des 3 premiers modules de la catégorie Caisse.
Génère du SQL avec dollar-quoting (pas d'échappement d'apostrophes)."""

DATA = [
("Les réservations", """LES RÉSERVATIONS — Manuel de formation Amigo Karting

INTRODUCTION
Les réservations sont l'une des tâches les plus importantes à la caisse. Une réservation mal prise peut entraîner des erreurs d'horaire, des conflits avec les clients, des retards et une mauvaise expérience.

L'objectif de ce module est d'apprendre à :
• Répondre correctement aux demandes de réservation
• Déterminer si une réservation est nécessaire
• Recueillir toutes les informations importantes
• Expliquer les politiques aux clients
• Éviter les erreurs fréquentes

OBJECTIFS D'APPRENTISSAGE
À la fin de ce module, l'employé sera capable de :
✅ Expliquer la politique de réservation
✅ Déterminer quand une réservation est nécessaire
✅ Recueillir les bonnes informations
✅ Utiliser un ton professionnel
✅ Gérer les questions fréquentes
✅ Réduire les risques d'erreurs

1. COMPRENDRE LES RÉSERVATIONS
Tous les clients n'ont pas besoin d'une réservation. L'une des premières choses à déterminer est : combien de personnes participent ? C'est la question la plus importante.
Exemple : « Bonjour, combien de personnes serez-vous ? »
Cette information permet immédiatement de savoir quelle procédure appliquer.

2. GROUPES ET RÉSERVATIONS
Les groupes importants nécessitent généralement une réservation. Les réservations permettent :
• De prévoir l'espace nécessaire
• D'organiser l'horaire
• De réduire les attentes
• D'assurer une meilleure expérience
Plus un groupe est gros, plus la réservation devient importante.

3. INFORMATIONS OBLIGATOIRES
Lorsqu'une réservation doit être prise, toujours obtenir :
• Nom du responsable — « À quel nom dois-je mettre la réservation ? »
• Numéro de téléphone — « Quel est le meilleur numéro pour vous joindre ? »
• Date — « Quelle journée souhaitez-vous réserver ? »
• Heure — « À quelle heure aimeriez-vous venir ? »
• Nombre de participants — « Combien de personnes seront présentes ? »

4. POURQUOI CES INFORMATIONS SONT IMPORTANTES
• Nom : permet d'identifier le groupe.
• Téléphone : permet de rappeler le client.
• Date : permet de planifier l'horaire.
• Heure : permet d'éviter les conflits.
• Nombre de personnes : permet d'évaluer l'achalandage.

5. VÉRIFICATION AVANT DE CONFIRMER
Avant de terminer l'appel, toujours vérifier les informations.
Exemple : « Je vais simplement vérifier avec vous. Réservation pour le 15 juillet à 14 h. Groupe de 12 personnes. Téléphone : 819-555-1234. »
Cette étape réduit énormément les erreurs.

6. COMMUNICATION PROFESSIONNELLE
Lors d'une réservation, toujours être poli, calme, clair et professionnel — même lorsqu'il y a beaucoup d'appels.
Exemple de bon échange :
— Client : Bonjour, je voudrais réserver.
— Employé : Certainement. Pour combien de personnes ?
— Client : 15.
— Employé : Parfait. Pour quelle date ?
— Client : Samedi prochain.
— Employé : À quelle heure souhaitez-vous venir ?
Simple. Professionnel. Efficace.

7. ERREURS FRÉQUENTES
• Erreur #1 : Ne pas demander le nombre de personnes. → Impossible d'appliquer la bonne procédure.
• Erreur #2 : Oublier le numéro de téléphone. → Impossible de joindre le client.
• Erreur #3 : Confondre l'heure. → Client insatisfait.
• Erreur #4 : Ne pas relire les informations. → Erreurs évitables.

8. GESTION DES QUESTIONS FRÉQUENTES
• « Dois-je réserver ? » → Vérifier la taille du groupe et appliquer la politique.
• « Est-ce qu'il y aura beaucoup de monde ? » → Consulter les réservations prévues.
• « Puis-je modifier ma réservation ? » → Vérifier les disponibilités avant de confirmer.
• « Puis-je annuler ? » → Appliquer la politique en vigueur.

9. SERVICE À LA CLIENTÈLE
Une réservation est souvent le premier contact du client avec Amigo Karting. Le client doit sentir que :
• Il est bien accueilli
• Son groupe est pris en charge
• Les informations sont fiables
• L'entreprise est organisée
Une bonne réservation crée déjà une bonne expérience.

MISE EN SITUATION #1
Un client appelle. Il veut réserver pour 14 personnes samedi à 15 h. Que dois-tu obtenir ?
✅ Nom · Téléphone · Date · Heure · Nombre de participants

MISE EN SITUATION #2
Un client téléphone. Il dit : « Je pense qu'on sera entre 10 et 20 personnes. » Que fais-tu ?
✅ Demander une estimation la plus précise possible.

MISE EN SITUATION #3
Le client semble pressé. Dois-tu sauter certaines questions ?
❌ Non. Toutes les informations importantes doivent être obtenues.

LES 10 RÈGLES D'OR DES RÉSERVATIONS
1. Toujours demander le nombre de personnes.
2. Noter les informations immédiatement.
3. Vérifier le nom.
4. Vérifier le numéro de téléphone.
5. Vérifier la date.
6. Vérifier l'heure.
7. Relire les informations.
8. Être professionnel.
9. Éviter les suppositions.
10. Confirmer clairement la réservation.

RÉSUMÉ DU MODULE
Une bonne réservation repose sur : les bonnes questions, les bonnes informations, une communication claire, une vérification complète et un service professionnel.
La qualité d'une journée chez Amigo Karting commence souvent par la qualité de la réservation."""),

("Service à la clientèle et clients difficiles", """SERVICE À LA CLIENTÈLE ET ACCUEIL DES CLIENTS — Manuel de formation Amigo Karting

INTRODUCTION
Le service à la clientèle est la responsabilité la plus importante d'un employé à la caisse. Un client peut oublier combien de temps il a attendu. Il peut oublier le prix qu'il a payé. Mais il se souviendra presque toujours de la façon dont il a été traité. Chaque interaction influence directement l'image d'Amigo Karting.

OBJECTIFS D'APPRENTISSAGE
À la fin de ce module, l'employé sera capable de :
✅ Accueillir un client professionnellement
✅ Répondre aux questions avec assurance
✅ Gérer les situations difficiles
✅ Maintenir une attitude positive
✅ Représenter l'entreprise de façon professionnelle

1. L'ACCUEIL DU CLIENT
Le premier contact est extrêmement important. Lorsqu'un client arrive : sourire, établir un contact visuel, saluer immédiatement.
Exemple : « Bonjour ! Bienvenue chez Amigo Karting. »
Même si vous êtes occupé : « Bonjour ! Je serai avec vous dans quelques instants. »
Le client doit savoir qu'il a été remarqué.

2. LE PROFESSIONNALISME
Un employé représente l'entreprise.
Toujours : être poli, être respectueux, être patient, utiliser un langage approprié.
Éviter : les jurons, le sarcasme, les disputes, les commentaires négatifs.

3. ÉCOUTER AVANT DE RÉPONDRE
Une erreur fréquente est de répondre avant de comprendre. Toujours : 1. Écouter, 2. Comprendre, 3. Répondre.
Exemple :
— Client : Pourquoi j'attends aussi longtemps ?
— Ne pas répondre : « Parce qu'il y a du monde. »
— Mieux : « Je comprends votre frustration. Je vais vous expliquer la situation. »

4. RÉPONDRE CLAIREMENT
Les clients veulent des réponses simples.
Éviter : ❌ les réponses vagues, ❌ les suppositions, ❌ les informations incomplètes.
Privilégier : ✅ les réponses précises, ✅ les informations vérifiées.

5. GÉRER UN CLIENT FRUSTRÉ
Un client frustré n'est pas nécessairement un client difficile. Souvent, il est déçu, il est pressé ou il ne comprend pas la situation. Votre rôle : rester calme.

RÈGLE IMPORTANTE
Ne jamais hausser le ton, même si le client est irrité. L'employé doit rester professionnel en tout temps.

6. TECHNIQUE DE DÉSESCALADE
Étape 1 : Laisser parler le client.
Étape 2 : Écouter.
Étape 3 : Reconnaître son inquiétude.
Étape 4 : Expliquer la situation.
Étape 5 : Proposer une solution lorsque possible.
Exemple :
— Client : C'est ridicule votre attente !
— Employé : Je comprends que l'attente soit frustrante. Nous avons beaucoup d'achalandage aujourd'hui. Je peux vous donner une estimation réaliste du délai.

7. LES QUESTIONS FRÉQUENTES
Vous devez connaître : les prix, les réservations, les temps d'attente, les remboursements, les promotions, les conditions météo. Un employé bien informé inspire confiance.

8. LES ERREURS À ÉVITER
• Erreur #1 : Couper la parole.
• Erreur #2 : Argumenter avec le client.
• Erreur #3 : Donner une réponse sans être certain.
• Erreur #4 : Blâmer un collègue.
• Erreur #5 : Ignorer un client.

9. LES SITUATIONS DIFFICILES
Parfois un client sera fâché, impatient ou impoli. Votre comportement doit rester le même : calme, respectueux, professionnel.

MISE EN SITUATION #1
Un client arrive. Tu es occupé au téléphone. Que fais-tu ?
✅ Le saluer immédiatement.

MISE EN SITUATION #2
Un client est frustré du délai. Que fais-tu ?
✅ Expliquer calmement la situation.

MISE EN SITUATION #3
Tu ne connais pas une réponse. Que fais-tu ?
✅ Vérifier l'information avant de répondre.

LES 10 RÈGLES D'OR DU SERVICE À LA CLIENTÈLE
1. Saluer immédiatement.
2. Écouter avant de répondre.
3. Rester poli.
4. Garder son calme.
5. Être professionnel.
6. Donner des réponses précises.
7. Respecter chaque client.
8. Ne jamais argumenter.
9. Chercher des solutions.
10. Représenter Amigo Karting positivement.

RÉSUMÉ
Un excellent service à la clientèle repose sur : l'écoute, le respect, le professionnalisme, la patience et une bonne communication."""),

("Temps d'attente et achalandage", """TEMPS D'ATTENTE ET GESTION DE L'ACHALANDAGE — Manuel de formation Amigo Karting

INTRODUCTION
La gestion des temps d'attente est l'une des principales causes de satisfaction ou d'insatisfaction chez les clients. Un client accepte généralement d'attendre lorsqu'il comprend pourquoi. Un client devient frustré lorsqu'il ne sait pas ce qui se passe. Votre rôle est de gérer les attentes.

OBJECTIFS D'APPRENTISSAGE
À la fin de ce module, l'employé sera capable de :
✅ Estimer les délais
✅ Communiquer clairement les attentes
✅ Réduire les plaintes
✅ Gérer l'achalandage
✅ Maintenir une expérience positive

1. COMPRENDRE L'ACHALANDAGE
L'achalandage varie constamment. Facteurs : météo, fin de semaine, vacances, réservations, événements spéciaux. Chaque journée est différente.

2. POURQUOI LES CLIENTS DÉTESTENT ATTENDRE
Les clients n'aiment pas :
❌ Attendre sans information
❌ Attendre plus longtemps que prévu
❌ Recevoir de fausses estimations

3. L'IMPORTANCE DES ESTIMATIONS RÉALISTES
Ne jamais promettre un délai irréaliste.
Mauvais exemple : « Vous passerez dans 10 minutes. » alors que l'attente est de 45 minutes.
Bon exemple : « L'attente actuelle est d'environ 45 à 60 minutes. » Le client peut prendre une décision éclairée.

4. TOUJOURS ÊTRE HONNÊTE
Une attente honnête est préférable à une promesse impossible. Les clients apprécient la transparence.

5. VÉRIFIER LES RÉSERVATIONS
Avant d'annoncer une attente, toujours consulter : les groupes attendus, les réservations, les événements. Cela améliore la précision.

6. COMMUNICATION PROACTIVE
Si les délais augmentent, informer les clients. Ne pas attendre qu'ils demandent.
Exemple : « L'attente est actuellement d'environ une heure. »

7. GÉRER LES PLAINTES LIÉES À L'ATTENTE
Écouter. Comprendre. Expliquer. Informer. Ne jamais se mettre sur la défensive.
Exemple :
— Client : Pourquoi ça prend autant de temps ?
— Employé : Nous avons plusieurs groupes actuellement sur place. L'attente estimée est d'environ 50 minutes.

8. LES ERREURS FRÉQUENTES
• Erreur #1 : Sous-estimer l'attente.
• Erreur #2 : Donner des chiffres au hasard.
• Erreur #3 : Oublier les réservations.
• Erreur #4 : Promettre un accès immédiat.
• Erreur #5 : Éviter la conversation.

9. LES PÉRIODES OCCUPÉES
Durant les journées très occupées : rester calme, informer fréquemment, garder une attitude positive, répondre aux questions. Les clients tolèrent mieux l'attente lorsqu'ils se sentent informés.

MISE EN SITUATION #1
Un client demande : « Combien de temps vais-je attendre ? » Que fais-tu ?
✅ Vérifier la situation actuelle avant de répondre.

MISE EN SITUATION #2
L'attente augmente soudainement. Que fais-tu ?
✅ Informer les nouveaux clients.

MISE EN SITUATION #3
Un client est frustré. Que fais-tu ?
✅ Expliquer calmement la raison du délai.

LES 10 RÈGLES D'OR DE LA GESTION DES ATTENTES
1. Vérifier avant d'annoncer un délai.
2. Être honnête.
3. Être réaliste.
4. Informer les clients.
5. Consulter les réservations.
6. Éviter les promesses impossibles.
7. Écouter les préoccupations.
8. Garder son calme.
9. Rester professionnel.
10. Communiquer clairement.

RÉSUMÉ
Une bonne gestion des temps d'attente repose sur : des estimations réalistes, une communication claire, une attitude professionnelle, une bonne connaissance de l'achalandage et l'honnêteté envers les clients."""),
]

if __name__ == "__main__":
    out = []
    for title, content in DATA:
        out.append(
            "UPDATE public.training_chapters SET content = $ct$\n"
            + content.strip()
            + "\n$ct$ WHERE module_id IN (SELECT id FROM public.training_modules "
            + "WHERE title = $tt$" + title + "$tt$ AND content_type = 'text');"
        )
    sql = "\n\n".join(out)
    with open(r"C:\Users\xavpo\OneDrive\Desktop\amigo-karting\scripts\_form_caisse.sql", "w", encoding="utf-8") as f:
        f.write(sql)
    print("Modules:", len(DATA), "| SQL bytes:", len(sql))
