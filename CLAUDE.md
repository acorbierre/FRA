@AGENTS.md

## Règles de collaboration

- Ne jamais faire de `git push` sans accord explicite de l'utilisateur.
- **NE JAMAIS demander à l'utilisateur de lancer `npm run dev`** — Turbopack fait planter le Mac (trackpad inclus, arrêt sauvage). La commande correcte est `npm run dev -- --webpack`, et c'est à l'utilisateur de la lancer lui-même quand il le souhaite. Ne pas la suggérer, ne pas la rappeler.
- **Toujours préciser le `cd` avant chaque commande suggérée** — ex : `cd ~/Desktop/CLAUDE-AI/fra && npm run build`. Ne jamais donner une commande sans indiquer le répertoire dans lequel l'exécuter.
- **Ne jamais suggérer `npm audit fix`** — casse les dépendances (Clerk, Next.js) et force une réinstallation complète qui prend 30-60 min. Les vulnérabilités npm signalées sont quasi toujours des faux positifs sur des dépendances internes (Next.js/postcss, etc.) et ne justifient pas ce risque.
- **Ne jamais suggérer `rm -rf node_modules` ni réinstallation complète** sans prévenir explicitement que ça peut bloquer 30-60 min selon la connexion. Si c'est vraiment nécessaire, proposer d'abord `npm install --prefer-offline` ou une réinstallation ciblée du seul package cassé.
