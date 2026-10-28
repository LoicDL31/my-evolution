# My Evolution — guide

## Contenu
index.html, style.css, app.js (l'appli) · manifest.webmanifest + sw.js + icon-192/512.png (installation et hors ligne) · programme-exemple.json (programme complet valide) · test.js (tests de la logique, facultatif).

## 1. Mettre l'appli en ligne (obligatoire pour l'installer)
Une PWA ne s'installe et ne fonctionne hors ligne que depuis une adresse https. Ouvrir index.html depuis les fichiers du téléphone ne suffit pas.
**Option simple : GitHub Pages (gratuit)**
1. Sur github.com, crée un dépôt public « my-evolution ».
2. « Add file » > « Upload files » : dépose le CONTENU du dossier (pas le .zip), puis « Commit ».
3. « Settings » > « Pages » > Branch : main, dossier /(root) > Save.
4. Après 1 à 2 minutes, ton adresse est https://TON-PSEUDO.github.io/my-evolution/
**Alternative : Netlify Drop** (app.netlify.com/drop) : glisse le dossier décompressé, tu obtiens une adresse https.
Les adresses sont publiques mais tes données restent dans ton téléphone, jamais sur le serveur.

## 2. Installer sur Android
1. Ouvre l'adresse dans Chrome.
2. Menu ⋮ > « Installer l'application » (ou « Ajouter à l'écran d'accueil »).
3. Ouvre une fois l'appli avec du réseau, puis tu peux l'utiliser hors ligne.

## 3. Sauvegarde et restauration
Paramètres (⚙) > « Exporter toutes les données » : un fichier JSON est téléchargé. Envoie-le sur ton Drive ou par e-mail chaque semaine.
Restaurer : Paramètres > « Restaurer une sauvegarde » et choisis le fichier.
Les données sont dans le navigateur de CE téléphone : elles ne se synchronisent pas, et elles sont perdues si tu changes de téléphone, désinstalles l'appli ou effaces les données de Chrome. Le stockage protégé n'est pas garanti : seule la sauvegarde fait foi.

## 4. Format JSON du programme
```json
{ "version": 1,
  "seances": [
    { "jour": "lundi",                      // OBLIGATOIRE : lundi…dimanche, OU "date": "2026-11-02"
      "nom": "Haut du corps A",              // OBLIGATOIRE
      "muscles": ["pectoraux", "triceps"],   // facultatif (liste)
      "exercices": [                         // OBLIGATOIRE, liste non vide
        { "nom": "Pompes",                   // OBLIGATOIRE
          "series": 3,                       // facultatif, entier > 0
          "reps": "8-15",                    // facultatif, texte
          "repos": "60-90 s",                // facultatif, texte
          "consignes": "Corps gainé.",       // facultatif, texte
          "variantes": ["Pompes sur les genoux"] } ] } ] }
```
(Les commentaires // ne sont pas autorisés dans un vrai fichier JSON.) Un exemple complet : programme-exemple.json.
**Importer** : Paramètres > Programme hebdomadaire > choisis « Remplacer » ou « Fusionner » > sélectionne le fichier. Le fichier est vérifié ; en cas d'erreur, la liste s'affiche et rien n'est modifié. Confirmation demandée avant application.
**Fusionner** : une séance de même jour (ou date) et de même nom est remplacée, les autres sont ajoutées.
**Exporter** : bouton « Exporter le programme ». L'historique des séances n'est jamais supprimé.

## 5. Tests à faire sur ton téléphone
1. Coche un objectif plusieurs fois : états Terminé, Non applicable, À faire. Les pourcentages se mettent à jour.
2. Ferme complètement l'appli et rouvre-la : les coches sont conservées.
3. Passe en mode avion : l'appli s'ouvre toujours.
4. Onglet Sport : note une charge, appuie sur « Partielle », vérifie l'historique.
5. Exporte le programme, modifie un nom dans le fichier, réimporte en « Fusionner ».
6. Importe un fichier cassé : un message d'erreur doit apparaître sans rien changer.
7. Exporte les données, puis restaure-les.
8. Mettre à jour l'appli après modification des fichiers : change V dans sw.js (ex. my-evolution-v2).
