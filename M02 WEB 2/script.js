/* ============================================================
   SCRIPT.JS — Interactive Profile Builder
   ============================================================ */

// ============================================================
// FIREBASE
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgV2cMBAwoxetVEgADrqKupNLKUWo1Zas",
  authDomain: "presion-estetica.firebaseapp.com",
  projectId: "presion-estetica",
  storageBucket: "presion-estetica.firebasestorage.app",
  messagingSenderId: "782731336041",
  appId: "1:782731336041:web:e2c3f073c946aac12045f8",
  measurementId: "G-PGFHDW6ZPZ"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

async function saveResponse() {
  try {
    await addDoc(collection(db, "respuestas"), {
      nombre: playerName || "—",
      edad: formAnswers[0] ?? null,
      cambioSegunPlataforma: formAnswers[1] ?? null,
      presionPorLikes: formAnswers[2] ?? null,
      autenticidad: formAnswers[3] ?? null,
      likes,
      seguidores: followers,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Error guardando respuesta:", e);
  }
}

// ============================================================
// STATE
// ============================================================
let state       = 'start';
let likes       = 0;
let followers   = 0;
let playerName  = '';
let formAnswers = [];

// Items: which index is selected per category (null = none)
let selectedItems    = { 0: null, 1: null, 2: null };
let currentCategory  = 0;
let itemsGesturesBound = false;
let interactionCount = 0;

// Mirror
let mirrorTimer = null;

// Form
let formQuestionIndex = 0;

const uiIcons = {
  like: 'interacciones.logos/like.png',
  followers: 'interacciones.logos/seguidores.png',
};

// ============================================================
// DATA
// ============================================================

const categories = [
  {
    label : 'ESTILO',
    items : [
      { img: 'items/pelo1.png', name: 'Casual',    effect: { likes: 5,  followers: 3 } },
      { img: 'items/pelo2.png', name: 'Trendy',    effect: { likes: 20, followers: 10 } },
      { img: 'items/pelo3.png', name: 'Artístico', effect: { likes: 8,  followers: 15 } },
    ],
    avatarApply(idx) { updateAvatarImage(); }
  },
  {
    label : 'ROPA',
    items : [
      { img: 'items/look1.png', name: 'Remera',  effect: { likes: 4,  followers: 2 } },
      { img: 'items/look2.png', name: 'Campera', effect: { likes: 10, followers: 6 } },
      { img: 'items/look3.png', name: 'Especial',effect: { likes: 28, followers: 22, posComments: 5 } },
    ],
    avatarApply(idx) { updateAvatarImage(); }
  },
  {
    label : 'VIBRAS',
    items : [
      { img: 'items/vibe1.png', name: 'Feliz',      effect: { likes: 10, followers: 5 } },
      { img: 'items/vibe2.png', name: 'Intenso',    effect: { likes: 5,  followers: 3, posComments: 3 } },
      { img: 'items/vibe3.png', name: 'Pensativo',  effect: { likes: 3,  followers: 8 } },
    ],
    avatarApply(idx) { updateAvatarImage(); }
  }
];

const mirrorQuestions = [
  '¿Esto eras vos?',
  '¿O lo que funcionaba?',
  '¿Por quién lo hiciste?',
  '¿Valió la pena?',
];

const formQuestions = [
  {
    text  : '¿Cuál es tu edad?',
    left  : '0 años',
    right : '100 años',
  },
  {
    text  : '¿Cuánto sentís que cambiás cómo te mostrás según la plataforma?',
    left  : 'Para nada',
    right : 'Todo el tiempo',
  },
  {
    text  : '¿Cuánta presión sentís por los likes?',
    left  : 'Ninguna',
    right  : 'Muchísima',
  },
  {
    text  : '¿Cuánto de lo que mostrás en redes sos realmente vos?',
    left  : 'Casi nada',
    right : 'Todo',
  },
];

const commentPools = {
  positive: [
    { user: '@diego_92',   text: 'demasiado bueno 💙' },
    { user: '@pixel_8',    text: 'me encanta este look!' },
    { user: '@luna_ok',    text: 'esto es todo ✨' },
    { user: '@pablo.art',  text: 'icónico como siempre' },
    { user: '@mateo.rx',   text: 'subirte siguiendo 🔥' },
    { user: '@camila_mx',  text: 'sos mi inspiración!' },
    { user: '@belen.waves',text: 'hermoso esto 💯' },
    { user: '@mauro_sk',   text: 'sigue así' },
    { user: '@cris_wave',  text: 'el mejor perfil acá' },
    { user: '@sofia.px',   text: 'qué vibra! 🌊' },
    { user: '@tom_creative',text: '¡lo necesitaba ver!' },
    { user: '@alex_digital',text: 'espectacular 🎯' },
    { user: '@vicky_mood', text: 'me enamoré' },
    { user: '@lucas.dev',  text: 'es puro arte' },
    { user: '@nina_vibes', text: 'genio total 👑' },
  ],
  neutral: [
    { user: '@diego_view', text: 'ok' },
    { user: '@anon_view',  text: 'visto' },
    { user: '@lurker_x',   text: '...' },
    { user: '@pablo_view', text: 'pasando' },
    { user: '@grey_sky',   text: 'mmmh' },
    { user: '@camila_95',  text: 'interesante supongo' },
    { user: '@mateo.check',text: 'ah ok' },
    { user: '@belen_idle', text: 'bien' },
    { user: '@mauro.pass', text: 'visto y pasado' },
    { user: '@neutral_n',  text: 'ni fu ni fa' },
    { user: '@alex_meh',   text: 'está ok' },
    { user: '@vicky_see',  text: 'seh' },
    { user: '@lucas_check',text: 'interesante' },
    { user: '@sofia_view', text: 'noté' },
  ],
  negative: [
    { user: '@diego_critic',text: 'qué cringe esto' },
    { user: '@pablo_real', text: 'muy armado todo' },
    { user: '@camila_over',text: 'forzado' },
    { user: '@troll.max',  text: 'cero original' },
    { user: '@mateo.skip', text: 'payasada' },
    { user: '@no_fans',    text: 'aburrido' },
    { user: '@belen_meh',  text: 'ya vi esto mil veces' },
    { user: '@mauro.blunt',text: 'ni me genera nada' },
    { user: '@dark.side',  text: 'qué flojito' },
    { user: '@salty.99',   text: 'paso... 🙄' },
    { user: '@lucas_nope', text: 'no, gracias' },
    { user: '@vicky_pass', text: 'muy básico' },
    { user: '@alex_skip',  text: 'sin interés' },
    { user: '@sofia_nah',  text: 'me aburre' },
  ],
  shortName: [
    { user: '@diego_fast', text: 'es medio corto no?' },
    { user: '@pablo.short',text: 'cortina' },
    { user: '@camila_qmark',text: '¿eso es el nombre?' },
    { user: '@mateo_lol',  text: 'qué nombre tan mini' },
    { user: '@belen_brief',text: 'casi invisible 😅' },
    { user: '@mauro_compact',text: 'nombre express' },
    { user: '@lucas_tiny', text: 'y eso?' },
    { user: '@vicky_smol', text: 'está cortado?' },
    { user: '@alex_short', text: 'corto pero efectivo' },
    { user: '@sofia.min',  text: 'justo justo' },
    { user: '@tom_quick',  text: 'nombre de prisa' },
    { user: '@nina_brief', text: 'al grano' },
  ],
};

// ============================================================
// HELPERS
// ============================================================

// ============================================================
// AVATAR COMPOSITE IMAGE
// ============================================================

function getAvatarSrc() {
  const p = selectedItems[0]; // pelo
  const l = selectedItems[1]; // look
  const v = selectedItems[2]; // vibe

  if (p === null) return 'interacciones.logos/avatar.png';

  const peloIdx = p + 1;
  const lookIdx = l !== null ? l + 1 : null;
  const vibeIdx = v !== null ? v + 1 : null;

  if (lookIdx === null) return `Looks/pelo${peloIdx}.png`;
  if (vibeIdx === null) return `Looks/pelo${peloIdx}_look${lookIdx}.png`;
  return `Looks/pelo${peloIdx}_look${lookIdx}_vibe${vibeIdx}.png`;
}

function updateAvatarImage() {
  const src = getAvatarSrc();
  const main = document.getElementById('avatar-main-img');
  if (main) main.src = src;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function consumeInteractionMultiplier() {
  interactionCount += 1;
  const baseMultiplier = 1.25;
  const growthRate = 1.12;
  return baseMultiplier * Math.pow(growthRate, interactionCount - 1);
}

function scaleMetricDelta(baseDelta, multiplier) {
  if (!baseDelta) return 0;
  const scaled = Math.round(baseDelta * multiplier);
  return clamp(scaled, -6000, 6000);
}

// ============================================================
// STATE MACHINE
// ============================================================

const screens = {
  start      : document.getElementById('screen-start'),
  intro      : document.getElementById('screen-intro'),
  avatar     : document.getElementById('screen-avatar'),
  transition : document.getElementById('screen-transition'),
  mirror     : document.getElementById('screen-mirror'),
  form       : document.getElementById('screen-form'),
  final      : document.getElementById('screen-final'),
  reflection : document.getElementById('screen-reflection'),
};

function goTo(newState, delay = 0) {
  setTimeout(() => {
    // Deactivate current screen(s)
    document.querySelectorAll('.screen.active').forEach(s => {
      s.classList.remove('active');
    });

    state = newState;

    const screen = screens[newState];
    if (!screen) return;

    // Small delay so fade-out plays first
    setTimeout(() => {
      screen.classList.add('active');

      switch (newState) {
        case 'intro':       initIntro();        break;
        case 'avatar':      initAvatarScreen(); break;
        case 'transition':  initTransition();   break;
        case 'mirror':      initMirror();       break;
        case 'form':        initForm();         break;
        case 'final':       initFinal();        break;
        case 'reflection':  initReflection();   break;
        case 'start':  /* nothing extra */      break;
      }
    }, 80);
  }, delay);
}

// ============================================================
// BACKGROUND CANVAS (parallax + floating particles)
// ============================================================

function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');
  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  let mX = W / 2, mY = H / 2;

  // Floating dots
  const dots = Array.from({ length: 45 }, () => ({
    x  : Math.random() * W,
    y  : Math.random() * H,
    r  : Math.random() * 2 + 0.4,
    vx : (Math.random() - 0.5) * 0.28,
    vy : (Math.random() - 0.5) * 0.28,
    op : Math.random() * 0.35 + 0.08,
  }));

  document.addEventListener('mousemove', e => { mX = e.clientX; mY = e.clientY; });
  document.addEventListener('touchmove', e => {
    mX = e.touches[0].clientX; mY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('resize', () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  (function loop() {
    ctx.clearRect(0, 0, W, H);

    // Subtle parallax glow following mouse
    const pX = (mX - W / 2) * 0.04;
    const pY = (mY - H / 2) * 0.04;
    const g  = ctx.createRadialGradient(
      W / 2 + pX, H / 2 + pY, 0,
      W / 2 + pX, H / 2 + pY, Math.max(W, H) * 0.72
    );
    g.addColorStop(0,   'rgba(58,141,255,0.18)');
    g.addColorStop(0.4, 'rgba(31,79,163,0.07)');
    g.addColorStop(1,   'rgba(11,31,58,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Particles
    dots.forEach(d => {
      d.x += d.vx + (mX - W / 2) * 0.00004;
      d.y += d.vy + (mY - H / 2) * 0.00004;
      if (d.x < 0) d.x = W;
      if (d.x > W) d.x = 0;
      if (d.y < 0) d.y = H;
      if (d.y > H) d.y = 0;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${d.op})`;
      ctx.fill();
    });

    requestAnimationFrame(loop);
  })();
}

// Ripple on click anywhere
document.addEventListener('click', e => {
  const rc     = document.getElementById('ripple-container');
  const ripple = document.createElement('div');
  ripple.className = 'ripple';
  const s = 70;
  Object.assign(ripple.style, {
    left   : (e.clientX - s / 2) + 'px',
    top    : (e.clientY - s / 2) + 'px',
    width  : s + 'px',
    height : s + 'px',
  });
  rc.appendChild(ripple);
  setTimeout(() => ripple.remove(), 900);
});

// ============================================================
// START
// ============================================================

function initStart() {
  screens.start.classList.add('active');
}

document.getElementById('btn-start').addEventListener('click', () => {
  goTo('intro');
});

// ============================================================
// INTRO
// ============================================================

function initIntro() {
  // Auto-advance when animation ends (~2.6s)
  setTimeout(() => goTo('avatar'), 3000);
}

// ============================================================
// AVATAR SCREEN
// ============================================================

function initAvatarScreen() {
  currentCategory = 0;
  selectedItems = { 0: null, 1: null, 2: null };
  renderItemsCategory(0);
  initItemsNavigationGestures();
  initNameInput();
  clearComments();
  updateMetricsDisplay(false);
  checkCanAdvance();
}

// ============================================================
// ============================================================
// ITEMS LOGIC
// ============================================================

function renderItemsCategory(catIdx) {
  currentCategory = catIdx;
  const cat   = categories[catIdx];
  const label = document.getElementById('items-label');
  label.textContent = cat.label;

  const sel = selectedItems[catIdx];

  cat.items.forEach((item, i) => {
    const btn = document.getElementById(`item-btn-${i}`);
    if (!btn) return;
    btn.title = item.name;
    btn.className = 'item-btn';
    if (item.img) {
      btn.innerHTML = `<img src="${item.img}" alt="${item.name}" class="item-btn-img"/>`;
    } else {
      btn.textContent = item.name.charAt(0);
    }
    if (sel === i) btn.classList.add('active');
  });

  // Show confirm only if something is selected AND not on last category
  const confirmBtn = document.getElementById('btn-confirm-item');
  const isLastCat  = catIdx === categories.length - 1;
  confirmBtn.style.display = (sel !== null && !isLastCat) ? 'flex' : 'none';
}

function onItemClick(catIdx, itemIdx) {
  const cat  = categories[catIdx];
  const item = cat.items[itemIdx];
  const prev = selectedItems[catIdx];

  let deltaLikes = 0, deltaFollowers = 0;

  // Undo previous selection
  if (prev !== null) {
    deltaLikes     -= cat.items[prev].effect.likes     || 0;
    deltaFollowers -= cat.items[prev].effect.followers || 0;
  }

  selectedItems[catIdx] = itemIdx;
  deltaLikes     += item.effect.likes     || 0;
  deltaFollowers += item.effect.followers || 0;

  const multiplier      = consumeInteractionMultiplier();
  const scaledLikes     = scaleMetricDelta(deltaLikes, multiplier);
  const scaledFollowers = scaleMetricDelta(deltaFollowers, multiplier);
  likes     = Math.max(0, likes + scaledLikes);
  followers = Math.max(0, followers + scaledFollowers);

  shakeAvatar();
  updateAvatarImage();

  spawnParticles('likes-particles',     'like',      clamp(Math.floor(Math.abs(scaledLikes) / 5), 1, 5));
  spawnParticles('followers-particles', 'followers', clamp(Math.floor(Math.abs(scaledFollowers) / 5), 1, 3));
  updateMetricsDisplay(true);
  addInteractionComments(scaledLikes, scaledFollowers);

  renderItemsCategory(catIdx);
  checkCanAdvance();
}

function confirmItemSelection() {
  if (currentCategory < categories.length - 1) {
    renderItemsCategory(currentCategory + 1);
  }
  checkCanAdvance();
}

function checkCanAdvance() {
  const allSelected = selectedItems[0] !== null && selectedItems[1] !== null && selectedItems[2] !== null;
  const hasName     = playerName.trim().length > 0;
  const btn         = document.getElementById('btn-ok-avatar');
  if (!btn) return;

  if (allSelected && hasName) {
    btn.removeAttribute('disabled');
    btn.style.opacity = '1';
    btn.style.pointerEvents = 'auto';
  } else {
    btn.setAttribute('disabled', 'true');
    btn.style.opacity = '0.3';
    btn.style.pointerEvents = 'none';
  }
}

function initItemsNavigationGestures() {} // no-op, ya no se usa

// Item button listeners
document.getElementById('item-btn-0').addEventListener('click', () => onItemClick(currentCategory, 0));
document.getElementById('item-btn-1').addEventListener('click', () => onItemClick(currentCategory, 1));
document.getElementById('item-btn-2').addEventListener('click', () => onItemClick(currentCategory, 2));
document.getElementById('btn-confirm-item').addEventListener('click', confirmItemSelection);

// ============================================================
// AVATAR LOGIC
// ============================================================

function shakeAvatar() {
  const avatar = document.getElementById('avatar-main-img');
  if (!avatar) return;

  avatar.classList.remove('shake');
  void avatar.offsetWidth; // force reflow
  avatar.classList.add('shake');
  setTimeout(() => avatar.classList.remove('shake'), 500);
}

// ============================================================
// METRICS ENGINE
// ============================================================

function updateMetricsDisplay(animate) {
  const likesEl     = document.getElementById('likes-value');
  const followersEl = document.getElementById('followers-value');

  likesEl.textContent     = Math.max(0, likes);
  followersEl.textContent = Math.max(0, followers);

  if (animate) {
    [likesEl, followersEl].forEach(el => {
      el.classList.remove('bounce');
      void el.offsetWidth;
      el.classList.add('bounce');
      setTimeout(() => el.classList.remove('bounce'), 460);
    });
  }
}

function spawnParticles(containerId, iconType, count) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const iconPath = uiIcons[iconType] || null;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.className = 'particle';
      if (iconPath) {
        p.classList.add('particle-image');
        p.innerHTML = `<img src="${iconPath}" alt=""/>`;
      } else {
        p.textContent = iconType;
      }
      p.style.setProperty('--px', ((Math.random() - 0.5) * 44) + 'px');
      p.style.fontSize = (0.72 + Math.random() * 0.4) + 'rem';
      container.appendChild(p);
      setTimeout(() => p.remove(), 1350);
    }, i * 180);
  }
}

// ============================================================
// NAME INPUT LOGIC
// ============================================================

let lastNameLen = 0;
let lastNameValue = '';

const commonNameRoots = Array.from(new Set([
  'diego', 'dieguito', 'diegui', 'pablo', 'pablito', 'pabli', 'mateo', 'matias', 'mati', 'matu',
  'camila', 'cami', 'belen', 'bele', 'mauro', 'mau', 'lucas', 'luca', 'luki', 'vicky',
  'viki', 'victoria', 'alex', 'ale', 'sofia', 'sofi', 'tom', 'tomi', 'tobias', 'tobi',
  'nina', 'juan', 'juanma', 'juani', 'maria', 'mari', 'carlos', 'carlitos', 'carla', 'cande',
  'candela', 'ana', 'ani', 'franco', 'fran', 'sergio', 'luis', 'raul', 'martin', 'marti',
  'jose', 'josefina', 'fer', 'fernando', 'andrea', 'andy', 'clara', 'laura', 'patricia', 'pato',
  'rosa', 'miguel', 'migue', 'fede', 'fefi', 'agus', 'agustin', 'gusti', 'nacho', 'nicolas',
  'nico', 'santi', 'santiago', 'seba', 'sebastian', 'vale', 'valen', 'valentina', 'valentino', 'mili',
  'milagros', 'lu', 'luli', 'julian', 'juli', 'julieta', 'jime', 'jimena', 'emi', 'emilia',
  'emma', 'benja', 'benjamin', 'bruno', 'facu', 'facundo', 'gabi', 'gabriel', 'gabriela', 'ro',
  'romi', 'romina', 'flor', 'florencia', 'mica', 'micaela', 'abril', 'more', 'morena', 'alma',
  'thiago', 'tiago', 'maxi', 'maximo', 'martina', 'martu', 'lola', 'sol', 'agus', 'agos',
  'cami', 'cata', 'catalina', 'joaquin', 'joaco', 'joa', 'gonza', 'gonzalo', 'lautaro', 'lauti',
  'mora', 'morita', 'renata', 'rena', 'bia', 'bianca', 'celeste', 'cele', 'dalma', 'delfi',
  'delfina', 'euge', 'eugenia', 'fran', 'gael', 'ian', 'ivan', 'jero', 'jeronimo', 'juancruz',
  'lucho', 'luciano', 'mano', 'manu', 'manuel', 'marcos', 'marce', 'mel', 'melina', 'naira',
  'nayla', 'niki', 'noe', 'noelia', 'ori', 'oriana', 'pauli', 'paula', 'rami', 'ramiro',
  'samy', 'samira', 'tati', 'tatiana', 'ulises', 'vane', 'vanesa', 'yani', 'yanina', 'zoe',
  'abru', 'abigail', 'anto', 'antonella', 'ariel', 'axi', 'axel', 'bauti', 'bautista', 'ceci',
  'cecilia', 'coni', 'constanza', 'enzo', 'fati', 'fatima', 'feli', 'felipe', 'gi', 'gime',
  'gino', 'guada', 'guadalupe', 'hernan', 'isa', 'isabella', 'jaz', 'jazmin', 'josema', 'kari',
  'karina', 'lean', 'leandro', 'leo', 'leonel', 'liz', 'luciana', 'majo', 'malena', 'mariangeles',
  'mili', 'mire', 'miranda', 'nahi', 'nahuel', 'nati', 'natalia', 'occhi', 'octavio', 'pili',
  'pilar', 'ricky', 'ricardo', 'sasha', 'tino', 'trini', 'trinidad', 'vivi', 'ximena', 'xime'
]));

function normalizeName(value) {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function evaluateNameQuality(name) {
  const raw = normalizeName(name);
  if (!raw) return { score: 0, isCommon: false };

  const lettersOnly = raw.replace(/[^a-z]/g, '');
  const hasDigits = /\d/.test(raw);
  const hasSpecial = /[^a-z0-9]/.test(raw);
  const isLong = raw.length > 9;
  const isVeryLong = raw.length > 14;

  const hasCommonRoot = commonNameRoots.some(root => lettersOnly.includes(root));
  const isCommon = hasCommonRoot;

  let score = 0;

  // Softer evaluation so common and long names are not penalized too aggressively.
  if (isCommon) score += 3;
  else score -= 1;

  if (isLong) score -= 1;
  else score += 1;

  if (isVeryLong) score -= 1;

  if (hasDigits || hasSpecial) {
    // Digits/symbols are valid for common names (e.g., diego.98, 2_fede).
    score += isCommon ? 1 : 0;
  }

  if (!lettersOnly) score -= 1;

  return { score, isCommon };
}

function hasSelectedItems() {
  return Object.values(selectedItems).some(idx => idx !== null);
}

function initNameInput() {
  const input    = document.getElementById('name-input');
  const feedback = document.getElementById('name-feedback');

  input.value = playerName;
  lastNameValue = playerName;

  input.addEventListener('input', () => {
    const val = input.value;
    const prevVal = lastNameValue;
    playerName = val;

    let dL = 0, dF = 0;
    let bias = 0;

    // Si el nombre se borra (prevVal tenía contenido, ahora está vacío)
    if (prevVal.length > 0 && val.length === 0) {
      // Si no hay items seleccionados, resetea todo
      if (!hasSelectedItems()) {
        likes = 0;
        followers = 0;
        clearComments();
        updateMetricsDisplay(true);
        feedback.textContent = '';
        lastNameLen = val.length;
        lastNameValue = val;
        checkCanAdvance();
        return;
      } else {
        // Si hay items, solo limpia comentarios
        clearComments();
        updateMetricsDisplay(true);
        feedback.textContent = '';
        lastNameLen = val.length;
        lastNameValue = val;
        checkCanAdvance();
        return;
      }
    }

    const prevProfile = evaluateNameQuality(prevVal);
    const currProfile = evaluateNameQuality(val);

    // Likes change by quality delta so uncommon/special/too-long names still move counters.
    dL = currProfile.score - prevProfile.score;

    if (dL > 0) bias += currProfile.isCommon ? 2 : 1;
    if (dL < 0) bias -= currProfile.isCommon ? 1 : 2;

    // Followers always increase at least a bit on name edits, with slight variability.
    const baseFollowersFromLikes = Math.round(dL * 0.28);
    const variableFollowersBoost = 1 + Math.floor(Math.random() * 2); // 1..2
    dF = Math.max(baseFollowersFromLikes, 0) + variableFollowersBoost;

    if (dL !== 0 || dF !== 0) {
      // Name edits also follow exponential impact progression.
      const multiplier = consumeInteractionMultiplier();
      dL = scaleMetricDelta(dL, multiplier);
      dF = scaleMetricDelta(dF, multiplier);

      likes = Math.max(0, likes + dL);
      followers = Math.max(0, followers + dF);

      if (dL !== 0) {
        spawnParticles('likes-particles', 'like', clamp(Math.floor(Math.abs(dL) / 5), 1, 5));
      }
      if (dF !== 0) {
        spawnParticles('followers-particles', 'followers', clamp(Math.floor(Math.abs(dF) / 5), 1, 3));
      }

      updateMetricsDisplay(true);
    }

    if (val !== prevVal) addInteractionComments(dL, dF, bias);

    feedback.textContent = '';
    lastNameLen = val.length;
    lastNameValue = val;
    checkCanAdvance();
  });
}

// ============================================================
// COMMENTS ENGINE
// ============================================================

function clearComments() {
  const list = document.getElementById('comments-list');
  if (!list) return;
  list.innerHTML = '';
}

function addInteractionComments(deltaLikes, deltaFollowers, bias = 0) {
  const score = (deltaLikes || 0) + (deltaFollowers || 0) + bias;
  let type = 'neutral';

  // If name is very short, use shortName pool instead
  if (playerName && playerName.length < 4) {
    type = 'shortName';
  } else {
    // Otherwise use score-based pools
    if (score >= 3) type = 'positive';
    else if (score <= -1) type = 'negative';
  }

  const count = clamp(Math.ceil(Math.abs(score) / 14), 1, 2);
  for (let i = 0; i < count; i++) {
    setTimeout(() => addComment(type), i * 220);
  }
}

function addComment(type) {
  const pool = commentPools[type] || commentPools.neutral;
  pushComment(randomFrom(pool), type);
}

function pushComment(comment, type) {
  const list = document.getElementById('comments-list');
  if (!list) return;

  // Age existing
  list.querySelectorAll('.comment').forEach(c => c.classList.add('old'));

  // Trim
  const children = list.querySelectorAll('.comment');
  if (children.length >= 5) children[children.length - 1].remove();

  const div = document.createElement('div');
  div.className = `comment ${type}`;
  div.innerHTML = `<span class="comment-user">${comment.user}</span>${comment.text}`;
  list.insertBefore(div, list.firstChild);
}

// ============================================================
// AVATAR SCREEN — NAV
// ============================================================

document.getElementById('btn-ok-avatar').addEventListener('click', () => {
  goTo('transition');
});

// ============================================================
// TRANSITION SCREEN
// ============================================================

function initTransition() {
  setTimeout(() => goTo('form'), 3200);
}

// ============================================================
// MIRROR FLOW
// ============================================================

function initMirror() {
  // Avatar PNG is rendered directly in mirror and phone sections.

  // Phone stats
  document.getElementById('phone-likes').textContent     = Math.max(0, likes);
  document.getElementById('phone-followers').textContent = Math.max(0, followers);

  const safeName = playerName ? `@${playerName.replace(/\s+/g,'_').slice(0,14)}` : '@usuario';
  document.getElementById('phone-username').textContent = safeName;

  // Phone mini comments
  const mini = document.getElementById('phone-comments-mini');
  if (mini) {
    mini.innerHTML = '';
    [randomFrom(commentPools.positive), randomFrom(commentPools.neutral)].forEach(c => {
      const d = document.createElement('div');
      d.textContent = `${c.user}: ${c.text}`;
      mini.appendChild(d);
    });
  }

  // Show questions
  startMirrorQuestions();

  // Auto-advance after all questions
  const totalMs = mirrorQuestions.length * 3450 + 900;
  mirrorTimer = setTimeout(() => {
    screens.mirror.classList.add('exit-up');
    setTimeout(() => {
      screens.mirror.classList.remove('active', 'exit-up');
      goTo('form');
    }, 620);
  }, totalMs);
}

function startMirrorQuestions() {
  const display = document.getElementById('question-display');
  let idx = 0;

  function showNext() {
    if (idx >= mirrorQuestions.length) return;

    // Replace span so CSS animation re-triggers
    const span = document.createElement('span');
    span.className = 'question-text';
    span.textContent = mirrorQuestions[idx];
    display.innerHTML = '';
    display.appendChild(span);

    idx++;
    setTimeout(showNext, 3450);
  }

  showNext();
}

// ============================================================
// FORM FLOW
// ============================================================

function initForm() {
  formQuestionIndex = 0;
  formAnswers       = [];
  renderFormQuestion();
}

function renderFormQuestion() {
  const q          = formQuestions[formQuestionIndex];
  const counterEl  = document.getElementById('form-counter');
  const questionEl = document.getElementById('form-question');
  const sliderEl   = document.getElementById('form-slider');
  const leftEl     = document.getElementById('slider-left');
  const rightEl    = document.getElementById('slider-right');
  const valueEl    = document.getElementById('form-value');
  const btnEl      = document.getElementById('btn-form-next');

  counterEl.textContent  = `${formQuestionIndex + 1} / ${formQuestions.length}`;
  leftEl.textContent     = q.left;
  rightEl.textContent    = q.right;
  sliderEl.value         = 50;
  valueEl.textContent    = '50';

  const isLast = formQuestionIndex === formQuestions.length - 1;
  btnEl.textContent = isLast ? '→ FINALIZAR' : 'OK →';

  // Animate question in
  questionEl.style.opacity   = '0';
  questionEl.style.transform = 'translateY(22px)';
  questionEl.textContent     = q.text;
  requestAnimationFrame(() => {
    questionEl.style.transition = 'opacity 0.48s ease, transform 0.48s ease';
    questionEl.style.opacity    = '1';
    questionEl.style.transform  = 'translateY(0)';
  });
}

document.getElementById('form-slider').addEventListener('input', e => {
  document.getElementById('form-value').textContent = e.target.value;
});

document.getElementById('btn-form-next').addEventListener('click', () => {
  const val = parseInt(document.getElementById('form-slider').value);
  formAnswers.push(val);

  if (formQuestionIndex < formQuestions.length - 1) {
    formQuestionIndex++;
    renderFormQuestion();
  } else {
    saveResponse();
    goTo('final');
  }
});

// ============================================================
// FINAL / ECO
// ============================================================

function initFinal() {
  const scroll = document.querySelector('.eco-scroll');
  if (scroll) scroll.scrollTop = 0;

  const stack = document.getElementById('eco-avatar-stack');
  const base  = stack.querySelector('.eco-avatar-base');
  if (base) base.src = getAvatarSrc();
}

document.getElementById('btn-go-reflection').addEventListener('click', () => {
  goTo('reflection');
});

// ============================================================
// REFLECTION
// ============================================================

function initReflection() {
  // Bonus aleatorio: entre 20% y 60% extra
  const likesBonus     = Math.floor(likes     * (0.2 + Math.random() * 0.4));
  const followersBonus = Math.floor(followers * (0.2 + Math.random() * 0.4));
  const finalLikes     = Math.max(0, likes)     + likesBonus;
  const finalFollowers = Math.max(0, followers) + followersBonus;

  document.getElementById('final-likes').textContent     = 0;
  document.getElementById('final-followers').textContent = 0;
  document.getElementById('final-name').textContent      = playerName || '—';

  animateCount('final-likes',     finalLikes);
  animateCount('final-followers', finalFollowers);

  const scroll = document.querySelector('.final-scroll');
  if (scroll) scroll.scrollTop = 0;
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el || target === 0) return;
  let current = 0;
  const step  = Math.ceil(target / 60);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 22);
}

document.getElementById('btn-restart').addEventListener('click', () => {
  // Full reset
  likes           = 0;
  followers       = 0;
  playerName      = '';
  formAnswers     = [];
  selectedItems   = { 0: null, 1: null, 2: null };
  currentCategory = 0;
  interactionCount = 0;

  // Reset avatar
  updateAvatarImage();

  if (mirrorTimer) { clearTimeout(mirrorTimer); mirrorTimer = null; }

  goTo('start');
  setTimeout(() => screens.start.classList.add('active'), 160);
});

// ============================================================
// INIT
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
  initBackground();
  initStart();
});
