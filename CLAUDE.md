@AGENTS.md

## Règles de collaboration

- Ne jamais faire de `git push` sans accord explicite de l'utilisateur.
- **NE JAMAIS demander à l'utilisateur de lancer `npm run dev`** — Turbopack fait planter le Mac (trackpad inclus, arrêt sauvage). La commande correcte est `npm run dev -- --webpack`, et c'est à l'utilisateur de la lancer lui-même quand il le souhaite. Ne pas la suggérer, ne pas la rappeler.
- **Toujours préciser le `cd` avant chaque commande suggérée** — ex : `cd ~/Desktop/CLAUDE-AI/fra && npm run build`. Ne jamais donner une commande sans indiquer le répertoire dans lequel l'exécuter.
