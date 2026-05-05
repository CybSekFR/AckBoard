// Nmap Parser Logic
function getNetworkRange(hosts) {
  if (!hosts || hosts.length === 0) return "Unknown Network";
  const subnets = {};
  hosts.forEach(h => {
    const parts = h.ip.split('.');
    if (parts.length === 4) {
      const subnet = `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
      subnets[subnet] = (subnets[subnet] || 0) + 1;
    }
  });
  
  let bestSubnet = hosts[0].ip; // Default
  let max = 0;
  for (let subnet in subnets) {
    if (subnets[subnet] > max) {
      max = subnets[subnet];
      bestSubnet = subnet;
    }
  }
  return bestSubnet;
}

function parseNmap(content, filename) {
  let parsed;
  if (filename.endsWith('.xml')) {
    parsed = parseNmapXML(content);
  } else {
    parsed = parseNmapTXT(content);
  }
  if (!parsed.scanTarget || parsed.scanTarget === "Unknown Network") {
    parsed.scanTarget = getNetworkRange(parsed.hosts);
  }
  return parsed;
}

function parseNmapTXT(content) {
  const hosts = [];
  const lines = content.split('\n');

  let currentHost = null;
  let inPortTable = false;
  let scanTarget = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('Nmap scan report for')) {
      if (currentHost) hosts.push(currentHost);
      const match = line.match(/Nmap scan report for (.*)/);
      let ip = match ? match[1] : 'Unknown';
      let hostname = '';
      if (ip.includes('(') && ip.includes(')')) {
        const parts = ip.match(/(.*) \((.*)\)/);
        if (parts) { hostname = parts[1]; ip = parts[2]; }
      }
      currentHost = { id: ip, ip, hostname, status: 'unknown', ports: [], os: 'Unknown', mac: 'Unknown', macVendor: '' };
      inPortTable = false;
      continue;
    }

    if (!currentHost) continue;

    if (line.startsWith('Host is')) {
      if (line.includes('up')) currentHost.status = 'up';
      else if (line.includes('down')) currentHost.status = 'down';
    }
    if (line.startsWith('OS details:')) currentHost.os = line.replace('OS details:', '').trim();
    else if (line.startsWith('Running:')) currentHost.os = line.replace('Running:', '').trim();

    if (line.startsWith('MAC Address:')) {
      const macMatch = line.match(/MAC Address: ([A-Fa-f0-9:]+) \((.*?)\)/);
      if (macMatch) { currentHost.mac = macMatch[1]; if (macMatch[2]) currentHost.macVendor = macMatch[2]; }
      else currentHost.mac = line.replace('MAC Address:', '').trim();
    }

    if (line.startsWith('PORT') && line.includes('STATE') && line.includes('SERVICE')) {
      inPortTable = true;
      continue;
    }

    if (inPortTable) {
      if (line === '') { inPortTable = false; continue; }
      const portRegex = /^(\d+)\/(tcp|udp)\s+([a-zA-Z]+)\s+([^ ]+)(?:\s+(.*))?$/;
      const portMatch = line.match(portRegex);
      if (portMatch) {
        currentHost.ports.push({
          port: parseInt(portMatch[1], 10), protocol: portMatch[2], state: portMatch[3],
          service: portMatch[4], version: portMatch[5] ? portMatch[5].trim() : ''
        });
      }
    }
  }

  if (currentHost) hosts.push(currentHost);
  return { hosts, scanTarget };
}

function parseNmapXML(content) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, "text/xml");
  const hosts = [];
  
  let scanTarget = null;
  const nmaprun = xmlDoc.getElementsByTagName('nmaprun')[0];
  if (nmaprun) {
    const args = nmaprun.getAttribute('args');
    if (args) {
      const argsParts = args.split(' ');
      scanTarget = argsParts[argsParts.length - 1];
    }
  }

  const hostElements = xmlDoc.getElementsByTagName('host');
  for (let i = 0; i < hostElements.length; i++) {
    const hostEl = hostElements[i];
    const statusEl = hostEl.getElementsByTagName('status')[0];
    const status = statusEl ? statusEl.getAttribute('state') : 'unknown';
    
    let ip = 'Unknown', mac = 'Unknown', macVendor = '';
    const addressEls = hostEl.getElementsByTagName('address');
    for (let j = 0; j < addressEls.length; j++) {
      const addrType = addressEls[j].getAttribute('addrtype');
      if (addrType === 'ipv4' || addrType === 'ipv6') ip = addressEls[j].getAttribute('addr');
      else if (addrType === 'mac') { mac = addressEls[j].getAttribute('addr'); macVendor = addressEls[j].getAttribute('vendor') || ''; }
    }
    
    let hostname = '';
    const nameEl = hostEl.getElementsByTagName('hostname')[0];
    if (nameEl) hostname = nameEl.getAttribute('name');
    
    const ports = [];
    const portEls = hostEl.getElementsByTagName('port');
    for (let j = 0; j < portEls.length; j++) {
      const portEl = portEls[j];
      const stateEl = portEl.getElementsByTagName('state')[0];
      const serviceEl = portEl.getElementsByTagName('service')[0];
      let version = '';
      if (serviceEl) version = `${serviceEl.getAttribute('product') || ''} ${serviceEl.getAttribute('version') || ''} ${serviceEl.getAttribute('extrainfo') || ''}`.trim();
      ports.push({ port: parseInt(portEl.getAttribute('portid'), 10), protocol: portEl.getAttribute('protocol'), state: stateEl ? stateEl.getAttribute('state') : '', service: serviceEl ? serviceEl.getAttribute('name') : '', version });
    }
    
    let os = 'Unknown';
    const osMatchEl = hostEl.getElementsByTagName('osmatch')[0];
    if (osMatchEl) os = osMatchEl.getAttribute('name');
    hosts.push({ id: ip, ip, hostname, status, mac, macVendor, ports, os });
  }
  return { hosts, scanTarget };
}

// App Logic
document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const errorMsg = document.getElementById('error-msg');
  const dropzoneText = document.getElementById('dropzone-text');
  
  const uploadView = document.getElementById('upload-view');
  const mainView = document.getElementById('main-view');
  const resetBtn = document.getElementById('reset-btn');
  const filenameDisplay = document.getElementById('filename-display');
  
  const sidebar = document.getElementById('sidebar');
  const closeSidebarBtn = document.getElementById('close-sidebar');

  let network = null;
  let currentHostsData = {};
  let currentParsedData = null;
  let originalParsedData = null;
  
  let isCanvaMode = false;
  let currentPaintColor = null;
  let paintedIPs = {};
  let isPainting = false;

  window.addEventListener('mouseup', () => isPainting = false);

  const toggleCanvaBtn = document.getElementById('toggle-canva-btn');
  const canvaToolbar = document.getElementById('canva-toolbar');
  const colorPickerBtns = document.querySelectorAll('.color-picker-btn');
  const resetIpamBtn = document.getElementById('reset-ipam-btn');

  if(resetIpamBtn) {
    resetIpamBtn.addEventListener('click', () => {
       if (originalParsedData) {
           currentParsedData = JSON.parse(JSON.stringify(originalParsedData));
           paintedIPs = {};
           buildTopology(currentParsedData);
           buildTable(currentParsedData.hosts);
           buildServices(currentParsedData.hosts);
           buildNetworkView(currentParsedData);
       }
    });
  }

  if(toggleCanvaBtn) {
    toggleCanvaBtn.addEventListener('click', () => {
      isCanvaMode = !isCanvaMode;
      if (isCanvaMode) {
         toggleCanvaBtn.classList.add('bg-noc-accent', 'text-white');
         toggleCanvaBtn.classList.remove('bg-noc-accent/10', 'text-noc-accent');
         canvaToolbar.classList.remove('hidden');
      } else {
         toggleCanvaBtn.classList.remove('bg-noc-accent', 'text-white');
         toggleCanvaBtn.classList.add('bg-noc-accent/10', 'text-noc-accent');
         canvaToolbar.classList.add('hidden');
         currentPaintColor = null;
         colorPickerBtns.forEach(b => b.classList.remove('ring-2', 'ring-white', 'scale-110'));
      }
      if (currentParsedData) buildNetworkView(currentParsedData);
    });

    colorPickerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedColor = btn.getAttribute('data-color');
        if (currentPaintColor === selectedColor) {
            btn.classList.remove('ring-2', 'ring-white', 'scale-110');
            currentPaintColor = null;
        } else {
            colorPickerBtns.forEach(b => b.classList.remove('ring-2', 'ring-white', 'scale-110'));
            btn.classList.add('ring-2', 'ring-white', 'scale-110');
            currentPaintColor = selectedColor;
        }
      });
    });
  }

  function moveHost(hostId, newIp) {
      if (!currentParsedData) return;
      const host = currentParsedData.hosts.find(h => h.id === hostId);
      if (host) {
          host.ip = newIp;
          host.id = newIp; // Update ID as well
          buildTopology(currentParsedData);
          buildTable(currentParsedData.hosts);
          buildServices(currentParsedData.hosts);
          buildNetworkView(currentParsedData);
      }
  }

  function paintCell(ip) {
      if (currentPaintColor === 'clear') {
          delete paintedIPs[ip];
      } else {
          paintedIPs[ip] = currentPaintColor;
      }
      buildNetworkView(currentParsedData);
  }

  // SVGs for classification
  const svgs = {
    globe: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="#3b82f620" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>`,
    serverUp: `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="#10b98120" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`,
    serverDown: `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="#ef444420" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`,
    web: `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="#10b98120" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
    db: `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="#10b98120" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>`,
    file: `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="#10b98120" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`
  };

  function getHostIcon(host) {
    if (host.status !== 'up') return svgs.serverDown;
    if (!host.ports) return svgs.serverUp;
    
    const openPorts = host.ports.filter(p => p.state === 'open').map(p => p.port);
    if (openPorts.some(p => [80, 443, 8080, 8443].includes(p))) return svgs.web;
    if (openPorts.some(p => [3306, 5432, 27017, 1433, 1521].includes(p))) return svgs.db;
    if (openPorts.some(p => [139, 445, 21, 2049].includes(p))) return svgs.file;
    return svgs.serverUp;
  }

  // Tabs handling
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => { b.classList.remove('active', 'bg-noc-border', 'text-white'); b.classList.add('text-noc-muted'); });
      tabContents.forEach(c => c.classList.add('hidden'));
      btn.classList.add('active', 'bg-noc-border', 'text-white');
      btn.classList.remove('text-noc-muted');
      const targetId = btn.getAttribute('data-target');
      document.getElementById(targetId).classList.remove('hidden');
      if(targetId === 'view-topology' && network) network.fit();
    });
  });

  // Layout handling
  const layoutBtns = document.querySelectorAll('.layout-btn');
  layoutBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      layoutBtns.forEach(b => { b.classList.remove('active', 'bg-noc-border', 'text-white'); b.classList.add('text-noc-muted'); });
      btn.classList.add('active', 'bg-noc-border', 'text-white');
      btn.classList.remove('text-noc-muted');
      changeLayout(btn.getAttribute('data-layout'));
    });
  });

  function changeLayout(layoutType) {
    if (!network) return;
    let options = { layout: { hierarchical: false }, physics: { enabled: true } };
    if (layoutType === 'organic') {
      options.physics = { solver: 'forceAtlas2Based', forceAtlas2Based: { gravitationalConstant: -120, centralGravity: 0.01, springLength: 200, springConstant: 0.08 } };
    } else if (layoutType === 'tree-ud') {
      options.layout = { hierarchical: { direction: 'UD', sortMethod: 'directed', nodeSpacing: 150, levelSeparation: 200 } };
      options.physics = { enabled: false };
    } else if (layoutType === 'tree-lr') {
      options.layout = { hierarchical: { direction: 'LR', sortMethod: 'directed', nodeSpacing: 100, levelSeparation: 250 } };
      options.physics = { enabled: false };
    } else if (layoutType === 'repulsion') {
      options.physics = { solver: 'repulsion', repulsion: { nodeDistance: 250, centralGravity: 0.0, springLength: 250, springConstant: 0.05 } };
    }
    network.setOptions(options);
    if (layoutType !== 'organic' && layoutType !== 'repulsion') setTimeout(() => network.fit(), 50);
  }

  // Filter Handling
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => { b.classList.remove('bg-noc-border', 'text-white'); b.classList.add('text-noc-muted'); });
      btn.classList.add('bg-noc-border', 'text-white');
      btn.classList.remove('text-noc-muted');
      applyFilter(btn.getAttribute('data-filter'));
    });
  });

  function applyFilter(filterType) {
    if (!network) return;
    const nodesToUpdate = [];
    
    let targetPorts = [];
    if (filterType === 'web') targetPorts = [80, 443, 8080, 8443];
    else if (filterType === 'db') targetPorts = [3306, 5432, 27017, 1433, 1521];
    else if (filterType === 'remote') targetPorts = [22, 23, 3389, 5900];
    else if (filterType === 'files') targetPorts = [139, 445, 21, 2049];

    Object.values(currentHostsData).forEach(host => {
      let match = false;
      if (filterType === 'clear') {
        match = true;
      } else {
        if (host.ports && host.status === 'up') {
          const openPorts = host.ports.filter(p => p.state === 'open').map(p => p.port);
          match = openPorts.some(p => targetPorts.includes(p));
        }
      }
      
      // Update opacity directly in node properties
      nodesToUpdate.push({
        id: host.id,
        opacity: match ? 1 : 0.15
      });
    });
    
    // Also dim edges connected to dimmed nodes
    const edgesToUpdate = [];
    network.body.data.edges.get().forEach(edge => {
      const toNode = nodesToUpdate.find(n => n.id === edge.to);
      if(toNode) {
        edgesToUpdate.push({
          id: edge.id,
          color: { opacity: toNode.opacity === 1 ? 0.4 : 0.05 }
        });
      }
    });

    network.body.data.nodes.update(nodesToUpdate);
    network.body.data.edges.update(edgesToUpdate);
  }

  // Export handling
  const exportExcelBtn = document.getElementById('export-excel-btn');
  if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', async () => {
      if (!currentParsedData || !currentParsedData.hosts || typeof ExcelJS === 'undefined') return;
      
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('AckBoard Scan');
      
      // Add Title
      sheet.mergeCells('A1:H1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = `Rapport Nmap - ${currentParsedData.scanTarget}`;
      titleCell.font = { size: 16, bold: true, color: { argb: 'FF1E3A8A' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      
      sheet.mergeCells('A2:H2');
      const dateCell = sheet.getCell('A2');
      dateCell.value = `Généré le : ${new Date().toLocaleString()}`;
      dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
      
      sheet.addRow([]); // empty row
      
      // Headers
      const headers = ['Statut', 'Adresse IP', 'Hostname', 'Système d\'exploitation', 'Adresse MAC', 'Fabricant MAC', 'Ports Ouverts', 'Détails Services'];
      const headerRow = sheet.addRow(headers);
      
      headerRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
          cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      });
      
      // Data
      currentParsedData.hosts.forEach(host => {
          const isUp = host.status === 'up';
          let openPortsCount = 0;
          let servicesDetails = '';
          
          if (host.ports) {
              const openPorts = host.ports.filter(p => p.state === 'open');
              openPortsCount = openPorts.length;
              servicesDetails = openPorts.map(p => {
                  let v = p.version ? ` - ${p.version}` : '';
                  return `${p.port}/${p.protocol} (${p.service || 'inconnu'})${v}`;
              }).join('\n');
          }
          
          const os = (!host.os || host.os === 'Unknown') ? '' : host.os;
          const mac = (!host.mac || host.mac === 'Unknown') ? '' : host.mac;
          
          const row = sheet.addRow([
              isUp ? 'UP' : 'DOWN',
              host.ip,
              host.hostname || '',
              os,
              mac,
              host.macVendor || '',
              openPortsCount,
              servicesDetails
          ]);
          
          row.eachCell((cell, colNumber) => {
              cell.border = { top: {style:'thin', color: {argb:'FFCBD5E1'}}, left: {style:'thin', color: {argb:'FFCBD5E1'}}, bottom: {style:'thin', color: {argb:'FFCBD5E1'}}, right: {style:'thin', color: {argb:'FFCBD5E1'}} };
              cell.alignment = { vertical: 'middle', wrapText: true };
              
              if (colNumber === 1) { // Statut
                  if (isUp) {
                      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
                      cell.font = { color: { argb: 'FF065F46' }, bold: true };
                  } else {
                      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
                      cell.font = { color: { argb: 'FF991B1B' }, bold: true };
                  }
                  cell.alignment = { vertical: 'middle', horizontal: 'center' };
              } else if (colNumber === 2) { // IP
                  cell.font = { bold: true };
              } else if (colNumber === 7) { // Ports Count
                  cell.alignment = { vertical: 'middle', horizontal: 'center' };
                  cell.font = { bold: true };
              }
          });
      });
      
      // Adjust column widths
      sheet.columns = [
          { width: 12 }, { width: 18 }, { width: 20 }, { width: 25 },
          { width: 20 }, { width: 25 }, { width: 15 }, { width: 45 }
      ];
      
      // Export Native XLSX
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `nmap-export-${Date.now()}.xlsx`;
      link.click();
    });
  }

  document.getElementById('export-png-btn').addEventListener('click', () => {
    if (!network) return;
    
    const canvas = document.querySelector('#network-graph canvas');
    if(!canvas) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw graph
    ctx.drawImage(canvas, 0, 0);
    
    // Draw summary box
    ctx.fillStyle = '#16161a';
    ctx.strokeStyle = '#2a2a35';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(20, 20, 320, 110, 10);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#e4e4e7';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText('Nmap Scan Summary', 40, 55);
    
    ctx.font = '15px Arial, sans-serif';
    ctx.fillStyle = '#10b981';
    
    const upCount = Object.values(currentHostsData).filter(h => h.status === 'up').length;
    let totalOpenPorts = 0;
    Object.values(currentHostsData).forEach(h => {
      if(h.ports) totalOpenPorts += h.ports.filter(p => p.state === 'open').length;
    });

    ctx.fillText(`Cible: ${currentParsedData.scanTarget}`, 40, 85);
    ctx.fillText(`Hôtes Up: ${upCount} | Ports ouverts: ${totalOpenPorts}`, 40, 105);
    
    // Download
    const link = document.createElement('a');
    link.download = `nmap-topology-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  });


  // File Handling
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('border-noc-accent', 'bg-noc-accent/10'); dropzoneText.textContent = "Lâchez le fichier ici"; });
  dropzone.addEventListener('dragleave', (e) => { e.preventDefault(); dropzone.classList.remove('border-noc-accent', 'bg-noc-accent/10'); dropzoneText.textContent = "Cliquez ou glissez un fichier"; });
  dropzone.addEventListener('drop', (e) => { e.preventDefault(); dropzone.classList.remove('border-noc-accent', 'bg-noc-accent/10'); if (e.dataTransfer.files.length) processFile(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', (e) => { if (e.target.files.length) processFile(e.target.files[0]); });

  function processFile(file) {
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.xml')) {
      errorMsg.textContent = 'Veuillez uploader un fichier .txt ou .xml';
      errorMsg.classList.remove('hidden');
      return;
    }
    errorMsg.classList.add('hidden');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        currentParsedData = parseNmap(e.target.result, file.name);
        originalParsedData = JSON.parse(JSON.stringify(currentParsedData));
        filenameDisplay.textContent = file.name;
        uploadView.classList.add('hidden');
        mainView.classList.remove('hidden');
        buildTopology(currentParsedData);
        buildTable(currentParsedData.hosts);
        buildServices(currentParsedData.hosts);
        buildNetworkView(currentParsedData);
        document.querySelector('.tab-btn[data-target="view-topology"]').click();
      } catch (err) {
        console.error(err);
        errorMsg.textContent = 'Erreur lors de la lecture du fichier.';
        errorMsg.classList.remove('hidden');
      }
    };
    reader.readAsText(file);
  }

  function buildTopology(data) {
    const hosts = data.hosts;
    const nodes = new vis.DataSet();
    const edges = new vis.DataSet();
    currentHostsData = {};

    nodes.add({
      id: 'center',
      label: `<b>Réseau: ${data.scanTarget}</b>\n${hosts.length} hôtes détectés`,
      shape: 'image',
      image: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgs.globe),
      font: { color: '#ffffff', multi: 'html', size: 16, align: 'center' },
      size: 40,
      opacity: 1
    });

    hosts.forEach(host => {
      currentHostsData[host.id] = host;
      const isUp = host.status === 'up';
      const color = isUp ? '#10b981' : '#ef4444';
      const icon = getHostIcon(host);
      
      let label = `<b>${host.ip}</b>`;
      if (host.hostname) label += `\n<i>${host.hostname}</i>`;
      
      nodes.add({
        id: host.id,
        label: label,
        title: `OS: ${host.os || 'Inconnu'}\nPorts: ${host.ports ? host.ports.length : 0}`,
        shape: 'image',
        image: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(icon),
        font: { color: '#e4e4e7', multi: 'html', size: 12 },
        size: 25,
        opacity: 1
      });

      edges.add({
        from: 'center',
        to: host.id,
        color: { color: color, opacity: 0.4 },
        width: isUp ? 2 : 1,
        dashes: !isUp,
        smooth: { type: 'curvedCW', roundness: 0.2 }
      });
    });

    const container = document.getElementById('network-graph');
    const options = {
      nodes: { font: { face: 'Inter, system-ui, sans-serif' }, shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 10, x: 0, y: 5 } },
      edges: { shadow: { enabled: true, color: 'rgba(0,0,0,0.3)', size: 5, x: 0, y: 2 } },
      physics: { solver: 'forceAtlas2Based', forceAtlas2Based: { gravitationalConstant: -120, centralGravity: 0.01, springLength: 200, springConstant: 0.08 } },
      interaction: { hover: true, tooltipDelay: 200, zoomView: true }
    };

    if (network) network.destroy();
    network = new vis.Network(container, { nodes, edges }, options);

    network.on('click', function (properties) {
      if (properties.nodes.length > 0) {
        const nodeId = properties.nodes[0];
        if (nodeId !== 'center') openSidebar(currentHostsData[nodeId]);
        else closeSidebar();
      } else closeSidebar();
    });

    // Reset UI
    document.querySelector('.layout-btn[data-layout="organic"]').click();
    document.querySelector('.filter-btn[data-filter="clear"]').click();
  }

  function buildTable(hosts) {
    const tbody = document.getElementById('hosts-table-body');
    tbody.innerHTML = '';
    hosts.forEach(host => {
      const isUp = host.status === 'up';
      const statusHtml = `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${isUp ? 'bg-noc-up/10 text-noc-up' : 'bg-noc-down/10 text-noc-down'}">${host.status}</span>`;
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-noc-border/30 transition-colors';
      tr.innerHTML = `
        <td class="p-4">${statusHtml}</td>
        <td class="p-4 font-mono text-white">${host.ip}</td>
        <td class="p-4 text-noc-text">${host.hostname || '-'}</td>
        <td class="p-4 text-noc-muted">${host.os || 'Inconnu'}</td>
        <td class="p-4 font-mono text-xs text-noc-muted">${host.mac || '-'}</td>
        <td class="p-4 text-right">
          <span class="bg-noc-dark px-2.5 py-1 rounded text-white font-medium border border-noc-border">
            ${host.ports ? host.ports.filter(p=>p.state==='open').length : 0}
          </span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function buildServices(hosts) {
    const servicesGrid = document.getElementById('services-grid');
    servicesGrid.innerHTML = '';
    const serviceMap = {};
    hosts.forEach(host => {
      if(host.ports && host.status === 'up') {
        host.ports.forEach(port => {
          if(port.state === 'open') {
            const key = `${port.port}/${port.protocol}`;
            if(!serviceMap[key]) {
              serviceMap[key] = { port: port.port, protocol: port.protocol, service: port.service || 'unknown', hosts: [] };
            }
            serviceMap[key].hosts.push(host.ip);
          }
        });
      }
    });

    const sortedKeys = Object.keys(serviceMap).sort((a, b) => serviceMap[a].port - serviceMap[b].port);
    if(sortedKeys.length === 0) {
      servicesGrid.innerHTML = `<div class="col-span-full text-center p-12 bg-noc-card border border-noc-border rounded-xl text-noc-muted">Aucun service ouvert détecté.</div>`;
      return;
    }

    sortedKeys.forEach(key => {
      const svc = serviceMap[key];
      const card = document.createElement('div');
      card.className = 'bg-noc-card border border-noc-border rounded-xl p-5 hover:border-noc-accent transition-colors shadow-lg';
      let hostsHtml = svc.hosts.slice(0, 5).map(ip => `<span class="text-xs bg-noc-dark border border-noc-border px-2 py-1 rounded text-noc-text">${ip}</span>`).join(' ');
      if(svc.hosts.length > 5) hostsHtml += ` <span class="text-xs text-noc-muted">+ ${svc.hosts.length - 5} autres</span>`;

      card.innerHTML = `
        <div class="flex items-center justify-between mb-4 border-b border-noc-border pb-3">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-noc-accent/10 rounded-lg text-noc-accent"><i data-lucide="plug" class="w-5 h-5"></i></div>
            <div>
              <h3 class="text-lg font-bold text-white leading-tight font-mono">${svc.port}/${svc.protocol}</h3>
              <p class="text-xs text-noc-muted uppercase tracking-wider font-semibold">${svc.service}</p>
            </div>
          </div>
          <div class="text-center">
            <span class="text-xl font-bold text-white">${svc.hosts.length}</span>
            <p class="text-[10px] text-noc-muted uppercase">Hôtes</p>
          </div>
        </div>
        <div>
          <p class="text-xs text-noc-muted mb-2">Hôtes exposant ce service :</p>
          <div class="flex flex-wrap gap-1.5">${hostsHtml}</div>
        </div>
      `;
      servicesGrid.appendChild(card);
    });
    lucide.createIcons();
  }

  function buildNetworkView(data) {
    const networkInfoGrid = document.getElementById('network-info-grid');
    const ipGrid = document.getElementById('ip-grid');
    
    let baseNetwork = "";
    let cidr = "24";
    
    if (data.scanTarget && data.scanTarget.includes('/')) {
        const parts = data.scanTarget.split('/');
        baseNetwork = parts[0];
        cidr = parts[1] || "24";
    } else {
        baseNetwork = data.scanTarget || "192.168.1.0";
    }
    
    const ipParts = baseNetwork.split('.');
    if (ipParts.length === 4) {
        ipParts[3] = '0';
        baseNetwork = ipParts.join('.');
    }
    
    let subnetMask = "255.255.255.0";
    let broadcast = ipParts.slice(0, 3).join('.') + ".255";
    let reverseIP = ipParts.slice(0, 3).reverse().join('.') + ".in-addr.arpa";
    
    if (cidr === "24") {
        subnetMask = "255.255.255.0";
    } else if (cidr === "16") {
        subnetMask = "255.255.0.0";
    }
    
    const hostMap = {};
    
    data.hosts.forEach(host => {
        const parts = host.ip.split('.');
        if (parts.length === 4) {
            const octet = parseInt(parts[3], 10);
            hostMap[octet] = host;
        }
    });
    
    networkInfoGrid.innerHTML = `
        <div class="bg-noc-card border border-noc-border rounded-xl p-5 shadow-lg flex flex-col justify-center transition-colors hover:border-noc-accent/50">
            <div class="flex items-center gap-3 mb-2">
                <div class="p-2 bg-noc-accent/10 rounded-lg text-noc-accent">
                   <i data-lucide="network" class="w-5 h-5"></i>
                </div>
                <h3 class="text-xs font-bold text-noc-muted uppercase tracking-wider">Réseau & CIDR</h3>
            </div>
            <p class="text-xl font-bold font-mono text-white mt-1">${baseNetwork}/${cidr}</p>
        </div>
        <div class="bg-noc-card border border-noc-border rounded-xl p-5 shadow-lg flex flex-col justify-center transition-colors hover:border-noc-accent/50">
            <div class="flex items-center gap-3 mb-2">
                <div class="p-2 bg-noc-accent/10 rounded-lg text-noc-accent">
                   <i data-lucide="calculator" class="w-5 h-5"></i>
                </div>
                <h3 class="text-xs font-bold text-noc-muted uppercase tracking-wider">Masque Sous-réseau</h3>
            </div>
            <p class="text-xl font-bold font-mono text-white mt-1">${subnetMask}</p>
        </div>
        <div class="bg-noc-card border border-noc-border rounded-xl p-5 shadow-lg flex flex-col justify-center transition-colors hover:border-noc-accent/50">
            <div class="flex items-center gap-3 mb-2">
                <div class="p-2 bg-noc-accent/10 rounded-lg text-noc-accent">
                   <i data-lucide="broadcast" class="w-5 h-5"></i>
                </div>
                <h3 class="text-xs font-bold text-noc-muted uppercase tracking-wider">Broadcast</h3>
            </div>
            <p class="text-xl font-bold font-mono text-white mt-1">${broadcast}</p>
        </div>
        <div class="bg-noc-card border border-noc-border rounded-xl p-5 shadow-lg flex flex-col justify-center transition-colors hover:border-noc-accent/50">
            <div class="flex items-center gap-3 mb-2">
                <div class="p-2 bg-noc-accent/10 rounded-lg text-noc-accent">
                   <i data-lucide="arrow-left-right" class="w-5 h-5"></i>
                </div>
                <h3 class="text-xs font-bold text-noc-muted uppercase tracking-wider">Zone Inverse</h3>
            </div>
            <p class="text-base font-bold font-mono text-white mt-1 truncate" title="${reverseIP}">${reverseIP}</p>
        </div>
    `;
    
    ipGrid.innerHTML = '';
    const baseIPPrefix = ipParts.slice(0, 3).join('.');
    
    for (let i = 0; i < 256; i++) {
        const host = hostMap[i];
        const isNetwork = (i === 0);
        const isBroadcast = (i === 255);
        const fullIp = `${baseIPPrefix}.${i}`;
        
        let bgClass = "bg-noc-dark border-noc-border text-noc-muted hover:border-noc-muted hover:bg-noc-border/30";
        let tooltip = `${fullIp} - Disponible`;
        
        let cellColorClass = paintedIPs[fullIp];
        if (cellColorClass) {
             if (cellColorClass === 'blue') bgClass = "bg-blue-500/30 border-blue-500 text-blue-200";
             else if (cellColorClass === 'purple') bgClass = "bg-purple-500/30 border-purple-500 text-purple-200";
             else if (cellColorClass === 'orange') bgClass = "bg-orange-500/30 border-orange-500 text-orange-200";
             else if (cellColorClass === 'pink') bgClass = "bg-pink-500/30 border-pink-500 text-pink-200";
        }

        if (isNetwork) {
             bgClass = "bg-noc-accent/20 border-noc-accent/50 text-noc-accent";
             tooltip = `${fullIp} - Adresse Réseau`;
        } else if (isBroadcast) {
             bgClass = "bg-noc-accent/20 border-noc-accent/50 text-noc-accent";
             tooltip = `${fullIp} - Adresse de Broadcast`;
        } else if (host) {
             if (host.status === 'up') {
                 bgClass = "bg-noc-up border-noc-up text-noc-dark font-bold hover:scale-110 shadow-lg shadow-noc-up/20 z-10 relative";
                 tooltip = `${host.ip} - UP${host.hostname ? ' ('+host.hostname+')' : ''}`;
             } else {
                 bgClass = "bg-noc-down border-noc-down text-noc-dark font-bold hover:scale-110 shadow-lg shadow-noc-down/20 z-10 relative";
                 tooltip = `${host.ip} - DOWN`;
             }
        }
        
        const ipCell = document.createElement('div');
        ipCell.className = `aspect-square rounded border flex items-center justify-center text-[10px] sm:text-xs transition-all duration-200 ${bgClass}`;
        ipCell.textContent = i;
        ipCell.title = tooltip;
        ipCell.dataset.ip = fullIp;
        
        if (host) {
            ipCell.classList.add('cursor-pointer');
            if (isCanvaMode) {
                 ipCell.draggable = true;
                 ipCell.addEventListener('dragstart', (e) => {
                     e.dataTransfer.setData('text/plain', host.id);
                 });
            }
            ipCell.addEventListener('mousedown', () => {
                if (isCanvaMode && currentPaintColor) {
                    isPainting = true;
                    paintCell(fullIp);
                } else if (!isCanvaMode) {
                    openSidebar(host);
                }
            });
            ipCell.addEventListener('mouseenter', () => {
                if (isPainting && isCanvaMode && currentPaintColor) paintCell(fullIp);
            });
        } else {
            ipCell.classList.add('cursor-help');
            if (isCanvaMode) {
               ipCell.addEventListener('dragover', (e) => e.preventDefault());
               ipCell.addEventListener('drop', (e) => {
                   e.preventDefault();
                   const hostId = e.dataTransfer.getData('text/plain');
                   if (hostId && hostId !== fullIp) moveHost(hostId, fullIp);
               });
            }
            ipCell.addEventListener('mousedown', () => {
               if (isCanvaMode && currentPaintColor && !isNetwork && !isBroadcast) {
                   isPainting = true;
                   paintCell(fullIp);
               }
            });
            ipCell.addEventListener('mouseenter', () => {
               if (isPainting && isCanvaMode && currentPaintColor && !isNetwork && !isBroadcast) {
                   paintCell(fullIp);
               }
            });
        }
        
        ipGrid.appendChild(ipCell);
    }
    
    lucide.createIcons();
  }

  function openSidebar(host) {
    const isUp = host.status === 'up';
    document.getElementById('sidebar-ip').textContent = host.ip;
    document.getElementById('sidebar-status').textContent = host.status;
    document.getElementById('sidebar-status-dot').className = `w-2 h-2 rounded-full ${isUp ? 'bg-noc-up' : 'bg-noc-down'}`;
    document.getElementById('sidebar-icon-container').className = `p-3 rounded-xl ${isUp ? 'bg-noc-up/10 text-noc-up' : 'bg-noc-down/10 text-noc-down'}`;
    document.getElementById('sidebar-hostname').textContent = host.hostname || 'Inconnu';
    document.getElementById('sidebar-os').textContent = host.os || 'Inconnu';
    document.getElementById('sidebar-mac').textContent = host.mac || 'N/A';
    document.getElementById('sidebar-vendor').textContent = host.macVendor || '';
    document.getElementById('sidebar-port-count').textContent = host.ports ? host.ports.filter(p=>p.state==='open').length : 0;

    const portsContainer = document.getElementById('sidebar-ports');
    portsContainer.innerHTML = '';
    
    if (host.ports && host.ports.length > 0) {
      host.ports.filter(p=>p.state==='open').forEach(port => {
        const portHtml = `
          <div class="bg-noc-dark border border-noc-border rounded-lg p-3">
            <div class="flex items-start justify-between mb-2">
              <span class="text-sm font-bold font-mono text-white">${port.port}/${port.protocol}</span>
              <span class="text-[10px] uppercase px-1.5 py-0.5 rounded font-semibold bg-noc-up/10 text-noc-up">OPEN</span>
            </div>
            <div class="mt-1 text-sm">
              <p class="text-noc-text font-medium">${port.service || 'Unknown'}</p>
              ${port.version ? `<p class="text-xs text-noc-muted mt-0.5">${port.version}</p>` : ''}
            </div>
          </div>
        `;
        portsContainer.insertAdjacentHTML('beforeend', portHtml);
      });
    }
    
    if(portsContainer.innerHTML === '') portsContainer.innerHTML = `<div class="text-center p-6 bg-noc-dark border border-noc-border rounded-lg border-dashed"><p class="text-sm text-noc-muted">Aucun port ouvert.</p></div>`;
    sidebar.classList.remove('translate-x-full');
    resetBtn.classList.add('opacity-0', 'pointer-events-none');
    resetBtn.classList.remove('pointer-events-auto');
  }

  function closeSidebar() { 
      sidebar.classList.add('translate-x-full'); 
      resetBtn.classList.remove('opacity-0', 'pointer-events-none');
      resetBtn.classList.add('pointer-events-auto');
  }
  closeSidebarBtn.addEventListener('click', closeSidebar);

  resetBtn.addEventListener('click', () => {
    closeSidebar();
    mainView.classList.add('hidden');
    uploadView.classList.remove('hidden');
    if (network) network.destroy();
    fileInput.value = '';
    currentParsedData = null;
  });
});
