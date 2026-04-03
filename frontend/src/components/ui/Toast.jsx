import { useState, useEffect, useCallback } from "react";

let _addToast = null;
export const toast = {
  success: (msg) => _addToast?.({ msg, type: "success" }),
  error:   (msg) => _addToast?.({ msg, type: "error" }),
  warn:    (msg) => _addToast?.({ msg, type: "warn" }),
  info:    (msg) => _addToast?.({ msg, type: "info" }),
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((t) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 3500);
  }, []);

  useEffect(() => { _addToast = add; return () => { _addToast = null; }; }, [add]);

  const icons = { success: "✅", error: "❌", warn: "⚠️", info: "ℹ️" };
  const colors = {
    success: { bg: "#F0FDF4", border: "#86EFAC", text: "#166534" },
    error:   { bg: "#FEF2F2", border: "#FCA5A5", text: "#991B1B" },
    warn:    { bg: "#FFFBEB", border: "#FCD34D", text: "#92400E" },
    info:    { bg: "#EFF6FF", border: "#93C5FD", text: "#1E40AF" },
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 99999, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
      {toasts.map(t => {
        const c = colors[t.type] || colors.info;
        return (
          <div key={t.id} style={{
            background: c.bg, border: `1px solid ${c.border}`, color: c.text,
            borderRadius: 12, padding: "12px 18px", fontSize: 13, fontWeight: 600,
            fontFamily: "Arial, sans-serif", boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            display: "flex", alignItems: "center", gap: 10, minWidth: 260, maxWidth: 360,
            animation: "toastIn 0.3s ease",
          }}>
            <span style={{ fontSize: 16 }}>{icons[t.type]}</span>
            <span>{t.msg}</span>
          </div>
        );
      })}
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </div>
  );
}
