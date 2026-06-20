import { useState, useEffect, useCallback } from "react";

const API_BASE = "https://disclose-consultancy-playback-ride.trycloudflare.com/api";
const tg = typeof window !== "undefined" && window.Telegram?.WebApp;

function getInitData() {
  if (tg) return tg.initData || "";
  return "";
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-telegram-initdata": getInitData(),
      "ngrok-skip-browser-warning": "true",
      "x-telegram-id": tg?.initDataUnsafe?.user?.id?.toString() || "123456789",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Lỗi ${res.status}`);
  }
  return res.json();
}

const ANIMAL_CONFIG = {
  chicken:      { emoji: "🐔", bg: ["#fff9e6","#ffe082"], border: "#ffb300", name: "Gà" },
  pig:          { emoji: "🐷", bg: ["#fce4ec","#f48fb1"], border: "#e91e63", name: "Heo" },
  rabbit:       { emoji: "🐰", bg: ["#f3e5f5","#ce93d8"], border: "#9c27b0", name: "Thỏ" },
  duck:         { emoji: "🦆", bg: ["#e3f2fd","#90caf9"], border: "#1976d2", name: "Vịt" },
  sheep:        { emoji: "🐑", bg: ["#e8f5e9","#a5d6a7"], border: "#388e3c", name: "Cừu" },
  wild_rabbit:  { emoji: "🐇", bg: ["#fff3e0","#ffcc80"], border: "#ef6c00", name: "Thỏ rừng" },
  cow:          { emoji: "🐄", bg: ["#e8f5e9","#a5d6a7"], border: "#2e7d32", name: "Bò" },
  horse:        { emoji: "🐴", bg: ["#efebe9","#bcaaa4"], border: "#5d4037", name: "Ngựa" },
  goat:         { emoji: "🐐", bg: ["#f1f8e9","#c5e1a5"], border: "#558b2f", name: "Dê" },
  camel:        { emoji: "🦙", bg: ["#fff8e1","#ffe082"], border: "#f9a825", name: "Lạc đà" },
  buffalo:      { emoji: "🐃", bg: ["#e8eaf6","#9fa8da"], border: "#3949ab", name: "Trâu" },
  golden_sheep: { emoji: "🐑", bg: ["#fff8e1","#ffe082"], border: "#f57f17", name: "Cừu vàng" },
  peacock:      { emoji: "🦚", bg: ["#e0f2f1","#80cbc4"], border: "#00695c", name: "Công" },
  unicorn:      { emoji: "🦄", bg: ["#f3e5f5","#ce93d8"], border: "#7b1fa2", name: "Kỳ lân" },
  phoenix:      { emoji: "🦅", bg: ["#fbe9e7","#ff8a65"], border: "#d84315", name: "Phượng hoàng" },
  dragon:       { emoji: "🐉", bg: ["#e8eaf6","#9fa8da"], border: "#1a237e", name: "Rồng" },
};

const TIER_CONFIG = {
  common:    { label: "Thường",      color: "#78909c", bg: "#eceff1" },
  rare:      { label: "Hiếm",        color: "#1565c0", bg: "#e3f2fd" },
  epic:      { label: "Cực hiếm",    color: "#6a1b9a", bg: "#f3e5f5" },
  legendary: { label: "Huyền thoại", color: "#e65100", bg: "#fff3e0" },
};

const PRODUCT_INFO = {
  egg:          { emoji: "🥚", name: "Trứng gà",    needed: 100 },
  pork:         { emoji: "🥩", name: "Thịt heo",    needed: 80  },
  carrot:       { emoji: "🥕", name: "Cà rốt",      needed: 60  },
  duck_egg:     { emoji: "🥚", name: "Trứng vịt",   needed: 90  },
  wool:         { emoji: "🧶", name: "Len cừu",      needed: 70  },
  rabbit_fur:   { emoji: "🪶", name: "Lông thỏ",    needed: 50  },
  milk:         { emoji: "🥛", name: "Sữa bò",       needed: 50  },
  barley:       { emoji: "🌾", name: "Lúa mạch",    needed: 40  },
  goat_milk:    { emoji: "🥛", name: "Sữa dê",       needed: 45  },
  camel_fur:    { emoji: "🪶", name: "Lông lạc đà", needed: 35  },
  buffalo_milk: { emoji: "🥛", name: "Sữa trâu",    needed: 30  },
  golden_wool:  { emoji: "🧶", name: "Len vàng",     needed: 20  },
  feather:      { emoji: "🪶", name: "Lông vũ",      needed: 15  },
  magic:        { emoji: "✨", name: "Phép thuật",   needed: 10  },
  fire:         { emoji: "🔥", name: "Lửa thần",     needed: 8   },
  dragon_gem:   { emoji: "💎", name: "Ngọc rồng",   needed: 5   },
};

const SHOP_ANIMALS = [
  { code: "chicken",      tier: "common",    price: 5000   },
  { code: "pig",          tier: "common",    price: 8000   },
  { code: "rabbit",       tier: "common",    price: 10000  },
  { code: "duck",         tier: "common",    price: 7000   },
  { code: "sheep",        tier: "common",    price: 9000   },
  { code: "wild_rabbit",  tier: "common",    price: 12000  },
  { code: "cow",          tier: "rare",      price: 30000  },
  { code: "horse",        tier: "rare",      price: 35000  },
  { code: "goat",         tier: "rare",      price: 25000  },
  { code: "camel",        tier: "rare",      price: 40000  },
  { code: "buffalo",      tier: "rare",      price: 45000  },
  { code: "golden_sheep", tier: "epic",      price: 150000 },
  { code: "peacock",      tier: "epic",      price: 200000 },
  { code: "unicorn",      tier: "legendary", price: 2000000},
  { code: "phoenix",      tier: "legendary", price: 3000000},
  { code: "dragon",       tier: "legendary", price: 5000000},
];

export default function FarmApp() {
  const [screen, setScreen] = useState("farm");
  const [user, setUser] = useState(null);
  const [farm, setFarm] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const loadUser = useCallback(async () => {
    try { const d = await apiFetch("/users/me"); setUser(d); } catch (e) {}
  }, []);

  const loadFarm = useCallback(async () => {
    try { const d = await apiFetch("/farm"); setFarm(d); } catch (e) {}
  }, []);

  const loadProducts = useCallback(async () => {
    try { const d = await apiFetch("/products"); setProducts(d); } catch (e) {}
  }, []);

  const loadAll = useCallback(() => {
    return Promise.all([loadUser(), loadFarm(), loadProducts()]);
  }, [loadUser, loadFarm, loadProducts]);

  useEffect(() => {
    if (tg) { tg.ready(); tg.expand(); }
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  if (loading) return (
    <div style={S.loading}>
      <div style={{ fontSize: 64 }}>🌾</div>
      <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>Đang tải nông trại...</div>
    </div>
  );

  const NAV = [
    { id: "farm",     icon: "🏡", label: "Trại" },
    { id: "shop",     icon: "🏪", label: "Shop" },
    { id: "products", icon: "🧺", label: "Kho" },
    { id: "referral", icon: "👥", label: "Bạn bè" },
    { id: "wallet",   icon: "💰", label: "Ví" },
  ];

  return (
    <div style={S.app}>
      <header style={S.header}>
        <div style={S.headerTitle}>🌾 Nông Trại</div>
        {user && (
          <div style={S.balances}>
            <span style={S.bal}>🪙 {Number(user.goldBalance).toLocaleString()}</span>
            <span style={{ ...S.bal, background: "rgba(100,200,255,0.3)" }}>💎 {Number(user.gemBalance).toLocaleString()}</span>
          </div>
        )}
      </header>

      <main style={S.main}>
        {screen === "farm"     && <FarmScreen     farm={farm} showToast={showToast} onRefresh={loadAll} />}
        {screen === "shop"     && <ShopScreen     user={user} farm={farm} showToast={showToast} onRefresh={loadAll} />}
        {screen === "products" && <ProductsScreen products={products} user={user} showToast={showToast} onRefresh={loadAll} />}
        {screen === "referral" && <ReferralScreen user={user} showToast={showToast} onRefresh={loadUser} />}
        {screen === "wallet"   && <WalletScreen   user={user} showToast={showToast} onRefresh={loadUser} />}
      </main>

      <nav style={S.nav}>
        {NAV.map(n => (
          <button key={n.id} style={{ ...S.navBtn, ...(screen === n.id ? S.navActive : {}) }} onClick={() => setScreen(n.id)}>
            <div style={{ fontSize: 18 }}>{n.icon}</div>
            <div style={{ fontSize: 9 }}>{n.label}</div>
          </button>
        ))}
      </nav>

      {toast && (
        <div style={{ ...S.toast, background: toast.type === "error" ? "#e53935" : "#43a047" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function FarmScreen({ farm, showToast, onRefresh }) {
  const [busy, setBusy] = useState(null);
  if (!farm) return <Empty icon="🌱" text="Đang tải trang trại..." />;
  const { barns = [], animals = [] } = farm;

  const doCollectAll = async () => {
    if (animals.length === 0) { showToast("Chưa có thú nuôi!", "error"); return; }
    const ids = animals.filter(a => !a.isHungry && (a.pendingProduction || 0) > 0).map(a => a.id);
    if (ids.length === 0) { showToast("Chưa có gì để thu hoạch!"); return; }
    setBusy("all");
    try {
      const r = await apiFetch("/farm/collect", { method: "POST", body: JSON.stringify({ userAnimalIds: ids }) });
      const products = r.productsGained || {};
      const items = Object.entries(products).map(([k, v]) => `${PRODUCT_INFO[k]?.emoji || "📦"} +${v}`).join(" ");
      showToast(items ? `Thu hoạch: ${items} 🎉` : "Chưa có gì!");
      onRefresh();
    } catch (e) { showToast(e.message, "error"); }
    setBusy(null);
  };

  const doFeed = async (id) => {
    setBusy(id + "_f");
    try {
      await apiFetch("/farm/feed", { method: "POST", body: JSON.stringify({ userAnimalId: id }) });
      showToast("Đã cho ăn! 🌾");
      onRefresh();
    } catch (e) { showToast(e.message, "error"); }
    setBusy(null);
  };

  const doCollect = async (id) => {
    setBusy(id + "_c");
    try {
      const r = await apiFetch("/farm/collect", { method: "POST", body: JSON.stringify({ userAnimalIds: [id] }) });
      const products = r.productsGained || {};
      const items = Object.entries(products).map(([k, v]) => `${PRODUCT_INFO[k]?.emoji || "📦"} +${v}`).join(" ");
      showToast(items || "Thu hoạch xong!");
      onRefresh();
    } catch (e) { showToast(e.message, "error"); }
    setBusy(null);
  };

  if (animals.length === 0) return (
    <div>
      <Empty icon="🌱" text="Chưa có thú nuôi" sub="Vào Shop để mua thú!" />
      {barns.length > 0 && (
        <>
          <SectionTitle>Chuồng trại</SectionTitle>
          {barns.map(b => <div key={b.id} style={S.barnRow}><span>🏠 {b.barnType}</span><span style={{ color: "#888", fontSize: 12 }}>{b.slotsUnlocked}/{b.slotsTotal} ô</span></div>)}
        </>
      )}
    </div>
  );

  const hungryCount = animals.filter(a => a.isHungry).length;
  const readyCount = animals.filter(a => !a.isHungry && (a.pendingProduction || 0) > 0).length;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.85)", borderRadius: 12, padding: "8px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 20 }}>🐾</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#333" }}>{animals.length} thú</div>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.85)", borderRadius: 12, padding: "8px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 20 }}>😩</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: hungryCount > 0 ? "#e53935" : "#888" }}>{hungryCount} đói</div>
        </div>
        <div style={{ flex: 2, background: "rgba(255,255,255,0.85)", borderRadius: 12, padding: "8px 12px", textAlign: "center" }}>
          <button style={{ ...S.btnGreen, padding: "4px 0", fontSize: 12, borderRadius: 8 }} onClick={doCollectAll} disabled={!!busy}>
            {busy === "all" ? "..." : `⬇ Thu tất cả (${readyCount})`}
          </button>
        </div>
      </div>

      <div style={S.grid2}>
        {animals.map(a => {
          const cfg = ANIMAL_CONFIG[a.catalogCode] || { emoji: "🐾", bg: ["#f5f5f5","#e0e0e0"], border: "#9e9e9e", name: a.catalogCode };
          const pending = a.pendingProduction || 0;
          const productType = a.productType;
          const pInfo = PRODUCT_INFO[productType];
          return (
            <div key={a.id} style={{ ...S.animalCard, background: `linear-gradient(145deg,${cfg.bg[0]},${cfg.bg[1]})`, borderTop: `3px solid ${cfg.border}`, opacity: a.isHungry ? 0.85 : 1 }}>
              <div style={S.animalEmoji}>{cfg.emoji}</div>
              <div style={S.animalName}>{cfg.name}</div>
              <div style={S.animalLv}>Lv.{a.level}</div>
              {a.isHungry
                ? <div style={S.badgeHungry}>😩 Đói!</div>
                : <div style={S.badgeOk}>{pInfo?.emoji || "📦"} +{pending}</div>
              }
              {a.isHungry
                ? <button style={S.btnOrange} onClick={() => doFeed(a.id)} disabled={!!busy}>{busy === a.id+"_f" ? "..." : "🌾 Cho ăn"}</button>
                : pending > 0
                  ? <button style={S.btnGreen} onClick={() => doCollect(a.id)} disabled={!!busy}>{busy === a.id+"_c" ? "..." : "⬇ Thu"}</button>
                  : <div style={{ fontSize: 10, color: "#aaa", textAlign: "center" }}>Đang sản xuất...</div>
              }
            </div>
          );
        })}
      </div>

      {barns.length > 0 && (
        <>
          <SectionTitle>Chuồng trại</SectionTitle>
          {barns.map(b => <div key={b.id} style={S.barnRow}><span style={{ fontSize: 13 }}>🏠 {b.barnType}</span><span style={{ color: "#888", fontSize: 12 }}>{b.slotsUnlocked}/{b.slotsTotal} ô</span></div>)}
        </>
      )}
    </div>
  );
}

function ShopScreen({ user, farm, showToast, onRefresh }) {
  const [buying, setBuying] = useState(null);
  const [filter, setFilter] = useState("all");

  const handleBuy = async (animal) => {
    const barns = farm?.barns || [];
    if (!barns.length) { showToast("Chưa có chuồng!", "error"); return; }
    const barn = barns[0];
    const usedSlots = (farm?.animals || []).filter(a => a.barnId === barn.id).map(a => a.slotIndex);
    let slot = -1;
    for (let i = 0; i < barn.slotsUnlocked; i++) { if (!usedSlots.includes(i)) { slot = i; break; } }
    if (slot === -1) { showToast("Chuồng đầy! Mở thêm ô.", "error"); return; }
    setBuying(animal.code);
    try {
      await apiFetch("/farm/buy-animal", { method: "POST", body: JSON.stringify({ catalogCode: animal.code, barnId: barn.id, slotIndex: slot }) });
      const cfg = ANIMAL_CONFIG[animal.code];
      showToast(`Đã mua ${cfg?.name || animal.code}! 🎉`);
      onRefresh();
    } catch (e) { showToast(e.message, "error"); }
    setBuying(null);
  };

  const tiers = ["all", "common", "rare", "epic", "legendary"];
  const filtered = filter === "all" ? SHOP_ANIMALS : SHOP_ANIMALS.filter(a => a.tier === filter);

  return (
    <div>
      <SectionTitle>Cửa hàng thú nuôi</SectionTitle>
      {user && <div style={{ fontSize: 13, color: "#555", marginBottom: 8, background: "rgba(255,255,255,0.7)", padding: "6px 10px", borderRadius: 8 }}>🪙 {Number(user.goldBalance).toLocaleString()} xu</div>}
      
      <div style={{ display: "flex", gap: 4, marginBottom: 12, overflowX: "auto" }}>
        {tiers.map(t => (
          <button key={t} style={{ ...S.filterBtn, ...(filter === t ? S.filterActive : {}) }} onClick={() => setFilter(t)}>
            {t === "all" ? "Tất cả" : TIER_CONFIG[t]?.label || t}
          </button>
        ))}
      </div>

      <div style={S.grid2}>
        {filtered.map(a => {
          const cfg = ANIMAL_CONFIG[a.code] || { emoji: "🐾", bg: ["#f5f5f5","#e0e0e0"], border: "#9e9e9e", name: a.code };
          const tier = TIER_CONFIG[a.tier];
          const pType = Object.entries(ANIMAL_CONFIG).find(([k]) => k === a.code)?.[0];
          const pInfo = PRODUCT_INFO[require_product_map(a.code)];
          const canAfford = user && Number(user.goldBalance) >= a.price;
          return (
            <div key={a.code} style={{ ...S.animalCard, background: `linear-gradient(145deg,${cfg.bg[0]},${cfg.bg[1]})`, borderTop: `3px solid ${cfg.border}` }}>
              <div style={S.animalEmoji}>{cfg.emoji}</div>
              <div style={S.animalName}>{cfg.name}</div>
              <div style={{ ...S.tierBadge, background: tier.bg, color: tier.color }}>{tier.label}</div>
              <div style={{ fontSize: 10, color: "#888", margin: "4px 0 8px" }}>
                {get_product_emoji(a.code)} Sản xuất {get_product_name(a.code)}
              </div>
              <button style={{ ...S.btnGreen, opacity: canAfford ? 1 : 0.5 }} onClick={() => handleBuy(a)} disabled={!!buying || !canAfford}>
                {buying === a.code ? "..." : `🪙 ${a.price.toLocaleString()}`}
              </button>
              {!canAfford && <div style={{ fontSize: 10, color: "#e53935", marginTop: 3 }}>Không đủ xu</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function get_product_emoji(code) {
  const map = { chicken:"🥚",pig:"🥩",rabbit:"🥕",duck:"🥚",sheep:"🧶",wild_rabbit:"🪶",cow:"🥛",horse:"🌾",goat:"🥛",camel:"🪶",buffalo:"🥛",golden_sheep:"🧶",peacock:"🪶",unicorn:"✨",phoenix:"🔥",dragon:"💎" };
  return map[code] || "📦";
}
function get_product_name(code) {
  const map = { chicken:"Trứng gà",pig:"Thịt heo",rabbit:"Cà rốt",duck:"Trứng vịt",sheep:"Len cừu",wild_rabbit:"Lông thỏ",cow:"Sữa bò",horse:"Lúa mạch",goat:"Sữa dê",camel:"Lông lạc đà",buffalo:"Sữa trâu",golden_sheep:"Len vàng",peacock:"Lông vũ",unicorn:"Phép thuật",phoenix:"Lửa thần",dragon:"Ngọc rồng" };
  return map[code] || "Sản phẩm";
}
function require_product_map(code) {
  const map = { chicken:"egg",pig:"pork",rabbit:"carrot",duck:"duck_egg",sheep:"wool",wild_rabbit:"rabbit_fur",cow:"milk",horse:"barley",goat:"goat_milk",camel:"camel_fur",buffalo:"buffalo_milk",golden_sheep:"golden_wool",peacock:"feather",unicorn:"magic",phoenix:"fire",dragon:"dragon_gem" };
  return map[code];
}

function ProductsScreen({ products, user, showToast, onRefresh }) {
  const [exchanging, setExchanging] = useState(null);

  const doExchange = async (productType, amount) => {
    setExchanging(productType);
    try {
      const r = await apiFetch("/products/exchange", { method: "POST", body: JSON.stringify({ productType, amount }) });
      showToast(`+${r.gemsReceived} 💎 gem! 🎉`);
      onRefresh();
    } catch (e) { showToast(e.message, "error"); }
    setExchanging(null);
  };

  if (products.length === 0) return (
    <div>
      <Empty icon="🧺" text="Kho trống" sub="Thu hoạch thú để tích sản phẩm!" />
      <div style={{ background: "rgba(255,255,255,0.85)", borderRadius: 14, padding: 14, marginTop: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 10 }}>📋 Tỷ lệ đổi gem</div>
        {Object.entries(PRODUCT_INFO).map(([key, info]) => (
          <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "0.5px solid #f0f0f0", fontSize: 12 }}>
            <span>{info.emoji} {info.name}</span>
            <span style={{ color: "#6a1b9a", fontWeight: 600 }}>{info.needed} → 1 💎</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <SectionTitle>Kho sản phẩm</SectionTitle>
      {user && <div style={{ fontSize: 13, color: "#555", marginBottom: 10, background: "rgba(255,255,255,0.7)", padding: "6px 10px", borderRadius: 8 }}>💎 Gem hiện có: {Number(user.gemBalance).toLocaleString()}</div>}
      
      {products.map(p => {
        const info = PRODUCT_INFO[p.productType] || { emoji: "📦", name: p.productType, needed: 100 };
        const amount = Number(p.amount);
        const canExchange = amount >= info.needed;
        const gemsAvailable = Math.floor(amount / info.needed);
        const progress = Math.min(100, (amount / info.needed) * 100);

        return (
          <div key={p.productType} style={{ ...S.productCard, opacity: canExchange ? 1 : 0.85 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 36 }}>{info.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>{info.name}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                  Có: <b style={{ color: "#333" }}>{amount.toLocaleString()}</b> / Cần: {info.needed} → 1 💎
                </div>
                <div style={{ marginTop: 6, background: "#e0e0e0", borderRadius: 10, height: 6, overflow: "hidden" }}>
                  <div style={{ width: `${progress}%`, background: canExchange ? "#43a047" : "#1976d2", height: "100%", borderRadius: 10, transition: "width 0.3s" }} />
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {canExchange ? (
                  <button style={{ ...S.btnGreen, padding: "6px 12px", width: "auto", borderRadius: 10, fontSize: 12 }} onClick={() => doExchange(p.productType, info.needed * gemsAvailable)} disabled={!!exchanging}>
                    {exchanging === p.productType ? "..." : `Đổi ${gemsAvailable} 💎`}
                  </button>
                ) : (
                  <div style={{ fontSize: 11, color: "#888", textAlign: "center" }}>
                    Còn thiếu<br /><b>{info.needed - amount}</b>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: 14, padding: 12, marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 8 }}>📋 Tỷ lệ đổi tất cả sản phẩm</div>
        {Object.entries(PRODUCT_INFO).map(([key, info]) => (
          <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "0.5px solid #f0f0f0", fontSize: 11, color: "#666" }}>
            <span>{info.emoji} {info.name}</span>
            <span style={{ color: "#6a1b9a", fontWeight: 600 }}>{info.needed} → 1 💎</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReferralScreen({ user, showToast, onRefresh }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);

  const load = async () => {
    try { const d = await apiFetch("/referral/me"); setData(d); } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const doClaim = async (rewardId) => {
    setClaiming(rewardId);
    try {
      await apiFetch(`/referral/claim/${rewardId}`, { method: "POST" });
      showToast("Đã nhận thưởng! 🎁");
      load(); onRefresh();
    } catch (e) { showToast(e.message, "error"); }
    setClaiming(null);
  };

  const copyLink = () => {
    const link = `https://t.me/AnimalsFarmVN_bot?start=ref_${user?.refCode}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    showToast("Đã copy link mời! 📋");
  };

  if (loading) return <Empty icon="👥" text="Đang tải..." />;

  const friends = data?.referredUsers || [];
  const rewards = data?.rewards || [];
  const pendingRewards = rewards.filter(r => !r.claimedAt);
  const totalEarned = data?.totalEarnedGold || "0";

  const MILESTONE_INFO = {
    joined:   { label: "Bạn bè tham gia",  reward: "300,000 xu", icon: "👋" },
    level_10: { label: "Bạn đạt level 10", reward: "500,000 xu", icon: "⭐" },
    level_20: { label: "Bạn đạt level 20", reward: "1,200,000 xu", icon: "🌟" },
    level_30: { label: "Bạn đạt level 30", reward: "3,600,000 xu", icon: "💫" },
  };

  return (
    <div>
      <div style={{ background: "linear-gradient(135deg,#2e7d32,#66bb6a)", borderRadius: 16, padding: 16, marginBottom: 4, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 6 }}>👥</div>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Mời bạn bè kiếm xu!</div>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginBottom: 12 }}>Nhận thưởng khi bạn bè tham gia và lên level</div>
        <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "8px 16px", display: "inline-block", marginBottom: 12 }}>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>Mã mời</div>
          <div style={{ color: "#FFD700", fontSize: 20, fontWeight: 800, letterSpacing: 2 }}>{user?.refCode || "..."}</div>
        </div>
        <br />
        <button style={{ ...S.btnGreen, background: "#FFD700", color: "#4A3500", borderRadius: 20, padding: "8px 20px", width: "auto", fontSize: 13 }} onClick={copyLink}>
          📋 Copy link mời
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 12, marginBottom: 4 }}>
        <div style={{ ...S.statCard, background: "rgba(255,255,255,0.85)" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#2e7d32" }}>{friends.length}</div>
          <div style={{ fontSize: 11, color: "#555" }}>Bạn bè</div>
        </div>
        <div style={{ ...S.statCard, background: "rgba(255,255,255,0.85)" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#b8860b" }}>{pendingRewards.length}</div>
          <div style={{ fontSize: 11, color: "#555" }}>Chờ nhận</div>
        </div>
        <div style={{ ...S.statCard, background: "rgba(255,255,255,0.85)" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#6a1b9a" }}>{(Number(totalEarned)/1000).toFixed(0)}K</div>
          <div style={{ fontSize: 11, color: "#555" }}>Đã kiếm</div>
        </div>
      </div>

      {pendingRewards.length > 0 && (
        <>
          <SectionTitle>Thưởng chờ nhận</SectionTitle>
          {pendingRewards.map(r => (
            <div key={r.id} style={S.taskCard}>
              <div style={S.taskLeft}>
                <div style={S.taskIcon}>{MILESTONE_INFO[r.milestone]?.icon || "🎁"}</div>
                <div>
                  <div style={S.taskTitle}>{MILESTONE_INFO[r.milestone]?.label || r.milestone}</div>
                  <div style={S.taskSub}>🪙 {Number(r.rewardGold).toLocaleString()} xu</div>
                </div>
              </div>
              <button style={S.btnSmallGreen} onClick={() => doClaim(r.id)} disabled={!!claiming}>
                {claiming === r.id ? "..." : "Nhận"}
              </button>
            </div>
          ))}
        </>
      )}

      <SectionTitle>Mốc thưởng</SectionTitle>
      {Object.entries(MILESTONE_INFO).map(([key, info]) => (
        <div key={key} style={{ background: "rgba(255,255,255,0.85)", borderRadius: 12, padding: "10px 14px", marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 24 }}>{info.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{info.label}</div>
            <div style={{ fontSize: 11, color: "#888" }}>🪙 {info.reward}</div>
          </div>
        </div>
      ))}

      {friends.length > 0 && (
        <>
          <SectionTitle>Bạn bè ({friends.length})</SectionTitle>
          {friends.map(f => (
            <div key={f.id} style={S.taskCard}>
              <div style={S.taskLeft}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👤</div>
                <div>
                  <div style={S.taskTitle}>{f.fullName || f.username || "Nông dân"}</div>
                  <div style={S.taskSub}>Level {f.level}</div>
                </div>
              </div>
              <div style={{ background: "#e8f5e9", color: "#2e7d32", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>Lv.{f.level}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function WalletScreen({ user, showToast, onRefresh }) {
  const [txs, setTxs] = useState([]);
  const [tab, setTab] = useState("history");
  const [form, setForm] = useState({ gemAmount: "", method: "bank", accountHolder: "", accountNumber: "", bankName: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch("/wallet/transactions").then(setTxs).catch(() => {});
  }, []);

  const doWithdraw = async () => {
    setSubmitting(true);
    try {
      await apiFetch("/wallet/withdrawals", { method: "POST", body: JSON.stringify(form) });
      showToast("Yêu cầu rút tiền đã gửi! 💸");
      onRefresh(); setTab("history");
    } catch (e) { showToast(e.message, "error"); }
    setSubmitting(false);
  };

  if (!user) return null;

  const REASON_LABEL = {
    collect_product: "Thu hoạch", feed_cost: "Cho thú ăn",
    buy_animal: "Mua thú", upgrade_barn: "Nâng cấp chuồng",
    withdraw: "Rút tiền", product_exchange: "Đổi sản phẩm → gem",
    lottery_ticket: "Mua vé số", lottery_win: "Trúng vé số",
    admin_adjust: "Admin điều chỉnh", referral_reward: "Thưởng referral",
    collect_gem: "Thu gem từ legendary",
  };

  return (
    <div>
      <div style={S.walletCards}>
        <div style={{ ...S.walletCard, background: "linear-gradient(135deg,#f6d365,#fda085)" }}>
          <div style={S.walletLabel}>🪙 Xu</div>
          <div style={S.walletAmt}>{Number(user.goldBalance).toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "rgba(0,0,0,0.5)", marginTop: 2 }}>Dùng trong game</div>
        </div>
        <div style={{ ...S.walletCard, background: "linear-gradient(135deg,#84fab0,#8fd3f4)" }}>
          <div style={S.walletLabel}>💎 Gem</div>
          <div style={S.walletAmt}>{Number(user.gemBalance).toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "rgba(0,0,0,0.5)", marginTop: 2 }}>1 gem = 500 VNĐ</div>
        </div>
      </div>

      <div style={S.tabRow}>
        <button style={{ ...S.tabBtn, ...(tab === "history" ? S.tabActive : {}) }} onClick={() => setTab("history")}>📊 Lịch sử</button>
        <button style={{ ...S.tabBtn, ...(tab === "withdraw" ? S.tabActive : {}) }} onClick={() => setTab("withdraw")}>💸 Rút tiền</button>
      </div>

      {tab === "history" && (
        txs.length === 0 ? <Empty icon="📊" text="Chưa có giao dịch" /> :
        txs.slice(0, 30).map(tx => (
          <div key={tx.id} style={S.txRow}>
            <div>
              <div style={S.txReason}>{REASON_LABEL[tx.reason] || tx.reason}</div>
              <div style={S.txDate}>{new Date(tx.createdAt).toLocaleDateString("vi-VN")}</div>
            </div>
            <div style={{ ...S.txAmt, color: Number(tx.amount) >= 0 ? "#43a047" : "#e53935" }}>
              {Number(tx.amount) >= 0 ? "+" : ""}{Number(tx.amount).toLocaleString()} {tx.currency === "gold" ? "🪙" : "💎"}
            </div>
          </div>
        ))
      )}

      {tab === "withdraw" && (
        <div style={S.formCard}>
          <div style={S.formTitle}>Rút tiền thật</div>
          <div style={S.formNote}>1 Gem = 500 VNĐ • Tối thiểu 20 Gem</div>
          <div style={{ background: "#e8f5e9", borderRadius: 10, padding: "8px 12px", marginBottom: 14, fontSize: 13, color: "#2e7d32", fontWeight: 600 }}>
            💎 Gem hiện có: {Number(user.gemBalance).toLocaleString()}
          </div>
          <label style={S.label}>Số Gem muốn rút</label>
          <input style={S.input} type="number" placeholder="Tối thiểu 20 gem" value={form.gemAmount} onChange={e => setForm({ ...form, gemAmount: e.target.value })} />
          {form.gemAmount && <div style={{ fontSize: 12, color: "#2e7d32", marginTop: 4 }}>= {(Number(form.gemAmount) * 500).toLocaleString()} VNĐ</div>}
          <label style={S.label}>Phương thức</label>
          <select style={S.input} value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
            <option value="bank">Ngân hàng</option>
            <option value="ewallet">Ví điện tử (Momo, ZaloPay...)</option>
          </select>
          <label style={S.label}>Tên chủ tài khoản</label>
          <input style={S.input} placeholder="NGUYEN VAN A" value={form.accountHolder} onChange={e => setForm({ ...form, accountHolder: e.target.value })} />
          <label style={S.label}>Số tài khoản / SĐT ví</label>
          <input style={S.input} placeholder="0123456789" value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} />
          {form.method === "bank" && (
            <>
              <label style={S.label}>Tên ngân hàng</label>
              <input style={S.input} placeholder="Vietcombank, MB Bank..." value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} />
            </>
          )}
          <button style={{ ...S.btnGreen, marginTop: 16, padding: "12px 0", borderRadius: 12, fontSize: 14 }} onClick={doWithdraw} disabled={submitting}>
            {submitting ? "Đang gửi..." : "💸 Gửi yêu cầu rút tiền"}
          </button>
        </div>
      )}
    </div>
  );
}

function Empty({ icon, text, sub }) {
  return (
    <div style={S.empty}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>{icon}</div>
      <div style={{ color: "#555", fontWeight: 600 }}>{text}</div>
      {sub && <div style={{ color: "#999", fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={S.secTitle}>{children}</div>;
}

const S = {
  app: { minHeight: "100vh", width: "100%", background: "url('/bg.png') center center / cover no-repeat fixed", backgroundSize: "cover", fontFamily: "'Segoe UI',sans-serif", paddingBottom: 70 },
  loading: { minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 12, background: "url('/bg.png') center center / cover no-repeat fixed" },
  header: { background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: 800, textShadow: "0 1px 4px rgba(0,0,0,0.5)" },
  balances: { display: "flex", gap: 6 },
  bal: { background: "rgba(255,255,255,0.2)", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 },
  main: { padding: "12px 12px 0" },
  nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, display: "flex", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", borderTop: "1px solid rgba(255,255,255,0.1)" },
  navBtn: { flex: 1, padding: "8px 0", border: "none", background: "transparent", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  navActive: { color: "#FFD700" },
  secTitle: { fontSize: 11, fontWeight: 800, color: "#444", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8, marginTop: 14, background: "rgba(255,255,255,0.7)", padding: "3px 8px", borderRadius: 6, display: "inline-block" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 },
  animalCard: { borderRadius: 16, padding: "12px 10px", textAlign: "center", boxShadow: "0 3px 12px rgba(0,0,0,0.15)" },
  animalEmoji: { fontSize: 40, marginBottom: 4 },
  animalName: { fontSize: 12, fontWeight: 700, color: "#333" },
  animalLv: { fontSize: 10, color: "#888", marginBottom: 5 },
  badgeHungry: { background: "#ffebee", color: "#c62828", borderRadius: 10, padding: "2px 8px", fontSize: 10, fontWeight: 700, marginBottom: 6, display: "inline-block" },
  badgeOk: { background: "#e8f5e9", color: "#2e7d32", borderRadius: 10, padding: "2px 8px", fontSize: 10, fontWeight: 700, marginBottom: 6, display: "inline-block" },
  tierBadge: { display: "inline-block", borderRadius: 8, padding: "2px 8px", fontSize: 10, fontWeight: 700, marginBottom: 4 },
  barnRow: { background: "rgba(255,255,255,0.85)", borderRadius: 12, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  taskCard: { background: "rgba(255,255,255,0.9)", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  taskLeft: { display: "flex", alignItems: "center", gap: 10 },
  taskIcon: { fontSize: 26, width: 36, textAlign: "center" },
  taskTitle: { fontSize: 13, fontWeight: 600, color: "#333" },
  taskSub: { fontSize: 11, color: "#888", marginTop: 2 },
  statCard: { borderRadius: 12, padding: "10px 8px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  productCard: { background: "rgba(255,255,255,0.92)", borderRadius: 14, padding: 14, marginBottom: 8, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" },
  filterBtn: { border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: 20, padding: "5px 12px", fontSize: 11, cursor: "pointer", background: "rgba(255,255,255,0.6)", color: "#555", fontWeight: 600, whiteSpace: "nowrap" },
  filterActive: { background: "#2e7d32", color: "#fff", borderColor: "#2e7d32" },
  walletCards: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 },
  walletCard: { borderRadius: 16, padding: "14px 12px", boxShadow: "0 3px 12px rgba(0,0,0,0.1)" },
  walletLabel: { fontSize: 12, color: "rgba(0,0,0,0.6)", marginBottom: 4 },
  walletAmt: { fontSize: 22, fontWeight: 800, color: "#333" },
  tabRow: { display: "flex", gap: 8, marginBottom: 12, marginTop: 8 },
  tabBtn: { flex: 1, padding: "8px 0", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: 10, background: "rgba(255,255,255,0.7)", fontSize: 12, cursor: "pointer", color: "#555", fontWeight: 600 },
  tabActive: { borderColor: "#2e7d32", color: "#2e7d32", background: "rgba(255,255,255,0.95)" },
  txRow: { background: "rgba(255,255,255,0.9)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  txReason: { fontSize: 13, color: "#444", fontWeight: 500 },
  txDate: { fontSize: 11, color: "#aaa", marginTop: 2 },
  txAmt: { fontSize: 14, fontWeight: 800 },
  formCard: { background: "rgba(255,255,255,0.92)", borderRadius: 16, padding: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.08)" },
  formTitle: { fontSize: 15, fontWeight: 700, color: "#333", marginBottom: 4 },
  formNote: { fontSize: 12, color: "#888", marginBottom: 14 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4, marginTop: 10 },
  input: { width: "100%", padding: "10px 12px", border: "1.5px solid #e0e0e0", borderRadius: 10, fontSize: 14, boxSizing: "border-box", outline: "none", background: "#fff" },
  btnGreen: { border: "none", borderRadius: 10, padding: "8px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%", background: "linear-gradient(135deg,#43a047,#66bb6a)", color: "#fff" },
  btnOrange: { border: "none", borderRadius: 10, padding: "8px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%", background: "linear-gradient(135deg,#fb8c00,#ffa726)", color: "#fff" },
  btnSmallGreen: { border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", background: "#43a047", color: "#fff" },
  toast: { position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", color: "#fff", padding: "10px 22px", borderRadius: 22, fontSize: 14, fontWeight: 700, boxShadow: "0 4px 16px rgba(0,0,0,0.3)", zIndex: 999, whiteSpace: "nowrap" },
  empty: { textAlign: "center", padding: "30px 20px" },
};
