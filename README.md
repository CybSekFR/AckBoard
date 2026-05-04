<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success.svg" alt="Status">
  <img src="https://img.shields.io/badge/Environment-100%25_Offline-blue.svg" alt="100% Offline">
  <img src="https://img.shields.io/badge/Tech-Vanilla_JS-yellow.svg" alt="Vanilla JS">
  <br>
  <h1>🌐 AckBoard</h1>
  <p><b>Advanced Nmap Topology Visualizer & Attack Surface Dashboard</b></p>
  <p><i>Développé par un étudiant en cybersécurité / Developed by a cybersecurity student</i></p>
  <br>
  <a href="https://votre-pseudo.github.io/AckBoard" target="_blank">
    <strong>🚀 Tester l'application (Live Demo) / Try the Live Demo 🚀</strong>
  </a>
  <br><br>
  <!-- Main Hero Image Placeholder -->
  <img src="assets/main_preview.png" alt="AckBoard Interface Preview" width="850" style="border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
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

## 📸 Aperçu de l'Interface

<div align="center">
  <!-- Screenshots Placeholders -->
  <img src="assets/topology_filters.png" alt="Filtres de Surface d'Attaque" width="48%">
  <img src="assets/services_dashboard.png" alt="Tableau de Bord des Services" width="48%">
</div>

## ✨ Fonctionnalités Clés

- 🔒 **100% Hors-Ligne & Côté Client** : Aucun backend, pas de Node.js, aucune requête API. Vos données de scan ne quittent jamais votre navigateur.
- 🕸️ **Topologie Interactive** : Un graphe réseau dynamique généré via `vis-network`. Plusieurs dispositions sont supportées (Organique, Arbres, Éclaté).
- 🎨 **Auto-Classification Intelligente** : Les machines reçoivent dynamiquement des icônes SVG en fonction de leurs ports ouverts (Serveurs Web, Bases de données, etc.).
- 🔍 **Filtres de Surface d'Attaque** : Isolez instantanément les cibles (Web, Accès Distants, DB) grâce à la barre de filtres.
- 📊 **Tableau de Bord Complet** : Vue Topologie, Tableau détaillé des Hôtes, et résumé global des Services & Ports.
- 📸 **Export PNG Intégré** : Exportez votre graphe actuel en PNG haute qualité avec un encart de résumé généré automatiquement pour vos rapports.

## 🚀 Démarrage & Live Demo

Vous pouvez tester l'application immédiatement et en toute sécurité via le lien Live Demo ci-dessus (hébergé sur GitHub Pages).

Si vous préférez l'utiliser localement :
1. Clonez ce dépôt.
2. Double-cliquez sur `index.html`.
3. Glissez-déposez le résultat de votre scan Nmap (`.txt` ou `.xml`).
*Un fichier `mock_scan.txt` est fourni dans le dépôt pour tester.*

## 🛠️ Stack Technique
- Vanilla JavaScript (ES6+), DOMParser
- Tailwind CSS (via CDN)
- Vis-Network & Lucide Icons

---

# 🇬🇧 English Version

## 📖 Overview
**AckBoard** is a lightning-fast, 100% client-side, zero-server network visualization tool crafted by a cybersecurity student for Network Engineers, Pentesters, and System Administrators. 

It takes standard **Nmap scan outputs** (`.txt` or `.xml`) and instantly transforms them into interactive, dynamic, and highly readable network topologies—without ever sending your sensitive infrastructure data over the network. 

## 📸 Interface Preview

<div align="center">
  <!-- Screenshots Placeholders -->
  <img src="assets/topology_filters.png" alt="Attack Surface Filters" width="48%">
  <img src="assets/services_dashboard.png" alt="Services Dashboard" width="48%">
</div>

## ✨ Key Features

- 🔒 **100% Offline & Client-Side**: No backend, no Node.js, no API calls. Your scan data never leaves your browser.
- 🕸️ **Interactive Topology**: A dynamic network graph powered by `vis-network`. Supports multiple layouts.
- 🎨 **Smart Auto-Classification**: Devices are automatically assigned dynamic SVG icons based on their open ports (Web Servers, Databases, etc.).
- 🔍 **Attack Surface Filters**: Instantly isolate high-value targets (Web, Remote Access, DB) using the quick filters bar.
- 📊 **Comprehensive Dashboard**: Topology View, detailed Hosts Table, and aggregated Services & Ports summary.
- 📸 **Built-in PNG Export**: Export your current network graph as a high-quality PNG with an auto-generated scan summary overlay.

## 🚀 Quick Start & Live Demo

You can test the application immediately and securely via the Live Demo link at the top (hosted on GitHub Pages).

If you prefer to run it locally:
1. Clone this repository.
2. Double-click on `index.html`.
3. Drag and drop your Nmap scan result (`.txt` or `.xml`).
*A sample `mock_scan.txt` is provided in the repository for quick testing.*

## 🛠️ Tech Stack
- Vanilla JavaScript (ES6+), DOMParser
- Tailwind CSS (via CDN)
- Vis-Network & Lucide Icons

## 📝 License
This project is licensed under the MIT License. Feel free to use, modify, and distribute as you see fit.

---
*Crafted with precision for cybersecurity professionals.*
