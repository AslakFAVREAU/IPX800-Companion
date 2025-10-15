# Guide pour créer une release GitHub

Ce guide explique comment créer une release GitHub avec le fichier .tgz pour permettre les mises à jour automatiques dans Companion.

## Prérequis

1. **Créer un token GitHub** :
   - Allez sur https://github.com/settings/tokens
   - Cliquez sur "Generate new token" > "Generate new token (classic)"
   - Donnez un nom au token (ex: "Companion Release")
   - Cochez les permissions: **repo** (Full control of private repositories)
   - Cliquez sur "Generate token" et **copiez le token**

2. **Définir le token en variable d'environnement** :
   ```powershell
   $env:GITHUB_TOKEN="votre_token_ici"
   ```

## Étapes pour créer une release

### 1. Mettre à jour la version

Éditez `companion/manifest.json` et changez le numéro de version :
```json
{
  "version": "1.0.2",
  ...
}
```

### 2. Créer le package .tgz

```powershell
node create-companion-package.js
```

Cela créera le fichier `companion-module-ipx800-X.X.X.tgz`

### 3. Créer la release sur GitHub

```powershell
node create-github-release.js
```

Le script va :
- Créer automatiquement le tag git correspondant à la version
- Créer la release sur GitHub
- Uploader le fichier .tgz en tant qu'asset
- Générer les notes de version

### 4. Vérifier la release

Allez sur https://github.com/AslakFAVREAU/IPX800-Companion/releases pour vérifier que :
- La release est créée
- Le fichier .tgz est attaché
- Les notes de version sont correctes

## Workflow complet (toutes les étapes)

```powershell
# 1. Définir le token GitHub (à faire une seule fois par session)
$env:GITHUB_TOKEN="votre_token_ici"

# 2. Mettre à jour la version dans companion/manifest.json
# (éditez le fichier manuellement)

# 3. Créer le package
node create-companion-package.js

# 4. Créer la release GitHub
node create-github-release.js

# 5. Commit et push les changements
git add .
git commit -m "Release vX.X.X"
git push
```

## Mises à jour automatiques dans Companion

Une fois la release créée sur GitHub :
1. Les utilisateurs de Companion pourront voir qu'une mise à jour est disponible
2. Ils pourront cliquer sur "Update" pour télécharger automatiquement la nouvelle version
3. Le module sera mis à jour sans avoir à importer manuellement le fichier .tgz

## Dépannage

### Erreur "GITHUB_TOKEN non défini"
- Vérifiez que vous avez défini la variable d'environnement : `$env:GITHUB_TOKEN="votre_token"`
- Le token doit avoir les permissions "repo"

### Erreur "Le fichier .tgz n'existe pas"
- Exécutez d'abord `node create-companion-package.js`

### Erreur HTTP 422 "Validation Failed"
- Le tag existe déjà sur GitHub
- Supprimez le tag : `git tag -d vX.X.X; git push origin :refs/tags/vX.X.X`
- Relancez le script

### Erreur HTTP 401 "Bad credentials"
- Votre token GitHub est invalide ou expiré
- Créez un nouveau token sur https://github.com/settings/tokens
