// public/main.js
const myChannelId = 'UCJrBXKBCYtHrW_PSjZc3amQ';

let data = [];
let sortMode = 'subs';

async function loadData() {
  const res = await fetch('/api/stats');

  if (!res.ok) {
    console.error('Failed to fetch channels');
    return;
  }

  const json = await res.json();
  data = json.stats || [];

  const label = document.getElementById('lastUpdated');
  if (label && json.lastFetch) {
    const dt = new Date(json.lastFetch);
    label.textContent = 'Last updated: ' + dt.toLocaleTimeString();
  }

  render();
}


function render() {
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  const sorted = [...data];

  sorted.sort((a, b) => {
    switch (sortMode) {
      case 'subsPerVideo':
        return (b.subsPerVideo || 0) - (a.subsPerVideo || 0);
      case 'uploads':
        return (b.videos || 0) - (a.videos || 0);
      case 'age':
        return (b.ageMonths || 0) - (a.ageMonths || 0);
      case 'subsPerMonth':
        return (b.subsPerMonth || 0) - (a.subsPerMonth || 0);
      case 'subs':
      default:
        return (b.subs || 0) - (a.subs || 0);
    }
  });

  sorted.forEach((c, index) => {
    const tr = document.createElement('tr');

    // Rank #
    const rankTd = document.createElement('td');
    rankTd.textContent = index + 1;

    // Channel cell: thumbnail + name link
    const chanTd = document.createElement('td');
    const chanDiv = document.createElement('div');
    chanDiv.className = 'channel-cell';

    if (c.thumbnail) {
      const img = document.createElement('img');
      img.src = c.thumbnail;
      img.alt = c.title;
      img.className = 'thumb';
      chanDiv.appendChild(img);
    }

    const link = document.createElement('a');
    link.href = c.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = c.title;

    if (c.id === myChannelId) {
      link.classList.add('my-channel');
    }

    chanDiv.appendChild(link);
    chanTd.appendChild(chanDiv);

    // Subs
    const subsTd = document.createElement('td');
    subsTd.className = 'sub-cell';
    subsTd.textContent = (c.subs || 0).toLocaleString();

    // Subs per video
    const svTd = document.createElement('td');
    svTd.className = 'sub-cell';
    svTd.textContent = (c.subsPerVideo || 0).toFixed(1);

    // Uploads
    const uploadsTd = document.createElement('td');
    uploadsTd.className = 'sub-cell';
    uploadsTd.textContent = (c.videos || 0).toLocaleString();

    // Age (months)
    const ageTd = document.createElement('td');
    ageTd.className = 'sub-cell';
    ageTd.textContent = (c.ageMonths || 0).toFixed(1);

    // Subs/month
    const spmTd = document.createElement('td');
    spmTd.className = 'sub-cell';
    spmTd.textContent = (c.subsPerMonth || 0).toFixed(1);

    tr.appendChild(rankTd);
    tr.appendChild(chanTd);
    tr.appendChild(subsTd);
    tr.appendChild(svTd);
    tr.appendChild(uploadsTd);
    tr.appendChild(ageTd);
    tr.appendChild(spmTd);

    tbody.appendChild(tr);
  });
}

// Sort dropdown
const sortSelect = document.getElementById('sortMode');
if (sortSelect) {
  sortSelect.addEventListener('change', (e) => {
    sortMode = e.target.value;
    render();
  });
}

// Initial load + auto-refresh every 5 minutes
loadData();
setInterval(loadData, 5 * 60 * 1000);
