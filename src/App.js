import { useState, useEffect, useRef } from "react";
import axios from "axios";

const SYMBOLS = {
  FOREX: [
    { label: "EUR/USD", symbol: "EURUSD=X" },
    { label: "GBP/USD", symbol: "GBPUSD=X" },
    { label: "USD/JPY", symbol: "USDJPY=X" },
    { label: "AUD/USD", symbol: "AUDUSD=X" },
  ],
  COMMODITIES: [
    { label: "Gold",      symbol: "XAUUSD" },
    { label: "Crude Oil", symbol: "USOIL"  },
    { label: "Brent Oil", symbol: "UKOIL"  },
    { label: "Silver",    symbol: "SI=F"   },
  ],
  CRYPTO: [
    { label: "Bitcoin",  symbol: "BTC-USD" },
    { label: "Ethereum", symbol: "ETH-USD" },
    { label: "Solana",   symbol: "SOL-USD" },
    { label: "BNB",      symbol: "BNB-USD" },
  ],
  STOCKS: [
    { label: "Apple",     symbol: "AAPL" },
    { label: "Tesla",     symbol: "TSLA" },
    { label: "NVIDIA",    symbol: "NVDA" },
    { label: "Microsoft", symbol: "MSFT" },
  ],
};

const ICONS = { FOREX: "📊", COMMODITIES: "🛢️", CRYPTO: "₿", STOCKS: "🏢" };

const SC = {
  BUY:  { bg: "rgba(0,227,150,0.1)",  border: "1px solid rgba(0,227,150,0.35)",  color: "#00e396" },
  SELL: { bg: "rgba(255,69,96,0.1)",  border: "1px solid rgba(255,69,96,0.35)",  color: "#ff4560" },
  WAIT: { bg: "rgba(255,184,0,0.1)",  border: "1px solid rgba(255,184,0,0.35)",  color: "#ffb800" },
};

const CW = {
  "low": "25%", "medium-low": "40%",
  "medium": "60%", "high": "85%",
};

export default function App() {
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [signal,   setSignal]   = useState(null);
  const [loadMsg,  setLoadMsg]  = useState("");
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    // Auto reload only when signal is WAIT
    if (signal?.signal === "WAIT" && !signal._demo) {
      setCountdown(60);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            getSignal(); // auto fetch again
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setCountdown(0);
    }

    return () => clearInterval(timerRef.current);
  }, [signal]);

  async function getSignal() {
    if (!selected) { alert("Pick a symbol first!"); return; }
    setLoading(true);
    setSignal(null);

    const msgs = ["Fetching MT5 data...", "Calculating indicators...", "Asking Claude AI..."];
    let i = 0;
    setLoadMsg(msgs[0]);
    const iv = setInterval(() => {
      i = Math.min(i + 1, msgs.length - 1);
      setLoadMsg(msgs[i]);
    }, 1800);

    try {
      const res = await axios.post("http://localhost:5000/signal", {
        symbol: selected.symbol,
        label:  selected.label,
      });
      setSignal({ ...res.data, _demo: false });
    } catch {
      setSignal({
        signal: "WAIT", price: "—", rsi: "—", macd: "—",
        entry: "—", stop_loss: "—", take_profit: "—",
        reason: "⚠️ Could not connect to Python backend. Make sure api.py is running on port 5000.",
        confidence: "low", _demo: true,
      });
    } finally {
      clearInterval(iv);
      setLoading(false);
    }
  }

  const sc  = signal ? (SC[signal.signal] || SC.WAIT) : null;
  const cw  = signal ? (CW[signal.confidence?.toLowerCase().replace(" ", "-")] || "50%") : "0%";
  const cc  = signal?.confidence?.toLowerCase().includes("high") ? "#00e396"
            : signal?.confidence?.toLowerCase().includes("low")  ? "#ff4560" : "#ffb800";

  return (
    <div style={{ minHeight: "100vh", background: "#060d1a", color: "#e8edf2",
      fontFamily: "'Syne', sans-serif", padding: "0" }}>

      {/* Grid bg */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(99,179,237,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,179,237,0.03) 1px,transparent 1px)",
        backgroundSize: "40px 40px" }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 36, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="pulse-dot" style={{ width: 10, height: 10, borderRadius: "50%",
              background: "#38bdf8", boxShadow: "0 0 12px #38bdf8" }} />
            <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "0.08em",
              textTransform: "uppercase", margin: 0 }}>
              AI <span style={{ color: "#38bdf8" }}>Signal</span> Desk
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8,
            background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.2)",
            padding: "6px 14px", borderRadius: 20 }}>
            <div className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#38bdf8" }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              color: "#38bdf8", letterSpacing: "0.12em" }}>LIVE · MT5</span>
          </div>
        </div>

        {/* Symbol grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
          {Object.entries(SYMBOLS).map(([group, items]) => (
            <div key={group} style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 16, padding: 18 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
                color: "#4a6080", textTransform: "uppercase", marginBottom: 12 }}>
                {ICONS[group]} {group}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {items.map((item) => {
                  const active = selected?.symbol === item.symbol;
                  return (
                    <button key={item.symbol} onClick={() => setSelected(item)} style={{
                      background: active ? "rgba(56,189,248,0.1)" : "transparent",
                      border: active ? "1px solid rgba(56,189,248,0.4)" : "1px solid rgba(255,255,255,0.06)",
                      color: active ? "#7dd3fc" : "#8096b0",
                      padding: "9px 14px", borderRadius: 10,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13, cursor: "pointer", textAlign: "left",
                      letterSpacing: "0.04em", transition: "all 0.15s",
                    }}>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Analyze button */}
        <button onClick={getSignal} disabled={loading} style={{
          width: "100%", padding: "17px", borderRadius: 14, border: "none",
          background: loading ? "#0a1628" : "#38bdf8",
          color: loading ? "#38bdf8" : "#060d1a",
          fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800,
          letterSpacing: "0.12em", textTransform: "uppercase",
          cursor: loading ? "not-allowed" : "pointer", marginBottom: 28,
          boxShadow: loading ? "none" : "0 6px 24px rgba(56,189,248,0.25)",
          transition: "all 0.2s",
          outline: loading ? "1px solid rgba(56,189,248,0.3)" : "none",
        }}>
          {loading ? `⏳  ${loadMsg}` : "⚡  Get AI Signal"}
        </button>

        {/* Signal card */}
        {signal && (
          <div className="animate-fade-up" style={{ background: "#0a1628",
            border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 32, marginBottom: 20 }}>

            {/* Demo warning */}
            {signal._demo && (
              <div style={{ marginBottom: 20, padding: "10px 16px", borderRadius: 10,
                background: "rgba(255,184,0,0.08)", border: "1px solid rgba(255,184,0,0.2)",
                color: "#ffb800", fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12, letterSpacing: "0.06em" }}>
                ⚠️ Backend offline — run <strong>python api.py</strong> for live signals
              </div>
            )}

            {/* Top row */}
            <div style={{ display: "flex", alignItems: "flex-start",
              justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "#4a6080",
                  textTransform: "uppercase", marginBottom: 6 }}>Signal for</p>
                <p style={{ fontSize: 34, fontWeight: 800, letterSpacing: "0.04em", margin: 0 }}>
                  {selected?.label}
                </p>
              </div>
              <div style={{ padding: "10px 26px", borderRadius: 12, fontSize: 20,
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                letterSpacing: "0.16em", ...sc }}>
                {signal.signal}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 14 }}>
              {[
                { label: "Price",    value: signal.price, color: "#e8edf2" },
                { label: "RSI (14)", value: signal.rsi,
                  color: parseFloat(signal.rsi) > 70 ? "#ff4560" : parseFloat(signal.rsi) < 30 ? "#00e396" : "#ffb800" },
                { label: "MACD",     value: signal.macd,
                  color: parseFloat(signal.macd) > 0 ? "#00e396" : "#ff4560" },
              ].map((s) => (
                <div key={s.label} style={{ background: "#0f1f35",
                  border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 18 }}>
                  <p style={{ fontSize: 10, letterSpacing: "0.14em", color: "#4a6080",
                    textTransform: "uppercase", marginBottom: 8 }}>{s.label}</p>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22,
                    fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Trade levels */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 14 }}>
              {[
                { label: "Entry Zone",   value: signal.entry,       accent: "#38bdf8" },
                { label: "Stop Loss",    value: signal.stop_loss,   accent: "#ff4560" },
                { label: "Take Profit",  value: signal.take_profit, accent: "#00e396" },
              ].map((l) => (
                <div key={l.label} style={{ background: "#0f1f35",
                  border: `1px solid ${l.accent}30`, borderRadius: 12, padding: 18, textAlign: "center" }}>
                  <p style={{ fontSize: 10, letterSpacing: "0.14em", color: l.accent,
                    textTransform: "uppercase", marginBottom: 10 }}>{l.label}</p>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15,
                    fontWeight: 700, color: "#e8edf2", margin: 0 }}>{l.value}</p>
                </div>
              ))}
            </div>

            {/* Reason */}
            <div style={{ background: "#0f1f35", borderLeft: "3px solid #38bdf8",
              borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: "#94a3b8", margin: 0 }}>
                {signal.reason}
              </p>
            </div>

            {/* Confidence */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 10, letterSpacing: "0.14em", color: "#4a6080",
                textTransform: "uppercase", whiteSpace: "nowrap" }}>Confidence</span>
              <div style={{ flex: 1, height: 4, background: "#0f1f35", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 2, background: cc,
                  width: cw, transition: "width 1s ease" }} />
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                color: "#8096b0", whiteSpace: "nowrap" }}>
                {signal.confidence?.toUpperCase()}
              </span>
            </div>

            {signal.signal === "WAIT" && !signal._demo && (
              <div style={{
                marginTop: 20,
                padding: "14px 20px",
                borderRadius: 12,
                background: "rgba(255,184,0,0.06)",
                border: "1px solid rgba(255,184,0,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    border: "2px solid rgba(255,184,0,0.3)",
                    borderTopColor: "#ffb800",
                    animation: "spin 1s linear infinite",
                    flexShrink: 0,
                  }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700,
                      color: "#ffb800", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      Auto-refreshing in {countdown}s
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "#4a6080", marginTop: 3 }}>
                      Waiting for a cleaner entry signal...
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    clearInterval(timerRef.current);
                    setCountdown(0);
                    getSignal();
                  }}
                  style={{
                    background: "rgba(255,184,0,0.1)",
                    border: "1px solid rgba(255,184,0,0.3)",
                    color: "#ffb800",
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    cursor: "pointer",
                    letterSpacing: "0.06em",
                    whiteSpace: "nowrap",
                  }}
                >
                  ↻ Now
                </button>
              </div>
            )}

            {signal.time_in_trade && (
              <div style={{ marginTop: 16, padding: "10px 16px", borderRadius: 10,
                background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.15)",
                display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, color: "#38bdf8", letterSpacing: "0.1em" }}>⏱ TIME IN TRADE</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                  color: "#e8edf2", marginLeft: "auto" }}>{signal.time_in_trade}</span>
              </div>
            )}
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 11, color: "#2a3a4a", letterSpacing: "0.06em" }}>
          ⚠️ AI signals are for informational purposes only. Not financial advice.
        </p>
      </div>
    </div>
  );
}
