<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success.svg" alt="Status">
  <img src="https://img.shields.io/badge/Environment-100%25_Offline-blue.svg" alt="100% Offline">
  <img src="https://img.shields.io/badge/Tech-Vanilla_JS-yellow.svg" alt="Vanilla JS">
  <br>
  <h1>🌐 AckBoard</h1>
  <p><b>Advanced Nmap Topology Visualizer & Attack Surface Dashboard</b></p>
  <p><i>Développé par un étudiant en cybersécurité / Developed by a cybersecurity student</i></p>
</div>

---

<p align="center">
  <a href="#-version-française">🇫🇷 Version Française</a> • <a href="#-english-version">🇬🇧 English Version</a>
</p>

---

# 🇫🇷 Version Française

## 📖 Présentation
**AckBoard** est un outil de visualisation réseau ultra-rapide, 100% côté client et sans serveur, conçu par un étudiant en cybersécurité pour les ingénieurs réseau, les pentesters et les administrateurs système. 

Il prend en charge les résultats de scans **Nmap** (fichiers `.txt` ou `.xml`) et les transforme instantanément en topologies réseau interactives, dynamiques et lisibles, sans **jamais** envoyer vos données d'infrastructure sensibles sur internet.

Tout s'exécute de manière sécurisée et locale directement dans votre navigateur.

## ✨ Fonctionnalités Clés

- 🔒 **100% Hors-Ligne & Côté Client** : Aucun backend, pas de Node.js, aucune requête API. Vos données de scan ne quittent jamais votre machine. Double-cliquez simplement sur `index.html`.
- 🕸️ **Topologie Interactive** : Un graphe réseau basé sur la physique, interactif et fluide, généré via `vis-network`. Plusieurs dispositions sont supportées (Organique, Arbres Hiérarchiques, Éclaté).
- 🎨 **Auto-Classification Intelligente** : Les machines reçoivent dynamiquement des icônes SVG en fonction de leurs ports ouverts (ex: Serveurs Web, Bases de données, Serveurs de fichiers Windows, Linux).
- 🔍 **Filtres de Surface d'Attaque** : Isolez instantanément les cibles de forte valeur grâce aux "Filtres Rapides" (Serveurs Web, Accès Distants comme SSH/RDP, Bases de données).
- 📊 **Tableau de Bord Complet** : Naviguez facilement entre la vue Topologie, un Tableau détaillé des Hôtes, et un résumé global des Services & Ports.
- 📸 **Générateur de Rapport** : Exportez votre graphe actuel en PNG haute qualité (avec un encart de résumé généré automatiquement), prêt à être intégré dans vos rapports de pentest.

## 🚀 Démarrage Rapide

AckBoard ne nécessite **aucune installation** ni compilation.

1. **Clonez ou téléchargez** ce dépôt.
2. Ouvrez le dossier et double-cliquez sur `index.html` pour l'ouvrir dans votre navigateur.
3. **Glissez-déposez** le résultat de votre scan Nmap (`.txt` ou `.xml`) dans la zone prévue à cet effet.
4. Explorez votre réseau !

*Un fichier `mock_scan.txt` d'exemple est fourni pour vous permettre de tester l'interface immédiatement.*

## 🛠️ Stack Technique

AckBoard a été développé avec une approche strictement "Vanilla" (sans frameworks lourds) pour garantir une portabilité maximale et aucune charge de configuration.
- **Logique Frontend** : Vanilla JavaScript (ES6+), DOMParser, API HTML5 FileReader
- **Stylisation** : Tailwind CSS (via CDN) pour une esthétique moderne "Dark NOC"
- **Moteur Graphique** : Vis-Network
- **Icônes** : Lucide Icons & SVGs personnalisés

---

# 🇬🇧 English Version

## 📖 Overview
**AckBoard** is a lightning-fast, 100% client-side, zero-server network visualization tool crafted by a cybersecurity student for Network Engineers, Pentesters, and System Administrators. 

It takes standard **Nmap scan outputs** (`.txt` or `.xml`) and instantly transforms them into interactive, dynamic, and highly readable network topologies—without ever sending your sensitive infrastructure data over the network. 

Everything runs securely within your browser using modern Web APIs.

## ✨ Key Features

- 🔒 **100% Offline & Client-Side**: No backend, no Node.js, no API calls. Your scan data never leaves your machine. Just double-click `index.html`.
- 🕸️ **Interactive Topology**: A physics-based, interactive network graph powered by `vis-network`. Supports multiple layouts (Organic, Hierarchical Trees, Repulsion).
- 🎨 **Smart Auto-Classification**: Devices are automatically assigned dynamic SVG icons based on their open ports (e.g., Web Servers, Databases, Windows File Shares, Linux Boxes).
- 🔍 **Attack Surface Filters**: Instantly isolate high-value targets with one-click "Quick Filters" to highlight Web Servers, Remote Access services (SSH/RDP), or Databases.
- 📊 **Comprehensive Dashboard**: Switch seamlessly between the Topology View, a detailed Hosts Table, and a globally aggregated Services & Ports summary.
- 📸 **Report Integration**: Export your current network graph as a high-quality, professional PNG (with an auto-generated scan summary overlay), ready to be embedded into your pentest or audit reports.

## 🚀 Quick Start

AckBoard requires **zero installation** or compilation.

1. **Clone or download** this repository.
2. Open the folder and double-click on `index.html` to open it in your favorite modern browser.
3. **Drag and drop** your Nmap scan result (`.txt` standard output or `.xml`) into the dropzone.
4. Explore your network!

*A sample `mock_scan.txt` is provided in the repository to let you test the interface immediately.*

## 🛠️ Tech Stack

AckBoard was built with a strict "Vanilla-first" philosophy to ensure maximum portability and zero setup overhead.

- **Frontend Logic**: Vanilla JavaScript (ES6+), DOMParser, HTML5 FileReader API
- **Styling**: Tailwind CSS (via CDN) for a sleek, modern "Dark NOC" aesthetic
- **Graph Engine**: Vis-Network
- **Icons**: Lucide Icons & Custom inline SVGs

## 📝 License
This project is licensed under the MIT License. Feel free to use, modify, and distribute as you see fit.

---
*Crafted with precision for cybersecurity professionals.*
