// ===================== FRESHLINK APP.JS =====================

// ---- APP STATE ----
let currentUser = null; // { name, phone, role }
let currentRole = null;
let selectedLoginRole = 'farmer';
let currentLang = 'en';
let revenueChart = null, cropChart = null, buyerSpendChart = null, buyerCropChart = null;
let currentImageBase64 = null, currentImageMime = null;
let lastAnalysisResult = null, pastAnalyses = [];
let notifications = [];

const DEMO_ACCOUNTS = [
  { name: 'Rajan Kumar', phone: '9876543210', role: 'farmer', icon: '🌾' },
  { name: 'Murugan S',   phone: '9865432100', role: 'farmer', icon: '🌾' },
  { name: 'Priya Retail Hub', phone: '9944332211', role: 'buyer', icon: '🛒' },
  { name: 'Chennai FreshMart', phone: '9944221100', role: 'buyer', icon: '🛒' },
];

const FARMER_PAGES = [
  { id: 'dashboard',    label: 'Dashboard' },
  { id: 'listings',     label: '🌿 Marketplace' },
  { id: 'tracking',     label: '🚚 Tracking' },
  { id: 'payment',      label: '💰 Payments' },
  { id: 'qualitycheck', label: '🤖 AI Quality', ai: true },
];
const BUYER_PAGES = [
  { id: 'buyerdashboard', label: 'Dashboard' },
  { id: 'listings',       label: '🌿 Marketplace' },
  { id: 'tracking',       label: '🚚 Tracking' },
  { id: 'payment',        label: '💰 Payments' },
  { id: 'qualitycheck',   label: '🤖 AI Quality', ai: true },
];

let listings = [
  { id:'FL001', crop:'Tomato',    qty:500, price:12, date:'2025-05-14', location:'Kallakurichi',  quality:'Grade A', notes:'Organically grown, ready for pickup',  status:'transit',   farmer:'Rajan Kumar',  buyer:'Sri Venkateswara Traders', truckPos:45 },
  { id:'FL002', crop:'Onion',     qty:300, price:18, date:'2025-05-15', location:'Cuddalore',     quality:'Grade B', notes:'Fresh harvest',                         status:'available', farmer:'Murugan S',    buyer:null,                       truckPos:0  },
  { id:'FL003', crop:'Banana',    qty:800, price:22, date:'2025-05-12', location:'Villupuram',    quality:'Grade A', notes:'Robusta variety',                       status:'delivered', farmer:'Lakshmi A',    buyer:'Chennai Retail Hub',       truckPos:100},
  { id:'FL004', crop:'Chilli',    qty:200, price:45, date:'2025-05-16', location:'Kallakurichi',  quality:'Grade A', notes:'Guntur variety, high spice',            status:'available', farmer:'Selvam R',     buyer:null,                       truckPos:0  },
];

// ===================== LOGIN =====================
function selectLoginRole(role) {
  selectedLoginRole = role;
  document.getElementById('roleOptFarmer').classList.toggle('active', role === 'farmer');
  document.getElementById('roleOptBuyer').classList.toggle('active', role === 'buyer');
  renderDemoAccounts();
}

function renderDemoAccounts() {
  const grid = document.getElementById('demoGrid');
  const accounts = DEMO_ACCOUNTS.filter(a => a.role === selectedLoginRole);
  grid.innerHTML = accounts.map(a => `
    <button class="demo-btn" onclick="fillDemo('${a.name}','${a.phone}','${a.role}')">
      <span>${a.icon}</span>
      <span>${a.name}</span>
      <span class="demo-role demo-role-${a.role}">${a.role}</span>
    </button>
  `).join('');
}

function fillDemo(name, phone, role) {
  selectedLoginRole = role;
  document.getElementById('loginName').value = name;
  document.getElementById('loginPhone').value = phone;
  document.getElementById('roleOptFarmer').classList.toggle('active', role === 'farmer');
  document.getElementById('roleOptBuyer').classList.toggle('active', role === 'buyer');
  renderDemoAccounts();
}

function doLogin() {
  const name  = document.getElementById('loginName').value.trim();
  const phone = document.getElementById('loginPhone').value.trim();
  if (!name)  { showToast('⚠️ Please enter your name', 'warn'); return; }
  if (!phone || phone.length < 10) { showToast('⚠️ Enter a valid 10-digit phone number', 'warn'); return; }

  currentUser = { name, phone, role: selectedLoginRole };
  currentRole = selectedLoginRole;

  // Bootstrap notifications
  notifications = currentRole === 'farmer'
    ? [
        { id:1, text:'New buyer interested in your Tomatoes!', time:'2m ago', type:'order' },
        { id:2, text:'Tomato price up ₹3/kg in Villupuram mandi', time:'1h ago', type:'alert' },
        { id:3, text:'Payment of ₹17,600 released for Banana delivery', time:'3h ago', type:'payment' },
      ]
    : [
        { id:1, text:'New Tomato batch listed from Kallakurichi — Grade A', time:'5m ago', type:'order' },
        { id:2, text:'Your Banana order is 10km from delivery point', time:'1h ago', type:'order' },
        { id:3, text:'₹6,200 saved vs mandi this month!', time:'Today', type:'alert' },
      ];

  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';

  buildNav();
  updateUserPill();
  updateAIIntro();
  updateBuyerOrderRef();
  goHome();
  initNotifTick();
}

function doLogout() {
  currentUser = null; currentRole = null;
  currentImageBase64 = null; pastAnalyses = [];
  destroyCharts();
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginName').value = '';
  document.getElementById('loginPhone').value = '';
  showToast('👋 Logged out successfully');
}

// ===================== NAV =====================
function buildNav() {
  const pages = currentRole === 'farmer' ? FARMER_PAGES : BUYER_PAGES;
  const tabs = document.getElementById('navTabs');
  tabs.innerHTML = pages.map(p => `
    <button class="nav-tab${p.ai ? ' ai-tab' : ''}" onclick="showPage('${p.id}')">${p.label}</button>
  `).join('');
}

function updateUserPill() {
  const pill = document.getElementById('userPill');
  pill.textContent = (currentRole === 'farmer' ? '🌾 ' : '🛒 ') + currentUser.name.split(' ')[0];
  pill.className = 'user-pill ' + currentRole;
}

function goHome() {
  showPage(currentRole === 'farmer' ? 'dashboard' : 'buyerdashboard');
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');

  const pages = currentRole === 'farmer' ? FARMER_PAGES : BUYER_PAGES;
  document.querySelectorAll('.nav-tab').forEach((tab, i) => {
    tab.classList.toggle('active', pages[i] && pages[i].id === id);
  });

  closeNotifPanel();
  if (id === 'listings')       renderListings(listings);
  if (id === 'tracking')       renderTracking('all');
  if (id === 'payment')        renderPayments();
  if (id === 'dashboard')      initFarmerCharts();
  if (id === 'buyerdashboard') initBuyerCharts();
  if (id === 'qualitycheck')   renderPastAnalyses();
}

// ===================== DARK MODE =====================
function toggleDarkMode() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  document.getElementById('themeBtn').textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('fl_dark', isDark ? '1' : '0');
}

// ===================== LANGUAGE / i18n =====================
const TRANSLATIONS = {
  en: {
    // Nav
    'nav.dashboard':    'Dashboard',
    'nav.marketplace':  '🌿 Marketplace',
    'nav.tracking':     '🚚 Tracking',
    'nav.payments':     '💰 Payments',
    'nav.aiquality':    '🤖 AI Quality',
    // Hero — farmer
    'farmer.hero.title':    'Welcome back, {name} 👋',
    'farmer.hero.sub':      'You have 2 active listings. Tomato prices are up 12% this week in Villupuram mandi.',
    'farmer.stat.earned':   'Earned this month',
    'farmer.stat.listings': 'Active listings',
    'farmer.stat.delivered':'Deliveries done',
    // Hero — buyer
    'buyer.hero.title':     'Welcome back, {name} 👋',
    'buyer.hero.sub':       'Fresh produce from Tamil Nadu farms — directly to you. No middlemen.',
    'buyer.stat.purchased': 'Purchased this month',
    'buyer.stat.orders':    'Active orders',
    'buyer.stat.saved':     'Saved vs mandi',
    // Post harvest form
    'form.title':       'Post Your Harvest',
    'form.crop':        'Crop Name',
    'form.qty':         'Quantity (kg)',
    'form.price':       'Your Price (₹/kg)',
    'form.date':        'Harvest Date',
    'form.location':    'Village / Location',
    'form.quality':     'Quality Grade',
    'form.photo':       'Crop Photo',
    'form.photo.hint':  'Tap to upload a photo of your crop',
    'form.photo.sub':   'JPG, PNG • Max 5MB',
    'form.notes':       'Additional Notes',
    'form.post':        '🚀 Post Listing',
    'form.clear':       'Clear',
    // Marketplace
    'market.title':     '🌿 Marketplace',
    'market.search':    'Search crop...',
    'market.all':       'All Status',
    'market.available': 'Available',
    'market.transit':   'In Transit',
    'market.delivered': 'Delivered',
    'market.accept':    '✅ Accept Deal',
    'market.remove':    '🗑 Remove',
    'market.track':     '🚚 Track',
    'market.aicheck':   '🤖 AI Check',
    // Tracking
    'track.title':      '🚚 Live Order Tracking',
    'track.all':        'All Orders',
    'track.active':     'Active',
    'track.completed':  'Completed',
    'track.confirm':    '✅ Confirm Delivery & Release Payment',
    // Payments
    'pay.title':        '💰 Payments & Escrow',
    'pay.notice':       '🔒 All payments are held in secure escrow. Funds release to the farmer only after the buyer confirms delivery.',
    // AI Quality
    'ai.title':         '🤖 AI Crop Quality Check',
    'ai.powered':       'AI-Powered Quality Check',
    'ai.intro.farmer':  'Upload a photo of your crop. AI will analyse freshness, detect defects, suggest a quality grade, and recommend a fair price.',
    'ai.intro.buyer':   'Upload a photo of received produce to verify quality before confirming delivery and releasing escrow payment.',
    'ai.upload.title':  'Upload Crop Photo',
    'ai.crop.label':    'Crop Type',
    'ai.order.label':   'Linked Order (optional)',
    'ai.drop.title':    'Tap to upload or drag & drop',
    'ai.drop.sub':      'JPG, PNG, WEBP • Max 10MB',
    'ai.btn':           '🔍 Analyse with AI',
    'ai.disclaimer':    'ℹ️ AI analysis is for guidance only. Always do a physical check before finalising.',
    'ai.empty':         'No image analysed yet',
    'ai.empty.sub':     'Upload a crop photo and click Analyse',
    'ai.loading':       'Analysing your crop...',
    'ai.loading.sub':   'Checking freshness, defects, grade & price...',
    // Buyer AI shortcut
    'buyer.ai.title':   'Verify Received Produce with AI',
    'buyer.ai.sub':     'Upload a photo of delivered produce to check quality before confirming & releasing payment',
    // Buyer summary
    'buyer.sum.orders': 'Orders placed this month',
    'buyer.sum.total':  'Total produce bought',
    'buyer.sum.paid':   'Amount paid',
    'buyer.sum.saved':  'Saved vs mandi price',
    'buyer.sum.ontime': 'On-time deliveries',
    // Logout
    'logout': 'Logout',
  },
  ta: {
    'nav.dashboard':    'முகப்பு',
    'nav.marketplace':  '🌿 சந்தை',
    'nav.tracking':     '🚚 கண்காணிப்பு',
    'nav.payments':     '💰 கொடுப்பனவுகள்',
    'nav.aiquality':    '🤖 AI தரம்',
    'farmer.hero.title':    'வணக்கம், {name} 👋',
    'farmer.hero.sub':      'உங்களிடம் 2 செயலில் உள்ள பட்டியல்கள். தக்காளி விலை 12% உயர்ந்துள்ளது.',
    'farmer.stat.earned':   'இந்த மாதம் சம்பாதித்தது',
    'farmer.stat.listings': 'செயலில் உள்ள பட்டியல்கள்',
    'farmer.stat.delivered':'முடிந்த டெலிவரிகள்',
    'buyer.hero.title':     'வணக்கம், {name} 👋',
    'buyer.hero.sub':       'தமிழ்நாட்டு பண்ணைகளிலிருந்து நேரடியாக — தரகர்கள் இல்லாமல்.',
    'buyer.stat.purchased': 'இந்த மாதம் வாங்கியது',
    'buyer.stat.orders':    'செயலில் உள்ள ஆர்டர்கள்',
    'buyer.stat.saved':     'மண்டி விலையில் சேமிப்பு',
    'form.title':       'உங்கள் அறுவடையை பதிவிடுங்கள்',
    'form.crop':        'பயிர் பெயர்',
    'form.qty':         'அளவு (கிலோ)',
    'form.price':       'உங்கள் விலை (₹/கிலோ)',
    'form.date':        'அறுவடை தேதி',
    'form.location':    'கிராமம் / இடம்',
    'form.quality':     'தர வகை',
    'form.photo':       'பயிர் புகைப்படம்',
    'form.photo.hint':  'உங்கள் பயிரின் புகைப்படம் பதிவேற்றவும்',
    'form.photo.sub':   'JPG, PNG • அதிகபட்சம் 5MB',
    'form.notes':       'கூடுதல் குறிப்புகள்',
    'form.post':        '🚀 பட்டியல் போடு',
    'form.clear':       'அழி',
    'market.title':     '🌿 சந்தை',
    'market.search':    'பயிர் தேடு...',
    'market.all':       'அனைத்து நிலை',
    'market.available': 'கிடைக்கும்',
    'market.transit':   'போக்குவரத்தில்',
    'market.delivered': 'வழங்கப்பட்டது',
    'market.accept':    '✅ ஒப்பந்தம் ஏற்கவும்',
    'market.remove':    '🗑 நீக்கு',
    'market.track':     '🚚 கண்காணி',
    'market.aicheck':   '🤖 AI சரிபார்',
    'track.title':      '🚚 நேரடி ஆர்டர் கண்காணிப்பு',
    'track.all':        'அனைத்து ஆர்டர்கள்',
    'track.active':     'செயலில் உள்ளவை',
    'track.completed':  'முடிந்தவை',
    'track.confirm':    '✅ டெலிவரி உறுதிப்படுத்து & பணம் திறக்கவும்',
    'pay.title':        '💰 கொடுப்பனவுகள் & எஸ்க்ரோ',
    'pay.notice':       '🔒 அனைத்து பணமும் பாதுகாப்பான எஸ்க்ரோவில். வாங்குபவர் உறுதிப்படுத்திய பிறகே விவசாயிக்கு பணம்.',
    'ai.title':         '🤖 AI பயிர் தர சரிபார்ப்பு',
    'ai.powered':       'AI தர சோதனை',
    'ai.intro.farmer':  'உங்கள் பயிரின் புகைப்படம் பதிவேற்றவும். AI உடனடியாக தரம், குறைபாடுகள் மற்றும் சந்தை விலை பரிந்துரைக்கும்.',
    'ai.intro.buyer':   'பெறப்பட்ட பொருளின் புகைப்படம் பதிவேற்றி டெலிவரி உறுதிப்படுத்துவதற்கு முன் தரத்தை சரிபார்க்கவும்.',
    'ai.upload.title':  'பயிர் புகைப்படம் பதிவேற்றவும்',
    'ai.crop.label':    'பயிர் வகை',
    'ai.order.label':   'இணைக்கப்பட்ட ஆர்டர் (விரும்பினால்)',
    'ai.drop.title':    'தட்டி பதிவேற்றவும் அல்லது இழுத்து விடவும்',
    'ai.drop.sub':      'JPG, PNG, WEBP • அதிகபட்சம் 10MB',
    'ai.btn':           '🔍 AI உடன் பகுப்பாய்வு செய்',
    'ai.disclaimer':    'ℹ️ AI பகுப்பாய்வு வழிகாட்டுதலுக்காக மட்டுமே.',
    'ai.empty':         'இன்னும் படம் பகுப்பாய்வு செய்யப்படவில்லை',
    'ai.empty.sub':     'பயிர் புகைப்படம் பதிவேற்றி பகுப்பாய்வு செய்யவும்',
    'ai.loading':       'உங்கள் பயிரை பகுப்பாய்வு செய்கிறது...',
    'ai.loading.sub':   'புத்துணர்ச்சி, குறைபாடுகள், தரம் & விலை சரிபார்க்கிறது...',
    'buyer.ai.title':   'AI உடன் பெறப்பட்ட பொருளை சரிபார்க்கவும்',
    'buyer.ai.sub':     'டெலிவரி உறுதிப்படுத்தும் முன் தரத்தை சரிபார்க்க புகைப்படம் பதிவேற்றவும்',
    'buyer.sum.orders': 'இந்த மாதம் ஆர்டர்கள்',
    'buyer.sum.total':  'மொத்த வாங்கிய பொருட்கள்',
    'buyer.sum.paid':   'செலுத்திய தொகை',
    'buyer.sum.saved':  'மண்டி விலையில் சேமிப்பு',
    'buyer.sum.ontime': 'சரியான நேர டெலிவரி',
    'logout': 'வெளியேறு',
  },
  hi: {
    'nav.dashboard':    'डैशबोर्ड',
    'nav.marketplace':  '🌿 बाज़ार',
    'nav.tracking':     '🚚 ट्रैकिंग',
    'nav.payments':     '💰 भुगतान',
    'nav.aiquality':    '🤖 AI गुणवत्ता',
    'farmer.hero.title':    'स्वागत है, {name} 👋',
    'farmer.hero.sub':      'आपकी 2 सक्रिय लिस्टिंग हैं। टमाटर की कीमतें 12% बढ़ी हैं।',
    'farmer.stat.earned':   'इस महीने कमाई',
    'farmer.stat.listings': 'सक्रिय लिस्टिंग',
    'farmer.stat.delivered':'पूर्ण डिलीवरी',
    'buyer.hero.title':     'स्वागत है, {name} 👋',
    'buyer.hero.sub':       'तमिलनाडु के खेतों से सीधे — बिना बिचौलिए के।',
    'buyer.stat.purchased': 'इस महीने खरीदारी',
    'buyer.stat.orders':    'सक्रिय ऑर्डर',
    'buyer.stat.saved':     'मंडी से बचत',
    'form.title':       'अपनी फसल पोस्ट करें',
    'form.crop':        'फसल का नाम',
    'form.qty':         'मात्रा (किलो)',
    'form.price':       'आपकी कीमत (₹/किलो)',
    'form.date':        'कटाई की तारीख',
    'form.location':    'गाँव / स्थान',
    'form.quality':     'गुणवत्ता ग्रेड',
    'form.photo':       'फसल की फोटो',
    'form.photo.hint':  'अपनी फसल की फोटो अपलोड करें',
    'form.photo.sub':   'JPG, PNG • अधिकतम 5MB',
    'form.notes':       'अतिरिक्त नोट्स',
    'form.post':        '🚀 लिस्टिंग पोस्ट करें',
    'form.clear':       'साफ करें',
    'market.title':     '🌿 बाज़ार',
    'market.search':    'फसल खोजें...',
    'market.all':       'सभी स्थिति',
    'market.available': 'उपलब्ध',
    'market.transit':   'पारगमन में',
    'market.delivered': 'डिलीवर हुआ',
    'market.accept':    '✅ सौदा स्वीकार करें',
    'market.remove':    '🗑 हटाएं',
    'market.track':     '🚚 ट्रैक करें',
    'market.aicheck':   '🤖 AI जाँच',
    'track.title':      '🚚 लाइव ऑर्डर ट्रैकिंग',
    'track.all':        'सभी ऑर्डर',
    'track.active':     'सक्रिय',
    'track.completed':  'पूर्ण',
    'track.confirm':    '✅ डिलीवरी की पुष्टि करें & भुगतान जारी करें',
    'pay.title':        '💰 भुगतान और एस्क्रो',
    'pay.notice':       '🔒 सभी भुगतान सुरक्षित एस्क्रो में। खरीदार की पुष्टि के बाद ही किसान को पैसा मिलता है।',
    'ai.title':         '🤖 AI फसल गुणवत्ता जाँच',
    'ai.powered':       'AI गुणवत्ता जाँच',
    'ai.intro.farmer':  'अपनी फसल की फोटो अपलोड करें। AI तुरंत ताज़गी, दोष, ग्रेड और उचित मूल्य सुझाएगा।',
    'ai.intro.buyer':   'प्राप्त उपज की फोटो अपलोड करें और एस्क्रो भुगतान जारी करने से पहले गुणवत्ता सत्यापित करें।',
    'ai.upload.title':  'फसल की फोटो अपलोड करें',
    'ai.crop.label':    'फसल प्रकार',
    'ai.order.label':   'लिंक किया ऑर्डर (वैकल्पिक)',
    'ai.drop.title':    'टैप करें या खींचकर छोड़ें',
    'ai.drop.sub':      'JPG, PNG, WEBP • अधिकतम 10MB',
    'ai.btn':           '🔍 AI से विश्लेषण करें',
    'ai.disclaimer':    'ℹ️ AI विश्लेषण केवल मार्गदर्शन के लिए है।',
    'ai.empty':         'अभी तक कोई छवि विश्लेषण नहीं',
    'ai.empty.sub':     'फसल की फोटो अपलोड करें और विश्लेषण करें',
    'ai.loading':       'आपकी फसल का विश्लेषण हो रहा है...',
    'ai.loading.sub':   'ताज़गी, दोष, ग्रेड और मूल्य जाँच रहा है...',
    'buyer.ai.title':   'AI से प्राप्त उपज सत्यापित करें',
    'buyer.ai.sub':     'डिलीवरी की पुष्टि से पहले गुणवत्ता जाँचने के लिए फोटो अपलोड करें',
    'buyer.sum.orders': 'इस महीने के ऑर्डर',
    'buyer.sum.total':  'कुल खरीदी गई उपज',
    'buyer.sum.paid':   'भुगतान राशि',
    'buyer.sum.saved':  'मंडी मूल्य पर बचत',
    'buyer.sum.ontime': 'समय पर डिलीवरी',
    'logout': 'लॉगआउट',
  }
};

function t(key, vars = {}) {
  const lang = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  let str = lang[key] || TRANSLATIONS.en[key] || key;
  Object.entries(vars).forEach(([k, v]) => { str = str.replace('{' + k + '}', v); });
  return str;
}

function applyLanguage(lang) {
  currentLang = lang;
  // Re-render all dynamic text
  applyI18nToPage();
  showToast('🌐 ' + { en:'English', ta:'தமிழ்', hi:'हिंदी' }[lang]);
}

function applyI18nToPage() {
  const name = currentUser ? currentUser.name.split(' ')[0] : '';
  const role = currentRole;

  // Nav tabs
  buildNav();

  // Hero
  const heroTitle = document.getElementById('heroTitle');
  const heroSub   = document.getElementById('heroSub');
  if (heroTitle) heroTitle.textContent = t('farmer.hero.title', { name });
  if (heroSub)   heroSub.textContent   = t('farmer.hero.sub');

  const buyerHeroTitle = document.getElementById('buyerHeroTitle');
  if (buyerHeroTitle) buyerHeroTitle.textContent = t('buyer.hero.title', { name });

  // Farmer stat labels
  setTextById('stat-earned-lbl',   t('farmer.stat.earned'));
  setTextById('stat-listings-lbl', t('farmer.stat.listings'));
  setTextById('stat-delivered-lbl',t('farmer.stat.delivered'));

  // Buyer stat labels
  setTextById('bstat-purchased-lbl', t('buyer.stat.purchased'));
  setTextById('bstat-orders-lbl',    t('buyer.stat.orders'));
  setTextById('bstat-saved-lbl',     t('buyer.stat.saved'));

  // Post harvest form
  setTextById('form-title-lbl',    t('form.title'));
  setTextById('form-crop-lbl',     t('form.crop'));
  setTextById('form-qty-lbl',      t('form.qty'));
  setTextById('form-price-lbl',    t('form.price'));
  setTextById('form-date-lbl',     t('form.date'));
  setTextById('form-location-lbl', t('form.location'));
  setTextById('form-quality-lbl',  t('form.quality'));
  setTextById('form-photo-lbl',    t('form.photo'));
  setTextById('form-notes-lbl',    t('form.notes'));
  setTextById('form-post-btn',     t('form.post'));
  setTextById('form-clear-btn',    t('form.clear'));
  setAttrById('cropImageUploadHint', 'textContent', t('form.photo.hint'));
  setAttrById('cropImageUploadSub',  'textContent', t('form.photo.sub'));

  // Marketplace
  setTextById('marketplace-title', t('market.title'));
  setAttrById('searchInput', 'placeholder', t('market.search'));

  // Tracking
  setTextById('tracking-title', t('track.title'));
  const trackTabs = document.querySelectorAll('.track-tab-btn');
  const trackLabels = [t('track.all'), t('track.active'), t('track.completed')];
  trackTabs.forEach((btn, i) => { if (trackLabels[i]) btn.textContent = trackLabels[i]; });

  // Payments
  setTextById('payment-title',  t('pay.title'));
  setTextById('payment-notice', t('pay.notice'));

  // AI Quality Check
  setTextById('ai-page-title', t('ai.title'));
  setTextById('ai-powered-lbl', t('ai.powered'));
  const aiSub = document.getElementById('aiIntroSub');
  if (aiSub) aiSub.textContent = t(role === 'buyer' ? 'ai.intro.buyer' : 'ai.intro.farmer');
  setTextById('ai-upload-title', t('ai.upload.title'));
  setTextById('ai-crop-lbl',     t('ai.crop.label'));
  setTextById('ai-order-lbl',    t('ai.order.label'));
  setTextById('drop-title-text', t('ai.drop.title'));
  setTextById('drop-sub-text',   t('ai.drop.sub'));
  setTextById('analyzeBtn',      t('ai.btn'));
  setTextById('ai-empty-title',  t('ai.empty'));
  setTextById('ai-empty-sub',    t('ai.empty.sub'));
  setTextById('ai-loading-text', t('ai.loading'));
  setTextById('ai-loading-sub-text', t('ai.loading.sub'));
  setTextById('ai-disclaimer-text', t('ai.disclaimer'));

  // Buyer AI shortcut
  setTextById('buyer-ai-title', t('buyer.ai.title'));
  setTextById('buyer-ai-sub',   t('buyer.ai.sub'));

  // Buyer summary
  setTextById('bsum-orders', t('buyer.sum.orders'));
  setTextById('bsum-total',  t('buyer.sum.total'));
  setTextById('bsum-paid',   t('buyer.sum.paid'));
  setTextById('bsum-saved',  t('buyer.sum.saved'));
  setTextById('bsum-ontime', t('buyer.sum.ontime'));

  // Logout btn
  setTextById('logout-btn', t('logout'));

  // Re-render dynamic pages if visible
  if (document.getElementById('page-listings').classList.contains('active'))  renderListings(listings);
  if (document.getElementById('page-tracking').classList.contains('active'))  renderTracking('all');
}

function setTextById(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setAttrById(id, attr, val) {
  const el = document.getElementById(id);
  if (el) el[attr] = val;
}

// ===================== NOTIFICATIONS =====================
function toggleNotifPanel() {
  const panel = document.getElementById('notifPanel');
  const open = panel.style.display === 'block';
  panel.style.display = open ? 'none' : 'block';
  if (!open) renderNotifications();
}
function closeNotifPanel() { document.getElementById('notifPanel').style.display = 'none'; }

function renderNotifications() {
  const body = document.getElementById('notifBody');
  if (!notifications.length) { body.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--muted);font-size:13px;">🎉 All caught up!</div>'; return; }
  body.innerHTML = notifications.map(n => `
    <div class="notif-item notif-type-${n.type}">
      <div class="notif-text">${n.text}</div>
      <div class="notif-time">${n.time}</div>
    </div>
  `).join('');
  document.getElementById('notifDot').style.display = notifications.length ? 'block' : 'none';
}

function clearNotifications() {
  notifications = [];
  renderNotifications();
  document.getElementById('notifDot').style.display = 'none';
  showToast('Notifications cleared');
}

function addNotification(text, type) {
  notifications.unshift({ id: Date.now(), text, time: 'just now', type });
  document.getElementById('notifDot').style.display = 'block';
}

function initNotifTick() {
  const farmerMsgs = [
    { text:'🛒 New buyer looking for Onions in your area!', type:'order' },
    { text:'📈 Chilli prices up ₹5/kg in local mandi', type:'alert' },
  ];
  const buyerMsgs = [
    { text:'🌿 New Brinjal batch listed — Grade A, Villupuram', type:'order' },
    { text:'📦 Your Tomato order is being packed for dispatch', type:'order' },
  ];
  setInterval(() => {
    const msgs = currentRole === 'farmer' ? farmerMsgs : buyerMsgs;
    const pick = msgs[Math.floor(Math.random() * msgs.length)];
    addNotification(pick.text, pick.type);
  }, 25000);
}

// ===================== CHARTS =====================
function destroyCharts() {
  [revenueChart, cropChart, buyerSpendChart, buyerCropChart].forEach(c => { if (c) c.destroy(); });
  revenueChart = cropChart = buyerSpendChart = buyerCropChart = null;
}

function chartColors() {
  const isDark = document.body.classList.contains('dark');
  return { grid: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', text: isDark ? '#7a9b84' : '#5a7566' };
}

function initFarmerCharts() {
  if (revenueChart) return;
  const { grid, text } = chartColors();
  revenueChart = new Chart(document.getElementById('revenueChart'), {
    type: 'line',
    data: { labels:['Apr 10','Apr 15','Apr 20','Apr 25','May 1','May 5','May 10'],
      datasets:[{ label:'Revenue (₹)', data:[4200,6800,5200,9100,12400,15800,18500], borderColor:'#2d9b5a', backgroundColor:'rgba(45,155,90,0.1)', tension:0.4, fill:true, pointRadius:4, pointBackgroundColor:'#2d9b5a' }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } },
      scales:{ x:{ grid:{color:grid}, ticks:{color:text,font:{size:11}} }, y:{ grid:{color:grid}, ticks:{color:text,font:{size:11},callback:v=>'₹'+(v/1000).toFixed(0)+'k'} } } }
  });
  cropChart = new Chart(document.getElementById('cropChart'), {
    type: 'doughnut',
    data: { labels:['Tomato','Onion','Banana','Chilli'],
      datasets:[{ data:[35,22,20,13], backgroundColor:['#2d9b5a','#f59e0b','#3b82f6','#ef4444'], borderWidth:0 }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ color:text, font:{size:11}, padding:12 } } } }
  });
}

function initBuyerCharts() {
  if (buyerSpendChart) return;
  const { grid, text } = chartColors();
  buyerSpendChart = new Chart(document.getElementById('buyerSpendChart'), {
    type: 'bar',
    data: { labels:['Apr 10','Apr 15','Apr 20','Apr 25','May 1','May 5','May 10'],
      datasets:[{ label:'Spending (₹)', data:[2100,4500,3200,6100,7800,9200,12400], backgroundColor:'rgba(59,130,246,0.7)', borderRadius:6 }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } },
      scales:{ x:{ grid:{color:grid}, ticks:{color:text,font:{size:11}} }, y:{ grid:{color:grid}, ticks:{color:text,font:{size:11},callback:v=>'₹'+(v/1000).toFixed(0)+'k'} } } }
  });
  buyerCropChart = new Chart(document.getElementById('buyerCropChart'), {
    type: 'doughnut',
    data: { labels:['Tomato','Onion','Banana','Chilli'],
      datasets:[{ data:[40,30,20,10], backgroundColor:['#ef4444','#f59e0b','#f0c040','#22c55e'], borderWidth:0 }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ color:text, font:{size:11}, padding:12 } } } }
  });
}

// ===================== CROP IMAGE MAP =====================
const CROP_IMAGES = {
  'Tomato':    'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&q=80',
  'Onion':     'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80',
  'Banana':    'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80',
  'Chilli':    'https://images.unsplash.com/photo-1526346698789-22fd84314424?w=400&q=80',
  'Potato':    'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80',
  'Brinjal':   'https://images.unsplash.com/photo-1659261200833-ec8761558af7?w=400&q=80',
  'Mango':     'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80',
  'Coconut':   'https://images.unsplash.com/photo-1580984969071-a8da5656c2fb?w=400&q=80',
  'Sugarcane': 'https://images.unsplash.com/photo-1594493581983-41c7b7efde29?w=400&q=80',
};

function getCropImage(l) {
  if (l.customImg) return l.customImg;
  return CROP_IMAGES[l.crop] || `https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80`;
}

// Drag state
let draggedCropUrl = null;
let draggedCropName = null;

function onCardDragStart(e, cropUrl, cropName) {
  draggedCropUrl = cropUrl;
  draggedCropName = cropName;
  e.dataTransfer.effectAllowed = 'copy';
  e.dataTransfer.setData('text/plain', cropUrl);
  // Highlight the drop zone
  document.getElementById('dropZone').classList.add('drag-ready');
  document.getElementById('dropZone').querySelector('.drop-title').textContent = '⬇ Drop here to analyse!';
}

function onCardDragEnd() {
  const dz = document.getElementById('dropZone');
  dz.classList.remove('drag-ready');
  dz.querySelector('.drop-title').textContent = 'Tap to upload or drag & drop';
  draggedCropUrl = null;
  draggedCropName = null;
}

// ===================== LISTINGS =====================
function renderListings(data) {
  const grid = document.getElementById('listingGrid');
  if (!data.length) { grid.innerHTML = '<div class="empty-state"><div class="icon">🌱</div><p>No listings found</p></div>'; return; }
  grid.innerHTML = data.map(l => {
    const imgUrl = getCropImage(l);
    return `
    <div class="listing-card" draggable="true"
      ondragstart="onCardDragStart(event, '${imgUrl}', '${l.crop}')"
      ondragend="onCardDragEnd()">
      <!-- Crop image -->
      <div class="listing-img-wrap">
        <img src="${imgUrl}" alt="${l.crop}" class="listing-img"
          onerror="this.parentElement.innerHTML='<div class=\\'listing-img-placeholder\\'>${getCropEmoji(l.crop)}</div>'">
        <span class="status-badge status-${l.status} listing-img-badge">${statusLabel(l.status)}</span>
        <div class="drag-hint">⠿ Drag to AI Check</div>
      </div>
      <!-- Card body -->
      <div class="listing-body">
        <div class="listing-top">
          <div><div class="crop-name">${l.crop}</div><div class="crop-qty">${l.qty} kg • ${l.quality}</div></div>
        </div>
        <div class="listing-meta">
          <div class="meta-row">📍 <strong>${l.location}</strong></div>
          <div class="meta-row">🗓 <strong>${l.date}</strong></div>
          <div class="meta-row">👤 ${l.farmer}</div>
          ${l.buyer ? `<div class="meta-row">🛒 <strong>${l.buyer}</strong></div>` : ''}
          <div class="meta-row" style="font-size:12px;">📝 ${l.notes}</div>
        </div>
        <div class="listing-price">₹${l.price}/kg <span>Total: ₹${(l.qty*l.price).toLocaleString()}</span></div>
        <div class="listing-actions">
          ${l.status==='available' && currentRole==='buyer'  ? `<button class="btn btn-success btn-sm" onclick="acceptListing('${l.id}')">${t('market.accept')}</button>` : ''}
          ${l.status==='available' && currentRole==='farmer' ? `<button class="btn btn-outline btn-sm" onclick="deleteListing('${l.id}')">${t('market.remove')}</button>` : ''}
          ${l.status==='transit'   ? `<button class="btn btn-outline btn-sm" onclick="showPage('tracking')">${t('market.track')}</button>` : ''}
          ${l.status==='delivered' ? `<span class="btn btn-outline btn-sm" style="color:#16a34a;border-color:#86efac;cursor:default;">✔ Delivered</span>` : ''}
          <button class="btn btn-outline btn-sm ai-check-btn" onclick="sendToAICheck('${imgUrl}','${l.crop}')">${t('market.aicheck')}</button>
        </div>
      </div>
    </div>
  `}).join('');
}

function getCropEmoji(crop) {
  const map = { Tomato:'🍅', Onion:'🧅', Banana:'🍌', Chilli:'🌶️', Potato:'🥔', Brinjal:'🍆', Mango:'🥭', Coconut:'🥥', Sugarcane:'🌿' };
  return map[crop] || '🌾';
}

// Load image URL → base64, then send to AI check page
async function sendToAICheck(imgUrl, cropName) {
  showToast('⏳ Loading image for AI check...');
  try {
    const res  = await fetch(imgUrl);
    const blob = await res.blob();
    const b64  = await blobToBase64(blob);
    currentImageBase64 = b64.split(',')[1];
    currentImageMime   = blob.type || 'image/jpeg';
    // Set crop type selector
    showPage('qualitycheck');
    const sel = document.getElementById('aiCropType');
    for (let i=0; i<sel.options.length; i++) {
      if (sel.options[i].text === cropName) { sel.selectedIndex = i; break; }
    }
    // Show preview
    document.getElementById('imgPreview').src = b64;
    document.getElementById('imgPreviewWrap').style.display = 'block';
    document.getElementById('dropZone').style.display = 'none';
    document.getElementById('analyzeBtn').disabled = false;
    document.getElementById('aiResult').style.display = 'none';
    document.getElementById('aiLoading').style.display = 'none';
    document.getElementById('aiEmpty').style.display = 'none';
    showToast('✅ '+cropName+' image loaded — click Analyse!');
  } catch(e) {
    showToast('⚠️ Could not load image. Try dragging it instead.', 'warn');
  }
}

function blobToBase64(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
}

function statusLabel(s) { return { available:'🟢 Available', transit:'🚛 In Transit', delivered:'✅ Delivered' }[s] || s; }

function filterListings() {
  const q = (document.getElementById('searchInput').value||'').toLowerCase();
  const st = document.getElementById('filterStatus').value;
  renderListings(listings.filter(l => l.crop.toLowerCase().includes(q) && (st===''||l.status===st)));
}

function acceptListing(id) {
  const l = listings.find(x=>x.id===id); if(!l) return;
  l.status='transit'; l.buyer=currentUser.name; l.truckPos=8;
  renderListings(listings);
  addNotification('🚚 Truck dispatched for '+l.crop+' from '+l.location, 'order');
  showToast('🎉 Deal accepted! Truck dispatched for '+l.crop);
  startTruckAnimation(id);
}

function deleteListing(id) {
  listings = listings.filter(x=>x.id!==id);
  renderListings(listings);
  showToast('Listing removed');
}

function postListing() {
  const crop  = document.getElementById('cropName').value;
  const qty   = parseInt(document.getElementById('cropQty').value);
  const price = parseInt(document.getElementById('cropPrice').value);
  const date  = document.getElementById('harvestDate').value || '2025-05-25';
  const loc   = document.getElementById('location').value || 'Unknown';
  const qual  = document.getElementById('quality').value;
  const notes = document.getElementById('notes').value;
  if (!qty||!price) { showToast('⚠️ ' + (currentLang === 'ta' ? 'அளவு மற்றும் விலை நிரப்பவும்!' : currentLang === 'hi' ? 'मात्रा और कीमत भरें!' : 'Please fill quantity and price!'), 'warn'); return; }

  // Grab uploaded harvest image if any
  const harvestImgEl = document.getElementById('harvestImgPreview');
  const customImg = harvestImgEl && harvestImgEl.src && harvestImgEl.src.startsWith('data:') ? harvestImgEl.src : null;

  const id = 'FL'+String(listings.length+100).padStart(3,'0');
  listings.unshift({ id, crop, qty, price, date, location:loc, quality:qual, notes,
    status:'available', farmer:currentUser.name, buyer:null, truckPos:0, customImg });
  addNotification('📦 Your '+crop+' listing is now live!','order');
  showToast('✅ '+crop+' listed! Buyers can now see it.');
  clearForm();
}

function clearForm() {
  ['cropQty','cropPrice','notes'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  // reset harvest image
  const wrap = document.getElementById('harvestImgWrap');
  const drop  = document.getElementById('harvestDropZone');
  if (wrap) wrap.style.display = 'none';
  if (drop) drop.style.display = 'flex';
  harvestImageData = null;
}

// ---- Harvest image upload handlers ----
let harvestImageData = null;

function handleHarvestImageSelect(e) {
  const file = e.target.files[0];
  if (file) loadHarvestImage(file);
}

function handleHarvestDragOver(e) {
  e.preventDefault();
  document.getElementById('harvestDropZone').classList.add('drag-over');
}

function handleHarvestDrop(e) {
  e.preventDefault();
  document.getElementById('harvestDropZone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) loadHarvestImage(file);
}

function loadHarvestImage(file) {
  if (file.size > 5 * 1024 * 1024) { showToast('⚠️ Image too large. Max 5MB.', 'warn'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    harvestImageData = e.target.result;
    document.getElementById('harvestImgPreview').src = harvestImageData;
    document.getElementById('harvestImgWrap').style.display = 'block';
    document.getElementById('harvestDropZone').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function removeHarvestImage() {
  harvestImageData = null;
  document.getElementById('harvestImgPreview').src = '';
  document.getElementById('harvestImgWrap').style.display = 'none';
  document.getElementById('harvestDropZone').style.display = 'flex';
  document.getElementById('harvestImageInput').value = '';
}

// ===================== TRACKING =====================
function renderTracking(filter) {
  const list = document.getElementById('trackingList');
  const data = listings.filter(l=>{
    if(filter==='active')    return l.status==='transit';
    if(filter==='completed') return l.status==='delivered';
    return l.status!=='available';
  });
  if(!data.length){ list.innerHTML='<div class="empty-state"><div class="icon">📦</div><p>No orders to show</p></div>'; return; }
  list.innerHTML = data.map(l => {
    const isDone=l.status==='delivered', isTransit=l.status==='transit';
    return `
      <div class="tracker">
        <div class="tracker-header">
          <div><strong style="font-size:16px;">${l.crop} — ${l.qty} kg</strong><div class="tracker-id">Order #${l.id} • ${l.location} → Chennai</div></div>
          <span class="status-badge status-${l.status}">${statusLabel(l.status)}</span>
        </div>
        <div class="progress-steps">
          <div class="step done"><div class="step-circle">✅</div><div class="step-label">Listed</div></div>
          <div class="step-line done"></div>
          <div class="step done"><div class="step-circle">🤝</div><div class="step-label">Deal Accepted</div></div>
          <div class="step-line ${isTransit||isDone?'done':''}"></div>
          <div class="step ${isTransit?'active':isDone?'done':''}"><div class="step-circle">${isDone?'✅':'🚚'}</div><div class="step-label">In Transit</div></div>
          <div class="step-line ${isDone?'done':''}"></div>
          <div class="step ${isDone?'done':''}"><div class="step-circle">${isDone?'✅':'🏪'}</div><div class="step-label">Delivered</div></div>
          <div class="step-line ${isDone?'done':''}"></div>
          <div class="step ${isDone?'done':''}"><div class="step-circle">${isDone?'✅':'💰'}</div><div class="step-label">Paid</div></div>
        </div>
        <div class="map-mock">
          <div class="map-road"></div>
          <div class="map-pin-start">🌾<div class="map-label">${l.location}</div></div>
          <div class="map-pin-end">🏪<div class="map-label">Chennai</div></div>
          <div class="map-truck" id="truck-${l.id}" style="left:${l.truckPos}%">🚛</div>
        </div>
        ${isTransit ? `
          <div class="info-row" style="margin-bottom:12px;">
            <div class="info-chip"><div class="info-chip-lbl">Driver</div><div class="info-chip-val">Suresh • TN59 AJ 4321</div></div>
            <div class="info-chip amber"><div class="info-chip-lbl">ETA</div><div class="info-chip-val">~3 hours</div></div>
            <div class="info-chip"><div class="info-chip-lbl">Temperature</div><div class="info-chip-val">18°C ✅</div></div>
          </div>
          <button class="btn btn-success btn-sm" onclick="confirmDelivery('${l.id}')">✅ Confirm Delivery &amp; Release Payment</button>
        ` : ''}
        ${isDone ? `<div class="alert alert-success" style="margin-top:1rem;">✅ Delivered &amp; confirmed. ₹${(l.qty*l.price).toLocaleString()} released to ${l.farmer}.</div>` : ''}
      </div>
    `;
  }).join('');
}

function switchTrackTab(filter, btn) {
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderTracking(filter);
}

function confirmDelivery(id) {
  const l = listings.find(x=>x.id===id); if(!l) return;
  l.status='delivered'; l.truckPos=88;
  addNotification('💰 ₹'+(l.qty*l.price).toLocaleString()+' released to '+l.farmer,'payment');
  showToast('💰 Payment of ₹'+(l.qty*l.price).toLocaleString()+' released to '+l.farmer+'!');
  renderTracking('all');
}

function startTruckAnimation(id) {
  const l=listings.find(x=>x.id===id); if(!l) return;
  let pos=8;
  const iv=setInterval(()=>{ pos+=1.5; l.truckPos=pos; const el=document.getElementById('truck-'+id); if(el) el.style.left=pos+'%'; if(pos>=85) clearInterval(iv); },400);
}

// ===================== PAYMENTS =====================
function renderPayments() {
  const list = document.getElementById('paymentList');
  const paid = listings.filter(l=>l.status!=='available');
  if(!paid.length){ list.innerHTML='<div class="empty-state"><div class="icon">💰</div><p>No payment records yet</p></div>'; return; }
  list.innerHTML = paid.map(l=>{
    const total=l.qty*l.price, transport=Math.round(total*0.08), platform=Math.round(total*0.02), farmerGets=total-transport-platform;
    const isPaid=l.status==='delivered';
    return `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:8px;">
          <div><strong style="font-size:16px;">${l.crop} — Order #${l.id}</strong><div style="font-size:13px;color:var(--muted);margin-top:2px;">${l.farmer} → ${l.buyer||'TBD'}</div></div>
          ${!isPaid?`<div class="escrow-pill">🔒 In Escrow</div>`:`<span class="status-badge status-delivered">✅ Paid</span>`}
        </div>
        <div class="summary-row"><div class="lbl">${l.qty} kg × ₹${l.price}/kg</div><div class="val">₹${total.toLocaleString()}</div></div>
        <div class="summary-row"><div class="lbl">Transport fee (8%)</div><div class="val" style="color:var(--red);">−₹${transport.toLocaleString()}</div></div>
        <div class="summary-row"><div class="lbl">Platform fee (2%)</div><div class="val" style="color:var(--red);">−₹${platform.toLocaleString()}</div></div>
        <div class="summary-row"><div class="lbl">💚 Farmer receives</div><div class="val green" style="font-size:18px;">₹${farmerGets.toLocaleString()}</div></div>
        ${isPaid
          ? `<div class="payment-box"><div style="font-size:13px;color:#166534;">Sent to farmer's UPI account</div><div class="payment-amount">₹${farmerGets.toLocaleString()}</div><div class="payment-status">Ref: TXN${l.id}2025 • ${l.date}</div></div>`
          : `<div style="margin-top:1rem;background:var(--amber-light);border:1px solid #fcd34d;border-radius:8px;padding:12px;font-size:13px;color:#854d0e;">🔒 ₹${farmerGets.toLocaleString()} held in escrow. Auto-released on delivery confirmation.</div>`}
      </div>
    `;
  }).join('');
}

// ===================== AI QUALITY CHECK =====================
function updateAIIntro() {
  const el = document.getElementById('aiIntroSub');
  if (!el) return;
  el.textContent = currentRole === 'buyer'
    ? 'Upload a photo of received produce to verify quality before confirming delivery and releasing escrow payment.'
    : 'Upload a photo of your crop. AI will analyse freshness, detect defects, suggest a quality grade, and recommend a fair price.';
}

function updateBuyerOrderRef() {
  const el = document.getElementById('buyerOrderRef');
  if (el) el.style.display = currentRole === 'buyer' ? 'block' : 'none';
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  document.getElementById('dropZone').classList.add('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('dropZone').classList.remove('drag-over');
  document.getElementById('dropZone').classList.remove('drag-ready');

  // Case 1: dragged from marketplace card (URL)
  const url = e.dataTransfer.getData('text/plain');
  if (url && url.startsWith('http') && draggedCropName) {
    sendToAICheck(url, draggedCropName);
    return;
  }

  // Case 2: dragged from file system
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    loadImageFile(file);
    return;
  }

  showToast('⚠️ Please drag a crop image from the Marketplace', 'warn');
}
function handleImageSelect(e) { const f=e.target.files[0]; if(f) loadImageFile(f); }

function loadImageFile(file) {
  if(file.size>10*1024*1024){ showToast('⚠️ Image too large. Max 10MB.','warn'); return; }
  const reader=new FileReader();
  reader.onload=e=>{
    const url=e.target.result;
    currentImageBase64=url.split(',')[1];
    currentImageMime=file.type;
    document.getElementById('imgPreview').src=url;
    document.getElementById('imgPreviewWrap').style.display='block';
    document.getElementById('dropZone').style.display='none';
    document.getElementById('analyzeBtn').disabled=false;
    document.getElementById('aiResult').style.display='none';
    document.getElementById('aiLoading').style.display='none';
    document.getElementById('aiEmpty').style.display='flex';
  };
  reader.readAsDataURL(file);
}

function removeImage() {
  currentImageBase64=null; currentImageMime=null;
  document.getElementById('imgPreviewWrap').style.display='none';
  document.getElementById('dropZone').style.display='block';
  document.getElementById('cropImageInput').value='';
  document.getElementById('analyzeBtn').disabled=true;
  document.getElementById('aiResult').style.display='none';
  document.getElementById('aiLoading').style.display='none';
  document.getElementById('aiEmpty').style.display='flex';
}

async function runAIQualityCheck() {
  if(!currentImageBase64){ showToast('⚠️ Please upload an image first','warn'); return; }
  const cropType = document.getElementById('aiCropType').value;
  const isBuyer  = currentRole === 'buyer';

  document.getElementById('aiEmpty').style.display='none';
  document.getElementById('aiResult').style.display='none';
  document.getElementById('aiLoading').style.display='flex';
  document.getElementById('analyzeBtn').disabled=true;
  document.getElementById('analyzeBtn').textContent='⏳ Analysing...';

  const systemPrompt = isBuyer
    ? `You are an expert agricultural quality inspector AI for FreshLink. A BUYER has received produce and wants to verify quality before releasing escrow payment.
Analyse the image and return ONLY valid JSON:
{"cropDetected":"string","overallScore":number,"grade":"A"|"B"|"C","freshness":number,"color":number,"size":number,"defects":number,"suggestedPrice":number,"priceMin":number,"priceMax":number,"findings":["string","string","string"],"recommendations":["string","string"],"gradeReason":"string","buyerVerdict":"ACCEPT"|"NEGOTIATE"|"REJECT","buyerAdvice":"string (1-2 sentences for the buyer on what to do)"}`
    : `You are an expert agricultural quality inspector AI for FreshLink. A FARMER wants to grade their produce before listing.
Analyse the image and return ONLY valid JSON:
{"cropDetected":"string","overallScore":number,"grade":"A"|"B"|"C","freshness":number,"color":number,"size":number,"defects":number,"suggestedPrice":number,"priceMin":number,"priceMax":number,"findings":["string","string","string"],"recommendations":["string","string"],"gradeReason":"string"}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000, system:systemPrompt,
        messages:[{ role:'user', content:[
          { type:'image', source:{ type:'base64', media_type:currentImageMime, data:currentImageBase64 } },
          { type:'text',  text:`Analyse this ${cropType} crop image for a ${isBuyer?'buyer delivery verification':'farmer pre-listing grade check'}. Return only the JSON.` }
        ]}]
      })
    });
    const data = await res.json();
    const raw  = data.content.map(b=>b.text||'').join('');
    const result = JSON.parse(raw.replace(/```json|```/g,'').trim());
    lastAnalysisResult = { ...result, cropType, role:currentRole, imageBase64:currentImageBase64, timestamp:new Date() };
    pastAnalyses.unshift(lastAnalysisResult);
    renderAIResult(result, cropType);
  } catch(err) {
    // Demo fallback
    const demo = {
      cropDetected:cropType, overallScore:82, grade:'A',
      freshness:88, color:85, size:80, defects:90,
      suggestedPrice:cropType==='Tomato'?14:cropType==='Onion'?20:25,
      priceMin:12, priceMax:16,
      findings:['Good colour uniformity — vibrant and consistent across batch','Minimal surface blemishes — less than 5% affected','Size is uniform and market-ready for Grade A'],
      recommendations:['Store at 12–15°C to maintain freshness for 7 days','Pack in ventilated crates to prevent bruising in transit'],
      gradeReason:'High freshness and low defect rate qualifies this batch for Grade A premium pricing.',
      buyerVerdict:'ACCEPT',
      buyerAdvice:'Quality matches the Grade A claim. Safe to confirm delivery and release escrow payment.'
    };
    lastAnalysisResult = { ...demo, cropType, role:currentRole, imageBase64:currentImageBase64, timestamp:new Date() };
    pastAnalyses.unshift(lastAnalysisResult);
    renderAIResult(demo, cropType);

  } finally {
    document.getElementById('analyzeBtn').disabled=false;
    document.getElementById('analyzeBtn').textContent='🔍 Analyse with AI';
  }
}

function renderAIResult(r, cropType) {
  document.getElementById('aiLoading').style.display='none';
  document.getElementById('aiResult').style.display='block';

  document.getElementById('rCropName').textContent = r.cropDetected||cropType;
  document.getElementById('rTimestamp').textContent = 'Analysed at '+new Date().toLocaleTimeString('en-IN');

  const badge = document.getElementById('rGradeBadge');
  badge.textContent='Grade '+r.grade;
  badge.className='result-grade-badge'+(r.grade==='B'?' grade-b':r.grade==='C'?' grade-c':'');

  document.getElementById('rScore').textContent=r.overallScore+'/100';
  setTimeout(()=>{ document.getElementById('rScoreBar').style.width=r.overallScore+'%'; },100);

  const subs=[{label:'Freshness',val:r.freshness,color:'#2d9b5a'},{label:'Colour',val:r.color,color:'#f59e0b'},{label:'Size Uniformity',val:r.size,color:'#3b82f6'},{label:'Defect-Free',val:r.defects,color:'#8b5cf6'}];
  document.getElementById('rSubScores').innerHTML=subs.map(s=>`
    <div class="sub-score-item">
      <div class="sub-score-label">${s.label}</div>
      <div class="sub-score-bar-bg"><div class="sub-score-bar-fill" style="width:0%;background:${s.color}" data-target="${s.val}"></div></div>
      <div style="font-size:12px;font-weight:600;color:var(--text);text-align:right;margin-top:4px;">${s.val}%</div>
    </div>
  `).join('');
  setTimeout(()=>{ document.querySelectorAll('.sub-score-bar-fill').forEach(el=>{ el.style.width=el.getAttribute('data-target')+'%'; }); },150);

  document.getElementById('rPrice').textContent='₹'+r.suggestedPrice+'/kg';
  document.getElementById('rPriceRange').textContent='Range: ₹'+r.priceMin+' – ₹'+r.priceMax+'/kg';
  document.getElementById('rFindings').innerHTML=(r.findings||[]).map((f,i)=>`<div class="finding-item"><div class="finding-dot ${i===1?'warn':'good'}"></div><span>${f}</span></div>`).join('');
  document.getElementById('rRecommendations').innerHTML=(r.recommendations||[]).map(rec=>`<div class="finding-item"><div class="finding-dot good"></div><span>${rec}</span></div>`).join('');

  // Role-specific action buttons + buyer verdict
  const btns = document.getElementById('aiActionButtons');
  if (currentRole==='buyer') {
    const verdictColor = r.buyerVerdict==='ACCEPT'?'#16a34a':r.buyerVerdict==='REJECT'?'#dc2626':'#d97706';
    const verdictLabel = r.buyerVerdict==='ACCEPT'?'✅ Accept & Release Payment':r.buyerVerdict==='NEGOTIATE'?'🤝 Negotiate Price':'❌ Reject Delivery';
    btns.innerHTML = `
      <div style="width:100%;background:var(--bg);border-radius:var(--radius-sm);padding:12px 14px;margin-bottom:10px;border-left:4px solid ${verdictColor};">
        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">AI Recommendation</div>
        <div style="font-size:13px;color:var(--text);line-height:1.5;">${r.buyerAdvice||'Review findings before confirming delivery.'}</div>
      </div>
      <button class="btn btn-sm" style="background:${verdictColor};color:white;" onclick="showToast('${verdictLabel} action recorded!')">
        ${verdictLabel}
      </button>
      <button class="btn btn-outline btn-sm" onclick="removeImage();document.getElementById('aiResult').style.display='none';document.getElementById('aiEmpty').style.display='flex';">Check Another</button>
    `;
  } else {
    btns.innerHTML=`
      <button class="btn btn-primary btn-sm" onclick="applyGradeToForm()">Apply Grade to Listing Form</button>
      <button class="btn btn-outline btn-sm" onclick="removeImage();document.getElementById('aiResult').style.display='none';document.getElementById('aiEmpty').style.display='flex';">Analyse Another</button>
    `;
  }

  renderPastAnalyses();
}

function applyGradeToForm() {
  if(!lastAnalysisResult) return;
  const map={A:'Grade A (Premium)',B:'Grade B (Standard)',C:'Grade C (Processing)'};
  const qEl=document.getElementById('quality'); const pEl=document.getElementById('cropPrice');
  if(qEl) qEl.value=map[lastAnalysisResult.grade]||'Grade A (Premium)';
  if(pEl) pEl.value=lastAnalysisResult.suggestedPrice;
  showPage('dashboard');
  showToast('✅ Grade & price applied to listing form!');
}

function renderPastAnalyses() {
  const card=document.getElementById('pastAnalysesCard');
  const list=document.getElementById('pastAnalysesList');
  if(!pastAnalyses.length){ if(card) card.style.display='none'; return; }
  if(card) card.style.display='block';
  list.innerHTML=pastAnalyses.map(a=>`
    <div class="past-row">
      ${a.imageBase64?`<img class="past-thumb" src="data:image/jpeg;base64,${a.imageBase64.substring(0,500)}" alt="">`:`<div class="past-thumb-ph">🌿</div>`}
      <div style="flex:1;">
        <div class="past-crop">${a.cropDetected||a.cropType}</div>
        <div class="past-meta">${a.timestamp?new Date(a.timestamp).toLocaleTimeString('en-IN'):''} • Score: ${a.overallScore}/100 • ${a.role==='buyer'?'Buyer Verify':'Farmer Grade'}</div>
      </div>
      <span class="status-badge ${a.grade==='A'?'status-available':a.grade==='B'?'status-transit':'status-delivered'}">Grade ${a.grade}</span>
      <span style="font-family:'DM Mono',monospace;font-size:14px;color:var(--green);font-weight:500;margin-left:8px;">₹${a.suggestedPrice}/kg</span>
    </div>
  `).join('');
}

// ===================== TOAST =====================
let toastTimer;
function showToast(msg, type) {
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.style.background=type==='warn'?'#d97706':type==='error'?'#dc2626':'#1a6b3c';
  t.style.display='block';
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.style.display='none',3200);
}

// ===================== OUTSIDE CLICK =====================
document.addEventListener('click',e=>{
  if(!e.target.closest('#notifPanel')&&!e.target.closest('#notifBtn')) closeNotifPanel();
});

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded',()=>{
  if(localStorage.getItem('fl_dark')==='1'){ document.body.classList.add('dark'); document.getElementById('themeBtn').textContent='☀️'; }
  selectLoginRole('farmer');
  renderDemoAccounts();
  const dEl=document.getElementById('harvestDate');
  if(dEl) dEl.value=new Date(Date.now()+7*86400000).toISOString().split('T')[0];
});
