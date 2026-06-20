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
  chicken:      { emoji: "🐔", bg: ["#fff9e6", "#ffe082"], border: "#ffb300" },
  duck:         { emoji: "🦆", bg: ["#e3f2fd", "#90caf9"], border: "#1976d2" },
  cow:          { emoji: "🐄", bg: ["#e8f5e9", "#a5d6a7"], border: "#388e3c" },
  goat:         { emoji: "🐐", bg: ["#fce4ec", "#f48fb1"], border: "#c2185b" },
  golden_sheep: { emoji: "🐑", bg: ["#fff8e1", "#ffe082"], border: "#f57f17" },
  phoenix:      { emoji: "🦅", bg: ["#fbe9e7", "#ff8a65"], border: "#d84315" },
  unicorn:      { emoji: "🦄", bg: ["#f3e5f5", "#ce93d8"], border: "#7b1fa2" },
};

const TIER_CONFIG = {
  common:    { label: "Thường",      color: "#78909c", bg: "#eceff1" },
  rare:      { label: "Hiếm",        color: "#1565c0", bg: "#e3f2fd" },
  epic:      { label: "Cực hiếm",    color: "#6a1b9a", bg: "#f3e5f5" },
  legendary: { label: "Huyền thoại", color: "#e65100", bg: "#fff3e0" },
};

export default function FarmApp() {
  const [screen, setScreen] = useState("farm");
  const [user, setUser] = useState(null);
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const loadUser = useCallback(async () => {
    try { const d = await apiFetch("/users/me"); setUser(d); } catch (e) { showToast(e.message, "error"); }
  }, [showToast]);

  const loadFarm = useCallback(async () => {
    try { const d = await apiFetch("/farm"); setFarm(d); } catch (e) {}
  }, []);

  useEffect(() => {
    if (tg) { tg.ready(); tg.expand(); }
    Promise.all([loadUser(), loadFarm()]).finally(() => setLoading(false));
  }, [loadUser, loadFarm]);

  if (loading) return (
    <div style={S.loading}>
      <div style={{ fontSize: 64 }}>🌾</div>
      <div style={{ color: "#56ab2f", fontWeight: 700, fontSize: 16 }}>Đang tải nông trại...</div>
    </div>
  );

  const NAV = [
    { id: "farm",     icon: "🏡", label: "Trại" },
    { id: "shop",     icon: "🏪", label: "Shop" },
    { id: "exchange", icon: "💱", label: "Đổi xu" },
    { id: "tasks",    icon: "📋", label: "Nhiệm vụ" },
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
        {screen === "farm"     && <FarmScreen     farm={farm} showToast={showToast} onRefresh={() => { loadUser(); loadFarm(); }} />}
        {screen === "shop"     && <ShopScreen     user={user} farm={farm} showToast={showToast} onRefresh={() => { loadUser(); loadFarm(); }} />}
        {screen === "exchange" && <ExchangeScreen user={user} showToast={showToast} onRefresh={loadUser} />}
        {screen === "tasks"    && <TasksScreen    showToast={showToast} onRefresh={loadUser} />}
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

  const doCollect = async (id) => {
    setBusy(id + "_c");
    try {
      const r = await apiFetch("/farm/collect", { method: "POST", body: JSON.stringify({ userAnimalIds: [id] }) });
      const gained = Number(r.goldGain) > 0 ? `+${Number(r.goldGain).toLocaleString()} xu` : `+${Number(r.gemGain).toLocaleString()} gem`;
      showToast(`${gained} 🎉`);
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

  if (animals.length === 0) return <Empty icon="🌱" text="Chưa có thú nuôi" sub="Vào Shop để mua thú!" />;

  return (
    <div>
      <SectionTitle>Thú nuôi ({animals.length})</SectionTitle>
      <div style={S.grid2}>
        {animals.map(a => {
          const cfg = ANIMAL_CONFIG[a.catalogCode] || { emoji: "🐾", bg: ["#f5f5f5","#e0e0e0"], border: "#9e9e9e" };
          const pending = a.pendingProduction || 0;
          return (
            <div key={a.id} style={{ ...S.animalCard, background: `linear-gradient(145deg,${cfg.bg[0]},${cfg.bg[1]})`, borderTop: `3px solid ${cfg.border}`, opacity: a.isHungry ? 0.8 : 1 }}>
              <div style={S.animalEmoji}>{cfg.emoji}</div>
              <div style={S.animalName}>{a.catalogCode}</div>
              <div style={S.animalLv}>Lv.{a.level}</div>
              {a.isHungry
                ? <div style={S.badgeHungry}>😩 Đói rồi!</div>
                : <div style={S.badgeOk}>{a.productCurrency === "gold" ? "🪙" : "💎"} +{pending.toLocaleString()}</div>
              }
              {a.isHungry
                ? <button style={S.btnOrange} onClick={() => doFeed(a.id)} disabled={!!busy}>{busy === a.id+"_f" ? "..." : "🌾 Cho ăn"}</button>
                : pending > 0
                  ? <button style={S.btnGreen} onClick={() => doCollect(a.id)} disabled={!!busy}>{busy === a.id+"_c" ? "..." : "⬇ Thu hoạch"}</button>
                  : <div style={{ fontSize: 11, color: "#aaa" }}>Đang sản xuất...</div>
              }
            </div>
          );
        })}
      </div>
      {barns.length > 0 && (
        <>
          <SectionTitle>Chuồng trại</SectionTitle>
          {barns.map(b => (
            <div key={b.id} style={S.barnRow}>
              <span style={{ fontSize: 13, color: "#555" }}>🏠 {b.barnType}</span>
              <span style={{ color: "#888", fontSize: 12 }}>{b.slotsUnlocked}/{b.slotsTotal} ô</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function ShopScreen({ user, farm, showToast, onRefresh }) {
  const [buying, setBuying] = useState(null);

  const SHOP = [
    { code: "chicken",      name: "Gà",       tier: "common",    price: 5000,   rate: "1/s",  desc: "Đẻ trứng vàng mỗi giây" },
    { code: "duck",         name: "Vịt",      tier: "common",    price: 8000,   rate: "1.5/s",desc: "Nhanh hơn gà một chút" },
    { code: "cow",          name: "Bò",       tier: "rare",      price: 30000,  rate: "5/s",  desc: "Cho sữa năng suất cao" },
    { code: "goat",         name: "Dê",       tier: "rare",      price: 25000,  rate: "4/s",  desc: "Leo núi và cho sữa dê" },
    { code: "golden_sheep", name: "Cừu vàng", tier: "epic",      price: 150000, rate: "20/s", desc: "Len vàng siêu hiếm" },
  ];

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
      showToast(`Đã mua ${animal.name}! 🎉`);
      onRefresh();
    } catch (e) { showToast(e.message, "error"); }
    setBuying(null);
  };

  return (
    <div>
      <SectionTitle>Cửa hàng thú nuôi</SectionTitle>
      {user && <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>Số dư: 🪙 {Number(user.goldBalance).toLocaleString()}</div>}
      <div style={S.grid2}>
        {SHOP.map(a => {
          const cfg = ANIMAL_CONFIG[a.code] || { emoji: "🐾", bg: ["#f5f5f5","#e0e0e0"], border: "#9e9e9e" };
          const tier = TIER_CONFIG[a.tier];
          const canAfford = user && Number(user.goldBalance) >= a.price;
          return (
            <div key={a.code} style={{ ...S.animalCard, background: `linear-gradient(145deg,${cfg.bg[0]},${cfg.bg[1]})`, borderTop: `3px solid ${cfg.border}` }}>
              <div style={S.animalEmoji}>{cfg.emoji}</div>
              <div style={S.animalName}>{a.name}</div>
              <div style={{ ...S.tierBadge, background: tier.bg, color: tier.color }}>{tier.label}</div>
              <div style={{ fontSize: 10, color: "#888", margin: "4px 0 2px" }}>{a.desc}</div>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>⚡ {a.rate}</div>
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

function ExchangeScreen({ user, showToast, onRefresh }) {
  const [tab, setTab] = useState("exchange");
  const [goldAmount, setGoldAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [lotteryResult, setLotteryResult] = useState(null);
  const [spinning, setSpinning] = useState(false);

  const doExchange = async () => {
    if (!goldAmount || Number(goldAmount) < 100000) {
      showToast("Tối thiểu 100,000 xu!", "error"); return;
    }
    setLoading(true);
    try {
      const r = await apiFetch("/wallet/exchange", { method: "POST", body: JSON.stringify({ goldAmount }) });
      showToast(`Đổi thành công! +${r.gemsReceived} 💎`);
      setGoldAmount("");
      onRefresh();
    } catch (e) { showToast(e.message, "error"); }
    setLoading(false);
  };

  const doLottery = async () => {
    setSpinning(true);
    setLotteryResult(null);
    try {
      const r = await apiFetch("/wallet/lottery", { method: "POST" });
      setTimeout(() => {
        setLotteryResult(r);
        if (Number(r.gemWon) > 0) showToast(`🎊 Trúng ${r.gemWon} gem!`);
        else showToast("Chúc bạn may mắn lần sau!");
        onRefresh();
        setSpinning(false);
      }, 1500);
    } catch (e) { showToast(e.message, "error"); setSpinning(false); }
  };

  const gemPreview = goldAmount ? Math.floor(Number(goldAmount) / 100000) : 0;

  return (
    <div>
      <div style={S.tabRow}>
        <button style={{ ...S.tabBtn, ...(tab === "exchange" ? S.tabActive : {}) }} onClick={() => setTab("exchange")}>💱 Đổi xu → gem</button>
        <button style={{ ...S.tabBtn, ...(tab === "lottery" ? S.tabActive : {}) }} onClick={() => setTab("lottery")}>🎰 Vé số may mắn</button>
      </div>

      {tab === "exchange" && (
        <div style={S.formCard}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#333", marginBottom: 4 }}>Đổi xu thành gem</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>Tỷ lệ: 100,000 🪙 = 1 💎</div>

          <div style={{ background: "#f5f5f5", borderRadius: 12, padding: 12, marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#888" }}>Số dư xu</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#b8860b" }}>🪙 {user ? Number(user.goldBalance).toLocaleString() : 0}</div>
            </div>
            <div style={{ fontSize: 24, color: "#aaa", alignSelf: "center" }}>→</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#888" }}>Số dư gem</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#6a1b9a" }}>💎 {user ? Number(user.gemBalance).toLocaleString() : 0}</div>
            </div>
          </div>

          <label style={S.label}>Số xu muốn đổi</label>
          <input style={S.input} type="number" step="100000" placeholder="100000" value={goldAmount} onChange={e => setGoldAmount(e.target.value)} />

          {gemPreview > 0 && (
            <div style={{ background: "#e8f5e9", borderRadius: 10, padding: "8px 12px", marginTop: 8, fontSize: 13, color: "#2e7d32", fontWeight: 600 }}>
              Bạn sẽ nhận được: 💎 {gemPreview} gem
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginTop: 10, marginBottom: 12 }}>
            {[100000, 500000, 1000000].map(v => (
              <button key={v} style={{ border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "6px 0", fontSize: 11, cursor: "pointer", background: "#fff", color: "#555", fontWeight: 600 }} onClick={() => setGoldAmount(String(v))}>
                {(v/1000).toFixed(0)}K xu
              </button>
            ))}
          </div>

          <button style={{ ...S.btnGreen, padding: "12px 0", borderRadius: 12, fontSize: 14 }} onClick={doExchange} disabled={loading || !goldAmount}>
            {loading ? "Đang đổi..." : "💱 Đổi ngay"}
          </button>
        </div>
      )}

      {tab === "lottery" && (
        <div style={S.formCard}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#333", marginBottom: 4 }}>🎰 Vé số may mắn</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>Chi phí: 10,000 xu/vé</div>

          <div style={{ background: "#fff8e1", borderRadius: 14, padding: 16, textAlign: "center", marginBottom: 16, border: "2px solid #FFD700" }}>
            <div style={{ fontSize: 13, color: "#b8860b", fontWeight: 600, marginBottom: 8 }}>Tỷ lệ trúng thưởng</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              <div style={{ background: "#fff", borderRadius: 10, padding: 8 }}>
                <div style={{ fontSize: 20 }}>💎💎💎💎💎</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#e65100" }}>5 Gem</div>
                <div style={{ fontSize: 10, color: "#aaa" }}>1% cơ hội</div>
              </div>
              <div style={{ background: "#fff", borderRadius: 10, padding: 8 }}>
                <div style={{ fontSize: 20 }}>💎💎💎</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6a1b9a" }}>3 Gem</div>
                <div style={{ fontSize: 10, color: "#aaa" }}>4% cơ hội</div>
              </div>
              <div style={{ background: "#fff", borderRadius: 10, padding: 8 }}>
                <div style={{ fontSize: 20 }}>💎</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1565c0" }}>1 Gem</div>
                <div style={{ fontSize: 10, color: "#aaa" }}>10% cơ hội</div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>
              {spinning ? "🎲" : lotteryResult ? (Number(lotteryResult.gemWon) > 0 ? "🎊" : "😔") : "🎰"}
            </div>
            {lotteryResult && (
              <div style={{ fontSize: 16, fontWeight: 700, color: Number(lotteryResult.gemWon) > 0 ? "#2e7d32" : "#888" }}>
                {Number(lotteryResult.gemWon) > 0 ? `Trúng ${lotteryResult.gemWon} 💎 gem!` : "Không trúng lần này"}
              </div>
            )}
          </div>

          <button style={{ ...S.btnGreen, padding: "12px 0", borderRadius: 12, fontSize: 14, background: spinning ? "#aaa" : "linear-gradient(135deg,#FFD700,#FFA000)", color: "#4A3500" }} onClick={doLottery} disabled={spinning}>
            {spinning ? "🎲 Đang quay..." : "🎰 Mua vé (10,000 xu)"}
          </button>

          {user && <div style={{ textAlign: "center", fontSize: 12, color: "#888", marginTop: 8 }}>Số xu hiện tại: 🪙 {Number(user.goldBalance).toLocaleString()}</div>}
        </div>
      )}
    </div>
  );
}

function TasksScreen({ showToast, onRefresh }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    try { const d = await apiFetch("/tasks"); setTasks(d); } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const doComplete = async (id) => {
    setBusy(id + "_c");
    try { await apiFetch(`/tasks/${id}/complete`, { method: "POST" }); showToast("Hoàn thành! ✅"); load(); } catch (e) { showToast(e.message, "error"); }
    setBusy(null);
  };

  const doClaim = async (id) => {
    setBusy(id + "_cl");
    try { const r = await apiFetch(`/tasks/${id}/claim`, { method: "POST" }); showToast(`+${Number(r.reward || 0).toLocaleString()} 🎁`); load(); onRefresh(); } catch (e) { showToast(e.message, "error"); }
    setBusy(null);
  };

  if (loading) return <Empty icon="📋" text="Đang tải nhiệm vụ..." />;
  if (!tasks.length) return <Empty icon="📋" text="Chưa có nhiệm vụ nào" />;

  const TYPE_ICON = { ad: "📺", daily: "📅", advanced: "⭐" };
  const TYPE_LABEL = { ad: "Xem quảng cáo", daily: "Hằng ngày", advanced: "Nâng cao" };

  return (
    <div>
      <SectionTitle>Nhiệm vụ hôm nay</SectionTitle>
      {tasks.map(t => (
        <div key={t.id} style={S.taskCard}>
          <div style={S.taskLeft}>
            <div style={S.taskIcon}>{TYPE_ICON[t.task?.type] || "📋"}</div>
            <div>
              <div style={S.taskTitle}>{t.task?.title || "Nhiệm vụ"}</div>
              <div style={S.taskSub}>{TYPE_LABEL[t.task?.type]} • 🪙 {Number(t.task?.rewardAmount || 0).toLocaleString()}</div>
            </div>
          </div>
          <div>
            {t.status === "pending" && <button style={S.btnSmallBlue} onClick={() => doComplete(t.id)} disabled={!!busy}>{busy === t.id+"_c" ? "..." : "Làm"}</button>}
            {t.status === "completed" && <button style={S.btnSmallGreen} onClick={() => doClaim(t.id)} disabled={!!busy}>{busy === t.id+"_cl" ? "..." : "Nhận"}</button>}
            {t.status === "claimed" && <span style={S.doneTag}>✓ Xong</span>}
          </div>
        </div>
      ))}
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
      onRefresh();
      setTab("history");
    } catch (e) { showToast(e.message, "error"); }
    setSubmitting(false);
  };

  if (!user) return null;

  const REASON_LABEL = {
    collect_product: "Thu hoạch sản phẩm",
    feed_cost: "Cho thú ăn",
    buy_animal: "Mua thú nuôi",
    upgrade_barn: "Nâng cấp chuồng",
    withdraw: "Rút tiền",
    exchange_to_gem: "Đổi xu → gem",
    exchange_from_gold: "Nhận gem từ đổi xu",
    lottery_ticket: "Mua vé số",
    lottery_win: "Trúng vé số",
    admin_adjust: "Admin điều chỉnh",
  };

  return (
    <div>
      <div style={S.walletCards}>
        <div style={{ ...S.walletCard, background: "linear-gradient(135deg,#f6d365,#fda085)" }}>
          <div style={S.walletLabel}>🪙 Xu (Gold)</div>
          <div style={S.walletAmt}>{Number(user.goldBalance).toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "rgba(0,0,0,0.5)", marginTop: 2 }}>Dùng trong game</div>
        </div>
        <div style={{ ...S.walletCard, background: "linear-gradient(135deg,#84fab0,#8fd3f4)" }}>
          <div style={S.walletLabel}>💎 Gem</div>
          <div style={S.walletAmt}>{Number(user.gemBalance).toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "rgba(0,0,0,0.5)", marginTop: 2 }}>1 gem = 1,000 VNĐ</div>
        </div>
      </div>

      <div style={S.tabRow}>
        <button style={{ ...S.tabBtn, ...(tab === "history" ? S.tabActive : {}) }} onClick={() => setTab("history")}>📊 Lịch sử</button>
        <button style={{ ...S.tabBtn, ...(tab === "withdraw" ? S.tabActive : {}) }} onClick={() => setTab("withdraw")}>💸 Rút tiền</button>
      </div>

      {tab === "history" && (
        txs.length === 0 ? <Empty icon="📊" text="Chưa có giao dịch nào" /> :
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
          <div style={{ fontSize: 15, fontWeight: 700, color: "#333", marginBottom: 4 }}>Rút tiền thật</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 14 }}>1 Gem = 1,000 VNĐ • Tối thiểu 100 Gem</div>
          <div style={{ background: "#e8f5e9", borderRadius: 10, padding: "8px 12px", marginBottom: 14, fontSize: 13, color: "#2e7d32", fontWeight: 600 }}>
            💎 Gem hiện có: {Number(user.gemBalance).toLocaleString()}
          </div>
          <label style={S.label}>Số Gem muốn rút</label>
          <input style={S.input} type="number" placeholder="Tối thiểu 100 gem" value={form.gemAmount} onChange={e => setForm({ ...form, gemAmount: e.target.value })} />
          {form.gemAmount && <div style={{ fontSize: 12, color: "#2e7d32", marginTop: 4 }}>= {(Number(form.gemAmount) * 1000).toLocaleString()} VNĐ</div>}
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
  app: { minHeight: "100vh", background: "#f0ebe0", fontFamily: "'Segoe UI',sans-serif",  margin: "0 auto", paddingBottom: 70 },
  loading: { minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 12, background: "#f0ebe0" },
  header: { background: "linear-gradient(135deg,#2e7d32,#66bb6a)", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 3px 10px rgba(0,0,0,0.2)" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: 800 },
  balances: { display: "flex", gap: 6 },
  bal: { background: "rgba(255,255,255,0.2)", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 },
  main: { padding: "12px 12px 0" },
  nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%",  display: "flex", background: "#fff", borderTop: "1px solid #e0e0e0", boxShadow: "0 -2px 10px rgba(0,0,0,0.1)" },
  navBtn: { flex: 1, padding: "8px 0", border: "none", background: "transparent", cursor: "pointer", color: "#9e9e9e", fontSize: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  navActive: { color: "#2e7d32" },
  secTitle: { fontSize: 11, fontWeight: 800, color: "#9e9e9e", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10, marginTop: 16 },
  grid2: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 },
  animalCard: { borderRadius: 16, padding: "14px 10px", textAlign: "center", boxShadow: "0 3px 12px rgba(0,0,0,0.1)" },
  animalEmoji: { fontSize: 44, marginBottom: 4 },
  animalName: { fontSize: 13, fontWeight: 700, color: "#333" },
  animalLv: { fontSize: 11, color: "#888", marginBottom: 6 },
  badgeHungry: { background: "#ffebee", color: "#c62828", borderRadius: 10, padding: "3px 10px", fontSize: 11, fontWeight: 700, marginBottom: 8, display: "inline-block" },
  badgeOk: { background: "#e8f5e9", color: "#2e7d32", borderRadius: 10, padding: "3px 10px", fontSize: 11, fontWeight: 700, marginBottom: 8, display: "inline-block" },
  tierBadge: { display: "inline-block", borderRadius: 8, padding: "2px 8px", fontSize: 10, fontWeight: 700, marginBottom: 4 },
  barnRow: { background: "#fff", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  taskCard: { background: "#fff", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  taskLeft: { display: "flex", alignItems: "center", gap: 10 },
  taskIcon: { fontSize: 28, width: 40, textAlign: "center" },
  taskTitle: { fontSize: 13, fontWeight: 600, color: "#333" },
  taskSub: { fontSize: 11, color: "#888", marginTop: 2 },
  doneTag: { background: "#e8f5e9", color: "#2e7d32", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 },
  walletCards: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 },
  walletCard: { borderRadius: 16, padding: "14px 12px", boxShadow: "0 3px 12px rgba(0,0,0,0.1)" },
  walletLabel: { fontSize: 12, color: "rgba(0,0,0,0.6)", marginBottom: 4 },
  walletAmt: { fontSize: 22, fontWeight: 800, color: "#333" },
  tabRow: { display: "flex", gap: 8, marginBottom: 12, marginTop: 8 },
  tabBtn: { flex: 1, padding: "8px 0", border: "1.5px solid #e0e0e0", borderRadius: 10, background: "#fff", fontSize: 12, cursor: "pointer", color: "#888", fontWeight: 600 },
  tabActive: { borderColor: "#2e7d32", color: "#2e7d32", background: "#e8f5e9" },
  txRow: { background: "#fff", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  txReason: { fontSize: 13, color: "#444", fontWeight: 500 },
  txDate: { fontSize: 11, color: "#aaa", marginTop: 2 },
  txAmt: { fontSize: 14, fontWeight: 800 },
  formCard: { background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.08)" },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4, marginTop: 10 },
  input: { width: "100%", padding: "10px 12px", border: "1.5px solid #e0e0e0", borderRadius: 10, fontSize: 14, boxSizing: "border-box", outline: "none" },
  btnGreen: { border: "none", borderRadius: 10, padding: "8px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%", background: "linear-gradient(135deg,#43a047,#66bb6a)", color: "#fff" },
  btnOrange: { border: "none", borderRadius: 10, padding: "8px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%", background: "linear-gradient(135deg,#fb8c00,#ffa726)", color: "#fff" },
  btnSmallGreen: { border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", background: "#43a047", color: "#fff" },
  btnSmallBlue: { border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", background: "#1976d2", color: "#fff" },
  toast: { position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", color: "#fff", padding: "10px 22px", borderRadius: 22, fontSize: 14, fontWeight: 700, boxShadow: "0 4px 16px rgba(0,0,0,0.25)", zIndex: 999, whiteSpace: "nowrap" },
  empty: { textAlign: "center", padding: "40px 20px" },
};
