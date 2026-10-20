// Portal logic: state, cloud sync, sign-in, views, modals, PDF / Excel / QR export.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { EXACT_KSAU_SVG } from './logo.js';
import { INITIAL_LABS, INITIAL_INVENTORY, INITIAL_LOGS, INITIAL_USERS, MASTER_ADMIN, REMOVED_USERNAMES, REMOVED_LOG_BADGES, STATUSES } from './data.js';
import { I18N } from './i18n.js';
import { firebaseConfig } from './firebase-config.js';

// ================= 4. APPLICATION STATE =================
const LOCAL_STORAGE_KEY = 'ksau_hs_htms_portal_v2_backup';

let state = {
  lang: 'en',
  currentUser: null,
  selectedLab: 'ALL',
  activeTab: 'inventory',
  expandAll: false,
  expandedRows: {},
  customLogoDataUrl: null,
  labs: [...INITIAL_LABS],
  inventory: JSON.parse(JSON.stringify(INITIAL_INVENTORY)),
  logs: JSON.parse(JSON.stringify(INITIAL_LOGS)),
  users: JSON.parse(JSON.stringify(INITIAL_USERS))
};

let db = null;
let isCloudConnected = false;

// ================= 4b. ACCESS POLICY: CUSTODIAN + SELECTED FACULTY ONLY =================
const isMaster = u => !!u && String(u.username || '').toLowerCase() === MASTER_ADMIN.username.toLowerCase();

function isEngineerAccount(u) {
  if (isMaster(u)) return false;
  if (REMOVED_USERNAMES.includes(String(u.username || '').toLowerCase())) return true;
  return /engineer|\bhtms\b|^eng\b/i.test(`${u.role || ''} ${u.name || ''}`.trim());
}

// Keeps the saved data in line with how the portal is used:
//  - removes HTMS engineer accounts and their contingency log entries
//  - makes sure the master administrator exists with full rights
//  - drops the "Calibration Due" status (calibration is handled by HTMS)
// Returns true when anything changed, so the change can be saved to the cloud.
function applyDataPolicy() {
  const before = JSON.stringify([state.users, state.logs, state.inventory]);
  state.logs = (state.logs || []).filter(l => l && !REMOVED_LOG_BADGES.includes(String(l.badge)) && l.status !== 'Calibration Due');
  (state.inventory || []).forEach(item => { if (!STATUSES.includes(item.status)) item.status = 'Operational'; });
  const users = (state.users || []).filter(u => u && u.username && !isEngineerAccount(u));
  let master = users.find(isMaster);
  if (!master) {
    master = JSON.parse(JSON.stringify(MASTER_ADMIN));
    users.unshift(master);
  }
  const { username, passwordHash, recoveryHash, ...details } = MASTER_ADMIN;
  Object.assign(master, JSON.parse(JSON.stringify(details)));
  if (!master.passwordHash && !master.password) master.passwordHash = passwordHash;
  if (!master.recoveryHash) master.recoveryHash = recoveryHash;
  state.users = users;
  return JSON.stringify([state.users, state.logs, state.inventory]) !== before;
}

async function hashPassword(username, password) {
  if (!(window.crypto && crypto.subtle)) throw new Error('Secure connection (https) required');
  const bytes = new TextEncoder().encode(`${String(username).toLowerCase()}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Recovery codes let people reset a forgotten password. Format: XXXX-XXXX (no 0/O or 1/I).
function generateRecoveryCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const raw = Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}
const normalizeRecoveryCode = code => String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const hashRecoveryCode = (username, code) => hashPassword(username, `recovery:${normalizeRecoveryCode(code)}`);

async function passwordMatches(acc, password) {
  if (acc.passwordHash) return (await hashPassword(acc.username, password)) === acc.passwordHash;
  return acc.password !== undefined && acc.password === password;   // older plain-text accounts
}

// ================= 5. LOGO RENDERING (EXACT IMAGE OR ULTRA-CRISP VECTOR SEAL) =================
function renderAllLogos() {
  const slots = document.querySelectorAll('.ksau-logo-slot');
  slots.forEach(slot => {
    if (state.customLogoDataUrl) {
      slot.innerHTML = `<img src="${state.customLogoDataUrl}" alt="KSAU-HS Emblem" class="w-full h-full object-contain rounded-full" />`;
    } else {
      slot.innerHTML = `
        <img src="images_2.jpg" alt="KSAU-HS" class="w-full h-full object-contain rounded-full"
             onerror="this.onerror=null; this.src='images.jpg'; this.addEventListener('error', () => { this.parentElement.innerHTML = window.__EXACT_KSAU_SVG; });" />
      `;
    }
  });
}
window.__EXACT_KSAU_SVG = EXACT_KSAU_SVG;

window.triggerLogoUpload = function() {
  document.getElementById('logo-file-input').click();
};

window.handleLogoFileUpload = function(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(e) {
    state.customLogoDataUrl = e.target.result;
    renderAllLogos();
    await persistState();
    showToast(state.lang === 'ar' ? 'تم تحديث شعار الجامعة الرسمي بنجاح' : 'Official KSAU-HS Emblem image updated permanently');
  };
  reader.readAsDataURL(file);
};

// ================= 6. YOUR KSAU-HS-HTMS FIREBASE CLOUD FIRESTORE SYNCHRONIZATION =================
// Firebase project settings are in js/firebase-config.js

function loadLocalBackup() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.labs) state.labs = parsed.labs;
    if (parsed.inventory) state.inventory = parsed.inventory;
    if (parsed.logs) state.logs = parsed.logs;
    if (parsed.users) state.users = parsed.users;
    if (parsed.customLogoDataUrl) state.customLogoDataUrl = parsed.customLogoDataUrl;
  } catch (e) {
    console.warn('Local cache load warning:', e);
  }
  applyDataPolicy();
}

function saveLocalBackup() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      labs: state.labs,
      inventory: state.inventory,
      logs: state.logs,
      users: state.users,
      customLogoDataUrl: state.customLogoDataUrl || ''
    }));
  } catch (e) {
    console.warn('Local cache save warning:', e);
  }
}

async function initCloudSync() {
  loadLocalBackup();
  renderAllLogos();

  try {
    const app = initializeApp(firebaseConfig);
    try { getAnalytics(app); } catch (_) {}
    db = getFirestore(app);
    isCloudConnected = true;

    const stateDocRef = doc(db, 'htms_portal', 'master_v2');
    onSnapshot(stateDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.labs) state.labs = JSON.parse(data.labs);
        if (data.inventory) state.inventory = JSON.parse(data.inventory);
        if (data.logs) state.logs = JSON.parse(data.logs);
        if (data.users) state.users = JSON.parse(data.users);
        if (data.customLogoDataUrl !== undefined) state.customLogoDataUrl = data.customLogoDataUrl || null;
        const accountsChanged = applyDataPolicy();
        saveLocalBackup();
        renderAllLogos();
        if (accountsChanged) persistState();
        if (state.currentUser) {
          const updatedMe = state.users.find(u => u.username.toLowerCase() === state.currentUser.username.toLowerCase());
          if (updatedMe) {
            state.currentUser = updatedMe;
            updateUserHeaderUI();
            refreshAllViews();
          } else {
            handleLogout();
            showToast('Your account has been removed from the portal.');
          }
        }
      } else {
        persistState();
      }
    }, (err) => {
      console.warn('Firestore real-time listener fallback:', err);
    });
  } catch (e) {
    console.warn('Using local backup state:', e);
  }
}

async function persistState() {
  saveLocalBackup();
  if (isCloudConnected && db) {
    try {
      const stateDocRef = doc(db, 'htms_portal', 'master_v2');
      await setDoc(stateDocRef, {
        labs: JSON.stringify(state.labs),
        inventory: JSON.stringify(state.inventory),
        logs: JSON.stringify(state.logs),
        users: JSON.stringify(state.users),
        customLogoDataUrl: state.customLogoDataUrl || '',
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Firestore write warning:', e);
    }
  }
}

// ================= 7. AUTHENTICATION & GRANULAR PERMISSIONS =================
window.handleLogin = async function(e) {
  e.preventDefault();
  const u = document.getElementById('login-username').value.trim();
  const p = document.getElementById('login-password').value.trim();
  const errBox = document.getElementById('login-error');

  const matched = state.users.find(acc => acc.username.toLowerCase() === u.toLowerCase());
  let ok = false;
  try { ok = !!matched && await passwordMatches(matched, p); } catch (err) { console.warn(err); }
  if (!ok) {
    errBox.classList.remove('hidden');
    return;
  }
  if (!matched.passwordHash) {            // upgrade an older plain-text password to a hash
    matched.passwordHash = await hashPassword(matched.username, p);
    delete matched.password;
    persistState();
  }

  errBox.classList.add('hidden');
  state.currentUser = matched;
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  updateUserHeaderUI();
  refreshAllViews();
};

window.handleLogout = function() {
  state.currentUser = null;
  document.getElementById('login-password').value = '';
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
};

window.togglePasswordVisibility = function() {
  const inp = document.getElementById('login-password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
};

function updateUserHeaderUI() {
  const u = state.currentUser;
  if (!u) return;
  const initials = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('user-avatar').textContent = initials;
  document.getElementById('user-display-name').textContent = u.name;
  document.getElementById('user-role-badge').textContent = u.role;
  document.getElementById('user-badge-line').textContent = `Badge #${u.badge}`;

  // Apply RBAC visibility
  document.getElementById('btn-add-equipment').style.display = u.perms.editEq ? 'inline-flex' : 'none';
  document.getElementById('btn-new-contingency').style.display = u.perms.logIssue ? 'inline-flex' : 'none';
  document.getElementById('btn-create-lab').style.display = u.perms.manageLabs ? 'inline-flex' : 'none';
  document.getElementById('btn-create-staff').style.display = isMaster(u) ? 'inline-flex' : 'none';
}

// ================= 8. BILINGUAL LANGUAGE SWITCHER (RTL / LTR) =================
window.toggleLanguage = function() {
  state.lang = state.lang === 'en' ? 'ar' : 'en';
  const root = document.getElementById('html-root');
  root.setAttribute('lang', state.lang);
  root.setAttribute('dir', state.lang === 'ar' ? 'rtl' : 'ltr');

  document.getElementById('login-lang-btn').textContent = state.lang === 'ar' ? 'English' : 'العربية';
  document.getElementById('header-lang-btn').textContent = state.lang === 'ar' ? 'English' : 'العربية';

  const dict = I18N[state.lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) el.setAttribute('placeholder', dict[key]);
  });

  refreshAllViews();
};

// ================= 9. DASHBOARD KPIs, LAB SELECTOR & INVENTORY TABLE =================
function refreshAllViews() {
  updateKpis();
  renderLabSelectorCards();
  populateManufacturerFilter();
  renderInventory();
  renderContingencyLogs();
  renderStaffAccounts();
  lucide.createIcons();
}

function updateKpis() {
  const filteredByLab = state.selectedLab === 'ALL'
    ? state.inventory
    : state.inventory.filter(item => item.lab === state.selectedLab);

  const totalSystems = filteredByLab.length;
  const totalSubs = filteredByLab.reduce((acc, item) => acc + (item.subs ? item.subs.length : 0), 0);
  const operationalCount = filteredByLab.filter(i => i.status === 'Operational').length;
  const maintCount = filteredByLab.filter(i => i.status === 'Maintenance').length;
  const faultCount = filteredByLab.filter(i => i.status === 'Contingency / Fault').length;

  document.getElementById('kpi-total').textContent = totalSystems;
  document.getElementById('kpi-subs').textContent = totalSubs;
  document.getElementById('kpi-operational').textContent = operationalCount;
  document.getElementById('kpi-maint').textContent = maintCount;
  document.getElementById('kpi-fault').textContent = faultCount;
  document.getElementById('kpi-labs').textContent = state.labs.length;

  document.getElementById('badge-tab-inv').textContent = totalSystems;
  document.getElementById('badge-tab-log').textContent = state.logs.length;
  document.getElementById('badge-tab-staff').textContent = state.users.length;
}

function renderLabSelectorCards() {
  const container = document.getElementById('lab-Zero-cards');
  const totalAllSubs = state.inventory.reduce((s, x) => s + (x.subs?.length || 0), 0);

  let html = `
    <button onclick="selectLabFilter('ALL')" class="text-left rtl:text-right p-3.5 rounded-2xl border transition flex items-center justify-between ${state.selectedLab === 'ALL' ? 'bg-ksau-800 text-white border-ksau-800 shadow-md' : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'}">
      <div>
        <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${state.selectedLab === 'ALL' ? 'bg-ksau-goldbright text-ksau-950' : 'bg-ksau-100 text-ksau-800'}">ALL LABS</span>
        <p class="text-xs font-extrabold mt-1.5">${state.lang === 'ar' ? 'جميع معامل العلاج التنفسي' : 'Combined Skills Labs Inventory'}</p>
        <p class="text-[11px] ${state.selectedLab === 'ALL' ? 'text-emerald-200' : 'text-slate-500'}">${state.inventory.length} Systems • ${totalAllSubs} Sub-Components</p>
      </div>
      <i data-lucide="layers" class="w-5 h-5 ${state.selectedLab === 'ALL' ? 'text-ksau-goldbright' : 'text-slate-400'}"></i>
    </button>
  `;

  state.labs.forEach(lab => {
    const items = state.inventory.filter(i => i.lab === lab.code);
    const subs = items.reduce((s, x) => s + (x.subs?.length || 0), 0);
    const active = state.selectedLab === lab.code;
    html += `
      <button onclick="selectLabFilter('${lab.code}')" class="text-left rtl:text-right p-3.5 rounded-2xl border transition flex items-center justify-between ${active ? 'bg-ksau-800 text-white border-ksau-800 shadow-md' : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'}">
        <div>
          <span class="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full ${active ? 'bg-ksau-goldbright text-ksau-950' : 'bg-emerald-100 text-ksau-800'}">${lab.code}</span>
          <p class="text-xs font-extrabold mt-1.5">${lab.name}</p>
          <p class="text-[11px] ${active ? 'text-emerald-200' : 'text-slate-500'}">${items.length} Systems • ${subs} Sub-Components</p>
        </div>
        <i data-lucide="flask-conical" class="w-5 h-5 ${active ? 'text-ksau-goldbright' : 'text-ksau-600'}"></i>
      </button>
    `;
  });

  container.innerHTML = html;
  lucide.createIcons();
}

window.selectLabFilter = function(labCode) {
  state.selectedLab = labCode;
  refreshAllViews();
};

function populateManufacturerFilter() {
  const sel = document.getElementById('filter-manufacturer');
  const currentVal = sel.value;
  const mfgs = [...new Set(state.inventory.map(i => i.mfg))].sort();
  sel.innerHTML = `<option value="ALL">${state.lang === 'ar' ? 'جميع الشركات المصنعة' : 'All Manufacturers'}</option>` +
    mfgs.map(m => `<option value="${m}">${m}</option>`).join('');
  if (mfgs.includes(currentVal)) sel.value = currentVal;
}

window.resetFilters = function() {
  document.getElementById('search-input').value = '';
  document.getElementById('filter-status').value = 'ALL';
  document.getElementById('filter-manufacturer').value = 'ALL';
  state.selectedLab = 'ALL';
  refreshAllViews();
};

window.toggleExpandAllSubs = function() {
  state.expandAll = !state.expandAll;
  state.inventory.forEach(item => {
    if (item.subs && item.subs.length > 0) {
      state.expandedRows[item.id] = state.expandAll;
    }
  });
  document.getElementById('expand-all-label').textContent = state.expandAll
    ? (state.lang === 'ar' ? 'طي جميع المكونات الفرعية' : 'Collapse All Sub-Components')
    : (state.lang === 'ar' ? 'توسيع جميع المكونات الفرعية' : 'Expand All Sub-Components');
  renderInventory();
};

window.toggleSubRow = function(itemId) {
  state.expandedRows[itemId] = !state.expandedRows[itemId];
  renderInventory();
};

function statusBadgeHtml(status) {
  if (status === 'Operational') {
    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>${state.lang === 'ar' ? 'يعمل بكفاءة' : 'Operational'}</span>`;
  }
  if (status === 'Maintenance') {
    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200"><span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>${state.lang === 'ar' ? 'تحت الصيانة' : 'Maintenance'}</span>`;
  }
  return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>${state.lang === 'ar' ? 'طوارئ / عطل' : 'Contingency / Fault'}</span>`;
}

function getFilteredInventory() {
  const q = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
  const st = document.getElementById('filter-status')?.value || 'ALL';
  const mfg = document.getElementById('filter-manufacturer')?.value || 'ALL';

  return state.inventory.filter(item => {
    if (state.selectedLab !== 'ALL' && item.lab !== state.selectedLab) return false;
    if (st !== 'ALL' && item.status !== st) return false;
    if (mfg !== 'ALL' && item.mfg !== mfg) return false;
    if (!q) return true;

    const matchMain = [item.lab, String(item.sn), item.desc, item.htms, item.ku, item.model, item.mfg]
      .some(v => (v || '').toLowerCase().includes(q));
    const matchSub = (item.subs || []).some(s =>
      [s.desc, s.ku, s.model, s.mfg].some(v => (v || '').toLowerCase().includes(q))
    );
    return matchMain || matchSub;
  });
}

window.renderInventory = function() {
  const tbody = document.getElementById('inventory-tbody');
  const items = getFilteredInventory();
  const canEdit = state.currentUser?.perms?.editEq;
  const canLog = state.currentUser?.perms?.logIssue;

  if (items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="py-12 text-center text-slate-400 font-semibold">
          No matching medical equipment records found.
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  items.forEach(item => {
    const hasSubs = item.subs && item.subs.length > 0;
    const isExpanded = !!state.expandedRows[item.id];

    html += `
      <tr class="hover:bg-slate-50/90 transition">
        <td class="py-3.5 px-4 whitespace-nowrap">
          <span class="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] font-bold text-slate-700 block w-fit">${item.lab}</span>
          <span class="text-[11px] font-extrabold text-ksau-700 mt-0.5 block">SN ${item.sn}</span>
        </td>
        <td class="py-3.5 px-4">
          <div class="font-bold text-slate-900">${item.desc}</div>
          ${hasSubs ? `
            <button onclick="toggleSubRow('${item.id}')" class="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold transition">
              <i data-lucide="${isExpanded ? 'chevron-up' : 'chevron-down'}" class="w-3 h-3"></i>
              <span>${item.subs.length} Sub-Component${item.subs.length > 1 ? 's' : ''} Attached</span>
            </button>
          ` : ''}
        </td>
        <td class="py-3.5 px-4 font-mono font-bold text-slate-800">${item.htms}</td>
        <td class="py-3.5 px-4 font-mono text-slate-700">${item.ku}</td>
        <td class="py-3.5 px-4 font-semibold text-slate-700">${item.model}</td>
        <td class="py-3.5 px-4 text-slate-600">${item.mfg}</td>
        <td class="py-3.5 px-4 whitespace-nowrap">${statusBadgeHtml(item.status)}</td>
        <td class="py-3.5 px-4 text-right rtl:text-left whitespace-nowrap">
          <div class="inline-flex items-center gap-1.5">
            ${canLog ? `
              <button onclick="openContingencyModal('${item.id}')" class="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold transition">
                Log Issue
              </button>
            ` : ''}
            ${canEdit ? `
              <button onclick="openEquipmentModal('${item.id}')" class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition" title="Edit Device">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;

    if (hasSubs && isExpanded) {
      html += `
        <tr class="bg-indigo-50/40">
          <td colspan="8" class="px-6 py-3">
            <div class="rounded-xl bg-white border border-indigo-200/80 p-3 shadow-inner">
              <p class="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 mb-2">
                Attached Sub-Components for ${item.desc} (HTMS #${item.htms})
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                ${item.subs.map((sub, idx) => `
                  <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px]">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-slate-900">${idx + 1}. ${sub.desc}</span>
                      <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">KU: ${sub.ku}</span>
                    </div>
                    <div class="mt-1 text-slate-600 font-mono text-[10px]">
                      Model: <strong>${sub.model}</strong>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </td>
        </tr>
      `;
    }
  });

  tbody.innerHTML = html;
  lucide.createIcons();
};

// ================= 10. TAB SWITCHING, CONTINGENCY LOGS & STAFF ACCOUNTS =================
window.switchMainTab = function(tab) {
  state.activeTab = tab;
  ['inventory', 'contingency', 'staff'].forEach(t => {
    document.getElementById(`view-${t}`).classList.toggle('hidden', t !== tab);
    const btn = document.getElementById(`tab-btn-${t}`);
    if (t === tab) {
      btn.className = 'px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition bg-white text-ksau-800 shadow-sm';
    } else {
      btn.className = 'px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition text-slate-600 hover:text-slate-900';
    }
  });
  lucide.createIcons();
};

function renderContingencyLogs() {
  const container = document.getElementById('contingency-list');
  if (state.logs.length === 0) {
    container.innerHTML = `<div class="bg-white rounded-2xl p-8 text-center text-slate-400 font-bold">No contingency logs recorded.</div>`;
    return;
  }
  container.innerHTML = state.logs.map(log => `
    <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="space-y-1.5 max-w-3xl">
        <div class="flex flex-wrap items-center gap-2">
          <span class="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold">${log.id}</span>
          <span class="px-2 py-0.5 rounded bg-ksau-50 text-ksau-800 border border-ksau-200 font-mono text-[10px] font-bold">${log.lab}</span>
          <span class="text-xs font-mono font-bold text-slate-600">HTMS #${log.htms} • KU #${log.ku}</span>
          ${statusBadgeHtml(log.status)}
        </div>
        <h3 class="text-sm font-extrabold text-slate-900">${log.deviceName}</h3>
        <p class="text-xs text-slate-700"><strong>Observation:</strong> ${log.issue}</p>
        <p class="text-xs text-ksau-800 bg-ksau-50/70 px-3 py-1.5 rounded-lg border border-ksau-200/70"><strong>Action Plan:</strong> ${log.action}</p>
      </div>
      <div class="text-left md:text-right rtl:text-left shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 w-full md:w-auto">
        <p class="text-xs font-bold text-slate-900">${log.engineer}</p>
        <p class="text-[11px] font-mono text-slate-500">Badge #${log.badge}</p>
        <p class="text-[10px] text-slate-400 mt-0.5">${log.timestamp}</p>
      </div>
    </div>
  `).join('');
}

function renderStaffAccounts() {
  const grid = document.getElementById('staff-grid');
  const canManage = isMaster(state.currentUser);
  grid.innerHTML = state.users.map((u, idx) => `
    <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-ksau-700 text-white font-extrabold text-sm flex items-center justify-center">
            ${u.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div>
            <h4 class="text-sm font-extrabold text-slate-900">${u.name}</h4>
            <p class="text-xs text-ksau-700 font-semibold">${u.role}</p>
            ${u.position ? `<p class="text-[11px] text-slate-600">${u.position}</p>` : ''}
            <p class="text-[11px] font-mono text-slate-500">Badge #${u.badge} • User: <strong>${u.username}</strong></p>
          </div>
        </div>
        ${canManage && !isMaster(u) ? `
          <button onclick="deleteStaffAccount(${idx})" class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600" title="Remove Account">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        ` : ''}
      </div>
      <div class="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${u.perms.editEq ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'}">Edit Equipment: ${u.perms.editEq ? 'Yes' : 'No'}</span>
        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${u.perms.logIssue ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'}">Log Issues: ${u.perms.logIssue ? 'Yes' : 'No'}</span>
        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${u.perms.manageLabs ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'}">Create Labs: ${u.perms.manageLabs ? 'Yes' : 'No'}</span>
        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${u.perms.manageUsers ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'}">Manage Staff: ${u.perms.manageUsers ? 'Yes' : 'No'}</span>
      </div>
      ${canManage ? `
        <div class="flex items-center justify-between gap-2 text-[11px]">
          <span class="${u.recoveryHash ? 'text-slate-500' : 'text-amber-700 font-semibold'}">${u.recoveryHash ? 'Recovery code issued' : 'No recovery code yet'}</span>
          <button onclick="issueRecoveryCode(${idx})" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition">${u.recoveryHash ? 'New recovery code' : 'Issue recovery code'}</button>
        </div>
      ` : ''}
    </div>
  `).join('');
  lucide.createIcons();
}

// ================= 11. MODALS: EQUIPMENT, CONTINGENCY, LABS, STAFF =================
window.openEquipmentModal = function(editId = null) {
  const labSelect = document.getElementById('eq-lab');
  labSelect.innerHTML = state.labs.map(l => `<option value="${l.code}">${l.code} — ${l.name}</option>`).join('');
  const subsBox = document.getElementById('eq-subs-container');
  subsBox.innerHTML = '';

  if (editId) {
    const item = state.inventory.find(i => i.id === editId);
    if (!item) return;
    document.getElementById('eq-modal-title').textContent = `Edit Medical Equipment (${item.lab} • SN ${item.sn})`;
    document.getElementById('eq-edit-id').value = item.id;
    document.getElementById('eq-lab').value = item.lab;
    document.getElementById('eq-sn').value = item.sn;
    document.getElementById('eq-status').value = item.status;
    document.getElementById('eq-desc').value = item.desc;
    document.getElementById('eq-htms').value = item.htms;
    document.getElementById('eq-ku').value = item.ku;
    document.getElementById('eq-model').value = item.model;
    document.getElementById('eq-mfg').value = item.mfg;
    (item.subs || []).forEach(s => addSubComponentField(s));
  } else {
    document.getElementById('eq-modal-title').textContent = 'Add New Medical Equipment';
    document.getElementById('eq-edit-id').value = '';
    document.getElementById('equipment-form').reset();
  }
  document.getElementById('equipment-modal').classList.remove('hidden');
};

window.closeEquipmentModal = function() {
  document.getElementById('equipment-modal').classList.add('hidden');
};

window.addSubComponentField = function(sub = { desc: '', ku: 'NA', model: 'NA', mfg: '', serial: 'NA' }) {
  const container = document.getElementById('eq-subs-container');
  const div = document.createElement('div');
  div.className = 'grid grid-cols-1 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 items-center sub-item-row';
  div.innerHTML = `
    <input type="text" placeholder="Sub-component name" value="${sub.desc}" class="sub-desc px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" required />
    <input type="text" placeholder="KU No." value="${sub.ku}" class="sub-ku px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono" />
    <input type="text" placeholder="Model" value="${sub.model}" class="sub-model px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" />
    <input type="hidden" value="${sub.serial ?? 'NA'}" class="sub-serial" />
    <button type="button" onclick="this.parentElement.remove()" class="px-2 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold">Remove</button>
  `;
  container.appendChild(div);
};

window.saveEquipmentItem = async function(e) {
  e.preventDefault();
  const editId = document.getElementById('eq-edit-id').value;
  const mfgVal = document.getElementById('eq-mfg').value.trim();
  const subs = Array.from(document.querySelectorAll('.sub-item-row')).map(row => ({
    desc: row.querySelector('.sub-desc').value.trim(),
    ku: row.querySelector('.sub-ku').value.trim() || 'NA',
    model: row.querySelector('.sub-model').value.trim() || 'NA',
    mfg: mfgVal,
    serial: row.querySelector('.sub-serial').value.trim() || 'NA'
  }));

  const record = {
    id: editId || ('EQ-' + Date.now()),
    lab: document.getElementById('eq-lab').value,
    sn: Number(document.getElementById('eq-sn').value),
    status: document.getElementById('eq-status').value,
    desc: document.getElementById('eq-desc').value.trim(),
    htms: document.getElementById('eq-htms').value.trim(),
    ku: document.getElementById('eq-ku').value.trim(),
    model: document.getElementById('eq-model').value.trim(),
    serial: (editId && state.inventory.find(i => i.id === editId)?.serial) || 'NA',   // kept on file, no longer shown
    mfg: mfgVal,
    subs
  };

  if (editId) {
    const idx = state.inventory.findIndex(i => i.id === editId);
    if (idx > -1) state.inventory[idx] = record;
  } else {
    state.inventory.push(record);
  }

  closeEquipmentModal();
  refreshAllViews();
  await persistState();
  showToast('Medical equipment record saved to Firestore');
};

window.openContingencyModal = function(preselectId = null) {
  const sel = document.getElementById('log-device-id');
  sel.innerHTML = state.inventory.map(item =>
    `<option value="${item.id}">[${item.lab} • SN ${item.sn}] ${item.desc} (HTMS #${item.htms})</option>`
  ).join('');
  if (preselectId) sel.value = preselectId;
  document.getElementById('contingency-modal').classList.remove('hidden');
};

window.closeContingencyModal = function() {
  document.getElementById('contingency-modal').classList.add('hidden');
};

window.saveContingencyIssue = async function(e) {
  e.preventDefault();
  const devId = document.getElementById('log-device-id').value;
  const newStatus = document.getElementById('log-new-status').value;
  const issue = document.getElementById('log-issue').value.trim();
  const action = document.getElementById('log-action').value.trim();

  const item = state.inventory.find(i => i.id === devId);
  if (!item) return;
  item.status = newStatus;

  state.logs.unshift({
    id: 'LOG-' + (100 + state.logs.length + 1),
    deviceId: item.id,
    lab: item.lab,
    htms: item.htms,
    ku: item.ku,
    deviceName: `${item.desc} (${item.model})`,
    status: newStatus,
    issue,
    action,
    engineer: state.currentUser.name,
    badge: state.currentUser.badge,
    timestamp: new Date().toLocaleString()
  });

  document.getElementById('contingency-form').reset();
  closeContingencyModal();
  refreshAllViews();
  await persistState();
  showToast('Contingency log & equipment status synced');
};

window.openLabModal = function() {
  document.getElementById('lab-modal').classList.remove('hidden');
};
window.closeLabModal = function() {
  document.getElementById('lab-modal').classList.add('hidden');
};
window.saveNewLab = async function(e) {
  e.preventDefault();
  const code = document.getElementById('new-lab-code').value.trim().toUpperCase();
  const name = document.getElementById('new-lab-name').value.trim();
  const college = document.getElementById('new-lab-college').value.trim();
  if (!state.labs.some(l => l.code === code)) {
    state.labs.push({ code, name, college, region: 'Central Region' });
  }
  closeLabModal();
  refreshAllViews();
  await persistState();
  showToast(`Laboratory ${code} created & synced`);
};

window.openStaffModal = function() {
  document.getElementById('staff-modal').classList.remove('hidden');
};
window.closeStaffModal = function() {
  document.getElementById('staff-modal').classList.add('hidden');
};
window.saveStaffAccount = async function(e) {
  e.preventDefault();
  if (!isMaster(state.currentUser)) return;
  const username = document.getElementById('staff-user').value.trim();
  const password = document.getElementById('staff-pass').value.trim();
  if (state.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    showToast(`The username "${username}" is already in use`);
    return;
  }
  const newAcc = {
    name: document.getElementById('staff-name').value.trim(),
    badge: document.getElementById('staff-badge').value.trim(),
    username,
    passwordHash: await hashPassword(username, password),
    role: document.getElementById('staff-role').value.trim(),
    perms: {
      editEq: document.getElementById('perm-edit-eq').checked,
      logIssue: document.getElementById('perm-log').checked,
      manageLabs: document.getElementById('perm-labs').checked,
      manageUsers: false
    }
  };
  if (isEngineerAccount(newAcc)) {
    showToast('This portal is for the lab custodian and faculty members only');
    return;
  }
  const code = generateRecoveryCode();
  newAcc.recoveryHash = await hashRecoveryCode(username, code);
  state.users.push(newAcc);
  closeStaffModal();
  refreshAllViews();
  await persistState();
  showToast(`Staff credentials created for ${newAcc.name}`);
  showRecoveryCode(newAcc, code, true);
};

window.deleteStaffAccount = async function(idx) {
  if (!isMaster(state.currentUser) || !state.users[idx] || isMaster(state.users[idx])) return;
  state.users.splice(idx, 1);
  refreshAllViews();
  await persistState();
  showToast('Staff account removed');
};

// ================= 11b. CHANGE MY PASSWORD =================
window.openPasswordModal = function() {
  ['pw-current', 'pw-new', 'pw-confirm'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('pw-error').classList.add('hidden');
  document.getElementById('password-modal').classList.remove('hidden');
  document.getElementById('pw-current').focus();
};
window.closePasswordModal = function() {
  document.getElementById('password-modal').classList.add('hidden');
};
window.saveNewPassword = async function(e) {
  e.preventDefault();
  const me = state.currentUser;
  const err = document.getElementById('pw-error');
  const fail = msg => { err.textContent = msg; err.classList.remove('hidden'); };
  const current = document.getElementById('pw-current').value;
  const next = document.getElementById('pw-new').value;
  if (!me) return;
  if (!(await passwordMatches(me, current))) return fail('Your current password is incorrect.');
  if (next.length < 8) return fail('Use at least 8 characters for the new password.');
  if (next !== document.getElementById('pw-confirm').value) return fail("The new passwords don't match.");
  me.passwordHash = await hashPassword(me.username, next);
  delete me.password;
  closePasswordModal();
  await persistState();
  showToast('Password changed');
};

// ================= 11c. RECOVERY CODES (ISSUED BY THE MASTER ADMINISTRATOR) =================
function showRecoveryCode(acc, code, isNewAccount) {
  document.getElementById('rc-title').textContent = isNewAccount ? `Account created for ${acc.name}` : `New recovery code for ${acc.name}`;
  document.getElementById('rc-user').textContent = acc.username;
  document.getElementById('rc-code').textContent = code;
  document.getElementById('recovery-modal').classList.remove('hidden');
}
window.closeRecoveryModal = function() {
  document.getElementById('recovery-modal').classList.add('hidden');
  document.getElementById('rc-code').textContent = '';
};
window.copyRecoveryCode = function() {
  const text = `Username: ${document.getElementById('rc-user').textContent}\nRecovery code: ${document.getElementById('rc-code').textContent}`;
  navigator.clipboard?.writeText(text).then(() => showToast('Recovery code copied'), () => showToast('Copy failed; select the code and copy it manually'));
};
window.issueRecoveryCode = async function(idx) {
  const acc = state.users[idx];
  if (!isMaster(state.currentUser) || !acc) return;
  const code = generateRecoveryCode();
  acc.recoveryHash = await hashRecoveryCode(acc.username, code);
  refreshAllViews();
  await persistState();
  showRecoveryCode(acc, code, false);
};

// ================= 11d. PASSWORD RESET PAGE (FORGOT PASSWORD) =================
const t = key => (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;
window.showResetPage = function(show = true) {
  document.getElementById('login-form').classList.toggle('hidden', show);
  document.getElementById('reset-form').classList.toggle('hidden', !show);
  document.getElementById('reset-done').classList.add('hidden');
  document.getElementById('reset-error').classList.add('hidden');
  if (show) {
    ['reset-username', 'reset-code', 'reset-new', 'reset-confirm'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('reset-username').value = document.getElementById('login-username').value;
    document.getElementById('reset-username').focus();
    if (location.hash !== '#reset-password') history.replaceState(null, '', '#reset-password');
  } else if (location.hash === '#reset-password') {
    history.replaceState(null, '', location.pathname + location.search);
  }
};
window.submitPasswordReset = async function(e) {
  e.preventDefault();
  const err = document.getElementById('reset-error');
  const fail = key => { err.textContent = t(key); err.classList.remove('hidden'); };
  const username = document.getElementById('reset-username').value.trim();
  const code = document.getElementById('reset-code').value;
  const next = document.getElementById('reset-new').value;
  const acc = state.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  try {
    if (acc && !acc.recoveryHash) return fail('resetNoCode');
    if (!acc || (await hashRecoveryCode(acc.username, code)) !== acc.recoveryHash) return fail('resetWrong');
    if (next.length < 8) return fail('resetShort');
    if (next !== document.getElementById('reset-confirm').value) return fail('resetMismatch');
    acc.passwordHash = await hashPassword(acc.username, next);
    delete acc.password;
    const newCode = generateRecoveryCode();          // each recovery code works once
    acc.recoveryHash = await hashRecoveryCode(acc.username, newCode);
    await persistState();
    err.classList.add('hidden');
    document.getElementById('reset-form').classList.add('hidden');
    document.getElementById('reset-new-code').textContent = newCode;
    document.getElementById('reset-done').classList.remove('hidden');
    document.getElementById('login-username').value = acc.username;
  } catch (ex) {
    console.warn(ex);
    fail('resetWrong');
  }
};
window.finishPasswordReset = function() {
  document.getElementById('reset-new-code').textContent = '';
  showResetPage(false);
  document.getElementById('login-password').focus();
};

// ================= 12. OFFICIAL PRINTABLE REPORT & DIRECT PDF GENERATOR =================
window.openReportModal = function() {
  const sel = document.getElementById('report-lab-select');
  sel.innerHTML = `<option value="ALL">All Labs (${state.labs.map(l => l.code).join(' & ')})</option>` +
    state.labs.map(l => `<option value="${l.code}">Lab ${l.code} — ${l.name}</option>`).join('');
  sel.value = state.selectedLab;
  renderPrintableReportContent();
  renderAllLogos();
  document.getElementById('report-modal').classList.remove('hidden');
  lucide.createIcons();
};

window.closeReportModal = function() {
  document.getElementById('report-modal').classList.add('hidden');
};

window.renderPrintableReportContent = function() {
  const labFilter = document.getElementById('report-lab-select').value;
  const items = labFilter === 'ALL' ? state.inventory : state.inventory.filter(i => i.lab === labFilter);
  const totalSubs = items.reduce((s, x) => s + (x.subs?.length || 0), 0);

  document.getElementById('report-lab-meta').textContent =
    `Lab Scope: ${labFilter === 'ALL' ? 'CM-01-158 & CM-01-162 (All Labs)' : labFilter} • Parent Systems: ${items.length} • Sub-Components: ${totalSubs}`;

  let rowsHtml = '';
  items.forEach(item => {
    rowsHtml += `
      <tr class="border-b border-slate-300 bg-white">
        <td class="py-1.5 px-2 font-mono font-bold text-center border-r border-slate-300">${item.lab}<br/>SN ${item.sn}</td>
        <td class="py-1.5 px-2 font-bold border-r border-slate-300">${item.desc}</td>
        <td class="py-1.5 px-2 font-mono text-center border-r border-slate-300">${item.htms}</td>
        <td class="py-1.5 px-2 font-mono text-center border-r border-slate-300">${item.ku}</td>
        <td class="py-1.5 px-2 border-r border-slate-300">${item.model}</td>
        <td class="py-1.5 px-2 border-r border-slate-300">${item.mfg}</td>
        <td class="py-1.5 px-2 font-bold text-center">${item.status}</td>
      </tr>
    `;
    (item.subs || []).forEach(sub => {
      rowsHtml += `
        <tr class="border-b border-slate-200 bg-slate-50 text-slate-700">
          <td class="py-1 px-2 text-center font-mono text-[10px] border-r border-slate-300">↳ Sub</td>
          <td class="py-1 px-2 pl-5 italic border-r border-slate-300">• ${sub.desc}</td>
          <td class="py-1 px-2 text-center font-mono border-r border-slate-300">—</td>
          <td class="py-1 px-2 text-center font-mono border-r border-slate-300">${sub.ku}</td>
          <td class="py-1 px-2 border-r border-slate-300">${sub.model}</td>
          <td class="py-1 px-2 border-r border-slate-300">${sub.mfg || item.mfg}</td>
          <td class="py-1 px-2 text-center text-[10px]">Attached</td>
        </tr>
      `;
    });
  });

  document.getElementById('report-table-container').innerHTML = `
    <table class="w-full text-[11px] border border-slate-400 border-collapse">
      <thead>
        <tr class="bg-ksau-800 text-white uppercase">
          <th class="py-2 px-2 border border-slate-400">Lab / SN</th>
          <th class="py-2 px-2 border border-slate-400 text-left">Description</th>
          <th class="py-2 px-2 border border-slate-400">HTMS No.</th>
          <th class="py-2 px-2 border border-slate-400">KU No.</th>
          <th class="py-2 px-2 border border-slate-400 text-left">Model</th>
          <th class="py-2 px-2 border border-slate-400 text-left">Manufacturer</th>
          <th class="py-2 px-2 border border-slate-400">Status</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;
};

window.downloadOfficialPdf = async function() {
  const element = document.getElementById('printable-report-area');
  const labFilter = document.getElementById('report-lab-select').value;
  showToast('Generating Official KSAU-HS A4 PDF...');
  const opt = {
    margin: [8, 8, 8, 8],
    filename: `KSAU_HS_HTMS_Inventory_Report_${labFilter}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  };
  await html2pdf().set(opt).from(element).save();
  showToast('Official PDF downloaded');
};

window.triggerSafePrint = function() {
  window.print();
};

// ================= 13. QR CODE MOBILE & DESKTOP ACCESS GENERATOR =================
window.openQrModal = function() {
  const urlInput = document.getElementById('qr-url-input');
  if (!urlInput.value) {
    urlInput.value = window.location.href.startsWith('blob:')
      ? 'https://ksau-hs.edu.sa/htms-inventory-portal'
      : window.location.href;
  }
  renderAllLogos();
  regenerateQrCode();
  document.getElementById('qr-modal').classList.remove('hidden');
};

window.closeQrModal = function() {
  document.getElementById('qr-modal').classList.add('hidden');
};

window.regenerateQrCode = function() {
  const box = document.getElementById('qrcode-box');
  box.innerHTML = '';
  const val = document.getElementById('qr-url-input').value.trim() || 'https://ksau-hs.edu.sa';
  new QRCode(box, {
    text: val,
    width: 170,
    height: 170,
    colorDark: '#052916',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
};

window.copyQrUrl = function() {
  const inp = document.getElementById('qr-url-input');
  inp.select();
  document.execCommand('copy');
  showToast('Portal link copied to clipboard');
};

window.downloadQrDoorCard = async function() {
  const card = document.getElementById('qr-poster-card');
  await html2pdf().set({
    margin: 15,
    filename: 'KSAU_HS_HTMS_Lab_Door_QR_Poster.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(card).save();
  showToast('Lab Door QR Card PDF downloaded');
};

// ================= 14. PRO MULTI-SHEET EXCEL (.XLSX) EXPORT (NO SCIENTIFIC NOTATION) =================
window.exportProExcel = function() {
  const wb = XLSX.utils.book_new();

  function buildStyledSheet(items, sheetTitle) {
    const rows = [
      ['KING SAUD BIN ABDULAZIZ UNIVERSITY FOR HEALTH SCIENCES (KSAU-HS)'],
      ['HEALTHCARE TECHNOLOGY MANAGEMENT SERVICES (HTMS) — CENTRAL REGION'],
      [`MEDICAL EQUIPMENT INVENTORY — ${sheetTitle} (College of Applied Medical Sciences - Male)`],
      [],
      ['Lab Number', 'SN', 'Record Type', 'Description', 'HTMS No.', 'KU No.', 'Model', 'Manufacturer', 'Operational Status']
    ];

    items.forEach(item => {
      rows.push([
        String(item.lab),
        String(item.sn),
        'Parent System',
        String(item.desc),
        String(item.htms),
        String(item.ku),
        String(item.model),
        String(item.mfg),
        String(item.status)
      ]);
      (item.subs || []).forEach(sub => {
        rows.push([
          String(item.lab),
          `${item.sn}-SUB`,
          'Sub-Component',
          `   ↳ ${sub.desc}`,
          'NA',
          String(sub.ku),
          String(sub.model),
          String(sub.mfg || item.mfg),
          'Attached'
        ]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 15 }, { wch: 10 }, { wch: 16 }, { wch: 46 },
      { wch: 16 }, { wch: 16 }, { wch: 24 }, { wch: 28 },
      { wch: 20 }
    ];

    // Force explicit String/Text format ('@') on every cell so long numbers never become 2.012E+10
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) continue;
        ws[addr].t = 's';
        ws[addr].v = String(ws[addr].v ?? '');
        ws[addr].z = '@';

        if (R <= 2) {
          ws[addr].s = {
            font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '0F6838' } }
          };
        } else if (R === 4) {
          ws[addr].s = {
            font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '083F22' } },
            alignment: { horizontal: 'center', vertical: 'center' }
          };
        } else if (R > 4) {
          const isSub = ws[XLSX.utils.encode_cell({ r: R, c: 2 })]?.v === 'Sub-Component';
          ws[addr].s = {
            font: { sz: 10, bold: !isSub, color: { rgb: isSub ? '475569' : '0F172A' } },
            fill: { fgColor: { rgb: isSub ? 'F8FAFC' : 'FFFFFF' } },
            numFmt: '@'
          };
        }
      }
    }
    return ws;
  }

  XLSX.utils.book_append_sheet(wb, buildStyledSheet(state.inventory, 'ALL LABS COMBINED'), 'All Labs Inventory');
  state.labs.forEach(lab => {
    const labItems = state.inventory.filter(i => i.lab === lab.code);
    XLSX.utils.book_append_sheet(wb, buildStyledSheet(labItems, `LAB ${lab.code}`), `Lab ${lab.code}`);
  });

  // Contingency Log Sheet
  const logRows = [
    ['KSAU-HS HTMS CONTINGENCY & CORRECTIVE MAINTENANCE LOGBOOK'],
    [],
    ['Log ID', 'Lab', 'HTMS No.', 'KU No.', 'Device Description', 'Status', 'Observation', 'Contingency Action Plan', 'Recorded By', 'Badge No.', 'Timestamp']
  ];
  state.logs.forEach(l => {
    logRows.push([l.id, l.lab, String(l.htms), String(l.ku), l.deviceName, l.status, l.issue, l.action, l.engineer, String(l.badge), l.timestamp]);
  });
  const wsLogs = XLSX.utils.aoa_to_sheet(logRows);
  wsLogs['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 36 }, { wch: 18 }, { wch: 42 }, { wch: 42 }, { wch: 26 }, { wch: 12 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsLogs, 'Contingency Logs');

  XLSX.writeFile(wb, 'KSAU_HS_HTMS_Official_Inventory_Workbook.xlsx');
  showToast('Formatted Multi-Sheet Excel (.xlsx) exported');
};

function showToast(msg) {
  const box = document.getElementById('toast-box');
  document.getElementById('toast-text').textContent = msg;
  box.classList.remove('hidden');
  setTimeout(() => box.classList.add('hidden'), 3200);
}

// ================= 15. INITIALIZE PORTAL ON LOAD =================
window.addEventListener('DOMContentLoaded', () => {
  renderAllLogos();
  lucide.createIcons();
  initCloudSync();
  if (location.hash === '#reset-password') showResetPage(true);
});
window.addEventListener('hashchange', () => {
  if (location.hash === '#reset-password' && !state.currentUser) showResetPage(true);
});
