# Règles Spécifiques au Projet AdduGo

## Automatisation des Astuces Pro
Chaque fois que tu donnes une "astuce", un "conseil de pro", ou une explication technique importante à l'utilisateur concernant le développement web, tu DOIS obligatoirement ajouter cette astuce dans le fichier `Astuces_Pro/Astuces_Pro.md` en utilisant l'outil d'édition de fichier, de manière autonome. Ce document doit devenir une véritable bible d'apprentissage pour l'utilisateur.

## Formatage Inflexible des Prix (Anti-Retour à la Ligne)
CRITIQUE : Il est formellement interdit de générer ou modifier du code affichant un prix sans le lier à sa devise (GNF) par un espace insécable.
- En JavaScript : Toujours utiliser `\u00A0` (ex: `prix + '\u00A0GNF'`).
- En HTML/Template strings : Toujours utiliser `&nbsp;` (ex: `${prix}&nbsp;GNF`).
Cela garantit que le montant et la devise s'affichent toujours sur la même ligne. Aucune régression ne sera tolérée sur ce point.
