# Companion Module – IPX800 V5

Ce module Companion permet de **piloter les relais** d’un automate **GCE IPX800 V5** via son API HTTP.

---

## 🔧 Configuration requise

Avant toute utilisation, configurez le module dans Companion :

- **Adresse IP** : IP locale de votre IPX800 (ex: `10.10.40.10`)
- **Clé API** : votre clé API (`ApiKey`) définie dans l’interface web IPX

---

## ⚙️ Actions disponibles

### 1. Définir état IO (ON / OFF)
- Permet de fermer ou ouvrir un relais (`on: true/false`)
- Options :
  - ID du relais (ex: `65536`)
  - État souhaité : `FERMÉ (ON)` ou `OUVERT (OFF)`

### 2. Lire état IO
- Interroge le relais et affiche l’état dans les logs
- Met à jour automatiquement le feedback et variable associée

---

## 🎨 Feedback visuel

Le module propose un **feedback de couleur** :

- Rouge si l’état **ne correspond pas**
- Vert (ou couleur définie) si l’état **correspond à la valeur attendue**

Utilisez-le pour refléter l’état réel d’un relais sur un bouton Companion.

---

## 💡 Astuce variable

Vous pouvez créer une **variable dynamique** pour l’état :

```
$(ipx800v5:io_65536)
```

Elle contiendra `ON` ou `OFF` après exécution de l’action **"Lire état IO"**.

---

## 🛠 Exemples d'ID IO

- 65536 → Relais 1
- 65537 → Relais 2
- etc...

Consultez la documentation GCE pour la correspondance complète.

---

## 📬 Support

- Module développé par **Aslak Favreau**
- Contact : `aslak@evenement-soe.com`
