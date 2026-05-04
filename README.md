<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success.svg" alt="Status">
  <img src="https://img.shields.io/badge/Environment-100%25_Offline-blue.svg" alt="100% Offline">
  <img src="https://img.shields.io/badge/Tech-Vanilla_JS-yellow.svg" alt="Vanilla JS">
  <br>
  <h1>🌐 AckBoard</h1>
  <p><b>Advanced Nmap Topology Visualizer & Attack Surface Dashboard</b></p>
</div>

---

## 📖 Overview
**AckBoard** is a lightning-fast, 100% client-side, zero-server network visualization tool designed for Network Engineers, Pentesters, and System Administrators. 

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

## 💡 Use Cases
- **Penetration Testing**: Quickly visualize the footprint of a target network and identify vulnerable services.
- **IT Audits**: Generate clean network maps for compliance reports or infrastructure reviews.
- **CTF / Homelab**: Visually map out your HackTheBox networks or home lab subnets.

## 📝 License
This project is licensed under the MIT License. Feel free to use, modify, and distribute as you see fit.

---
*Crafted with precision for cybersecurity professionals.*
