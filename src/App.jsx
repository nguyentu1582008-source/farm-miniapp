import { useState, useEffect, useCallback } from "react";

// ============================================================
// CONFIG — đổi URL này thành IP/domain server của bạn
// ============================================================
const API_BASE = "https://cyclist-stunning-quail.ngrok-free.dev/api";
// Nếu chưa có HTTPS, dùng: const API_BASE = "http://163.223.9.139:3000/api";

// ============================================================
// Telegram WebApp helper
// ============================================================
const tg = typeof window !== "undefined" && window.Telegram?.WebApp;

function getInitData() {
  if (tg) return tg.initData || "";
  // Dev mode: trả về empty, backend sẽ báo lỗi auth
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

// ============================================================
// TIER CONFIG
// ============================================================
const TIER_EMOJI = { common: "🐔", rare: "🐄", epic: "🦌", legendary: "🦄" };
const TIER_COLOR = {
  common: "#8B9467",
  rare: "#4A90D9",
  epic: "#9B59B6",
  legendary: "#F39C12",
};
const TIER_LABEL = { common: "Thường", rare: "Hiếm", epic: "Cực hiếm", legendary: "Huyền thoại" };

// ============================================================
// MAIN APP
// ============================================================
export default function FarmApp() {
  const [screen, setScreen] = useState("farm"); // farm | wallet
  const [user, setUser] = useState(null);
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const data = await apiFetch("/users/me");
      setUser(data);
    } catch (e) {
      showToast(e.message, "error");
    }
  }, [showToast]);

  const loadFarm = useCallback(async () => {
    try {
      const data = await apiFetch("/farm");
      setFarm(data);
    } catch (e) {
      showToast(e.message, "error");
    }
  }, [showToast]);

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
    }
    Promise.all([loadUser(), loadFarm()]).finally(() => setLoading(false));
  }, [loadUser, loadFarm]);

  const handleCollect = async (animalId) => {
    try {
      const res = await apiFetch("/farm/collect", {
        method: "POST",
        body: JSON.stringify({ userAnimalIds: [animalId] }),
      });
      showToast(`+${res.goldGain > 0 ? res.goldGain + " xu" : res.gemGain + " gem"} 🎉`);
      await Promise.all([loadUser(), loadFarm()]);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleFeed = async (animalId) => {
    try {
      await apiFetch("/farm/feed", {
        method: "POST",
        body: JSON.stringify({ userAnimalId: animalId }),
      });
      showToast("Đã cho ăn! 🌾");
      await Promise.all([loadUser(), loadFarm()]);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div style={styles.app}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerTitle}>🌾 Nông Trại</div>
        {user && (
          <div style={styles.balances}>
            <span style={styles.balance}>🪙 {Number(user.goldBalance).toLocaleString()}</span>
            <span style={styles.balance}>💎 {Number(user.gemBalance).toLocaleString()}</span>
          </div>
        )}
      </header>

      {/* NAV */}
      <nav style={styles.nav}>
        <button style={{ ...styles.navBtn, ...(screen === "farm" ? styles.navBtnActive : {}) }} onClick={() => setScreen("farm")}>🏡 Trang trại</button>
        <button style={{ ...styles.navBtn, ...(screen === "wallet" ? styles.navBtnActive : {}) }} onClick={() => setScreen("wallet")}>💰 Ví</button>
      </nav>

      {/* CONTENT */}
      <main style={styles.main}>
        {screen === "farm" && (
          <FarmScreen farm={farm} onCollect={handleCollect} onFeed={handleFeed} onRefresh={() => { loadUser(); loadFarm(); }} />
        )}
        {screen === "wallet" && (
          <WalletScreen user={user} showToast={showToast} onRefresh={loadUser} />
        )}
      </main>

      {/* TOAST */}
      {toast && (
        <div style={{ ...styles.toast, background: toast.type === "error" ? "#e74c3c" : "#27ae60" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ============================================================
// FARM SCREEN
// ============================================================
function FarmScreen({ farm, onCollect, onFeed, onRefresh }) {
  const [collecting, setCollecting] = useState(null);
  const [feeding, setFeeding] = useState(null);

  if (!farm) return <div style={styles.empty}>Đang tải nông trại...</div>;

  const { barns = [], animals = [] } = farm;

  const handleCollect = async (id) => {
    setCollecting(id);
    await onCollect(id);
    setCollecting(null);
  };

  const handleFeed = async (id) => {
    setFeeding(id);
    await onFeed(id);
    setFeeding(null);
  };

  if (animals.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
        <div style={{ color: "#666", fontSize: 14 }}>Chưa có thú nuôi nào</div>
        <div style={{ color: "#999", fontSize: 12, marginTop: 6 }}>Mua thú để bắt đầu kiếm tiền!</div>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.sectionTitle}>Thú nuôi của bạn ({animals.length})</div>
      <div style={styles.animalGrid}>
        {animals.map((animal) => (
          <AnimalCard
            key={animal.id}
            animal={animal}
            onCollect={() => handleCollect(animal.id)}
            onFeed={() => handleFeed(animal.id)}
            collecting={collecting === animal.id}
            feeding={feeding === animal.id}
          />
        ))}
      </div>
      <div style={styles.sectionTitle}>Chuồng trại ({barns.length})</div>
      <div style={styles.barnList}>
        {barns.map((barn) => (
          <div key={barn.id} style={styles.barnCard}>
            <span>🏠 {barn.barnType}</span>
            <span style={{ color: "#888", fontSize: 12 }}>{barn.slotsUnlocked}/{barn.slotsTotal} ô</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnimalCard({ animal, onCollect, onFeed, collecting, feeding }) {
  const emoji = TIER_EMOJI[animal.productCurrency === "gem" ? "legendary" : "common"] || "🐾";
  const pending = animal.pendingProduction || 0;
  const currency = animal.productCurrency === "gold" ? "🪙" : "💎";

  return (
    <div style={{ ...styles.animalCard, opacity: animal.isHungry ? 0.75 : 1 }}>
      <div style={styles.animalEmoji}>{emoji}</div>
      <div style={styles.animalName}>{animal.catalogCode}</div>
      <div style={styles.animalLevel}>Lv.{animal.level}</div>

      {animal.isHungry ? (
        <div style={styles.hungryBadge}>😩 Đói</div>
      ) : (
        <div style={styles.pendingBadge}>
          {currency} +{pending.toLocaleString()}
        </div>
      )}

      <div style={styles.animalBtns}>
        {!animal.isHungry && pending > 0 && (
          <button
            style={{ ...styles.btn, ...styles.btnGreen }}
            onClick={onCollect}
            disabled={collecting}
          >
            {collecting ? "..." : "Thu hoạch"}
          </button>
        )}
        {animal.isHungry && (
          <button
            style={{ ...styles.btn, ...styles.btnOrange }}
            onClick={onFeed}
            disabled={feeding}
          >
            {feeding ? "..." : "🌾 Cho ăn"}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// WALLET SCREEN
// ============================================================
function WalletScreen({ user, showToast, onRefresh }) {
  const [txs, setTxs] = useState([]);
  const [loadingTxs, setLoadingTxs] = useState(true);

  useEffect(() => {
    apiFetch("/wallet/transactions")
      .then(setTxs)
      .catch(() => {})
      .finally(() => setLoadingTxs(false));
  }, []);

  if (!user) return null;

  return (
    <div>
      <div style={styles.walletCards}>
        <div style={{ ...styles.walletCard, background: "linear-gradient(135deg, #f6d365, #fda085)" }}>
          <div style={styles.walletLabel}>🪙 Xu (Gold)</div>
          <div style={styles.walletAmount}>{Number(user.goldBalance).toLocaleString()}</div>
        </div>
        <div style={{ ...styles.walletCard, background: "linear-gradient(135deg, #84fab0, #8fd3f4)" }}>
          <div style={styles.walletLabel}>💎 Gem</div>
          <div style={styles.walletAmount}>{Number(user.gemBalance).toLocaleString()}</div>
        </div>
      </div>

      <div style={styles.sectionTitle}>Lịch sử giao dịch</div>
      {loadingTxs ? (
        <div style={styles.empty}>Đang tải...</div>
      ) : txs.length === 0 ? (
        <div style={styles.empty}>Chưa có giao dịch nào</div>
      ) : (
        <div>
          {txs.slice(0, 20).map((tx) => (
            <div key={tx.id} style={styles.txRow}>
              <div>
                <div style={styles.txReason}>{tx.reason}</div>
                <div style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString("vi-VN")}</div>
              </div>
              <div style={{ ...styles.txAmount, color: Number(tx.amount) >= 0 ? "#27ae60" : "#e74c3c" }}>
                {Number(tx.amount) >= 0 ? "+" : ""}{Number(tx.amount).toLocaleString()} {tx.currency === "gold" ? "🪙" : "💎"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// LOADING SCREEN
// ============================================================
function LoadingScreen() {
  return (
    <div style={{ ...styles.app, justifyContent: "center", alignItems: "center", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 48 }}>🌾</div>
      <div style={{ color: "#666" }}>Đang tải nông trại...</div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = {
  app: {
    minHeight: "100vh",
    background: "url('https://cyclist-stunning-quail.ngrok-free.dev/static/images/bg.png') center top / cover fixed",
    fontFamily: "'Segoe UI', sans-serif",
    maxWidth: 430,
    margin: "0 auto",
    position: "relative",
    paddingBottom: 80,
  },
  header: {
    background: "linear-gradient(135deg, #56ab2f, #a8e063)",
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: 700 },
  balances: { display: "flex", gap: 8 },
  balance: {
    background: "rgba(255,255,255,0.25)",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
  },
  nav: {
    display: "flex",
    background: "#fff",
    borderBottom: "2px solid #e8e0d0",
  },
  navBtn: {
    flex: 1,
    padding: "10px 0",
    border: "none",
    background: "transparent",
    fontSize: 14,
    cursor: "pointer",
    color: "#888",
    fontWeight: 500,
  },
  navBtnActive: {
    color: "#56ab2f",
    borderBottom: "2px solid #56ab2f",
    fontWeight: 700,
  },
  main: { padding: "16px 12px" },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 16,
  },
  animalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10,
  },
  animalCard: {
    background: "#fff",
    borderRadius: 14,
    padding: 12,
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  animalEmoji: { fontSize: 36, marginBottom: 4 },
  animalName: { fontSize: 12, fontWeight: 600, color: "#555" },
  animalLevel: { fontSize: 11, color: "#aaa", marginBottom: 6 },
  hungryBadge: {
    background: "#fff3cd",
    color: "#856404",
    borderRadius: 8,
    padding: "2px 8px",
    fontSize: 11,
    marginBottom: 8,
    display: "inline-block",
  },
  pendingBadge: {
    background: "#d4edda",
    color: "#155724",
    borderRadius: 8,
    padding: "2px 8px",
    fontSize: 11,
    marginBottom: 8,
    display: "inline-block",
  },
  animalBtns: { display: "flex", flexDirection: "column", gap: 4 },
  btn: {
    border: "none",
    borderRadius: 8,
    padding: "6px 0",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
  },
  btnGreen: { background: "#56ab2f", color: "#fff" },
  btnOrange: { background: "#f39c12", color: "#fff" },
  barnList: { display: "flex", flexDirection: "column", gap: 6 },
  barnCard: {
    background: "#fff",
    borderRadius: 10,
    padding: "10px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  walletCards: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  walletCard: {
    borderRadius: 14,
    padding: "16px 12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  walletLabel: { fontSize: 12, color: "rgba(0,0,0,0.6)", marginBottom: 4 },
  walletAmount: { fontSize: 22, fontWeight: 800, color: "#333" },
  txRow: {
    background: "#fff",
    borderRadius: 10,
    padding: "10px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  txReason: { fontSize: 13, color: "#444", fontWeight: 500 },
  txDate: { fontSize: 11, color: "#aaa", marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: 700 },
  toast: {
    position: "fixed",
    bottom: 90,
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 600,
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    zIndex: 999,
    whiteSpace: "nowrap",
  },
  empty: {
    textAlign: "center",
    color: "#999",
    padding: "40px 20px",
    fontSize: 14,
  },
};
