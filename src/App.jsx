import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Search, Plus, Eye, Edit3, Trash2, AlertTriangle, TrendingDown, TrendingUp, Clock, Users, BarChart3, ChevronDown, X, Check, Filter, RefreshCw, Star, Shield, Globe, DollarSign, Target, AlertCircle, CheckCircle, XCircle, ArrowUpRight, ArrowDownRight, Minus, Home, List, History, UserCheck, Bell, ChevronLeft, ChevronRight, ExternalLink, Info, Layers, GitCompare, Tag, HelpCircle, Download, PlusCircle, Crosshair, ArrowRight, Copy, Bookmark, Radio, Hash, Loader } from "lucide-react";
import { useSupabase } from "./useSupabase";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const SITES = ["eBay", "Amazon", "Jomashop", "CreationWatches"];
const WARRANTIES = ["Fabricante", "No especifica", "Sin garantía"];
const TRACKING_TYPES = ["Posible compra futura", "Solo referencia de mercado"];
const RESPONSIBLES = ["Christian", "Jeremy"];
const OPP_STATES = ["Buena opción", "Solo seguimiento", "No conviene"];
const VENDOR_CLASS = ["Confiable", "En observación", "Riesgoso", "Descartado"];
const CURRENCIES = ["USD", "EUR", "JPY", "GBP"];
const COMPARE_PER_PAGE = 15;

const getWeek = (d) => { const dt = new Date(d); const s = new Date(dt.getFullYear(), 0, 1); return Math.ceil(((dt - s) / 86400000 + s.getDay() + 1) / 7); };
const getQ = (d) => Math.ceil((new Date(d).getMonth() + 1) / 3);
const fmt = (n) => typeof n === "number" && n !== 0 ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
const fmtD = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const getWeekRange = (year, week) => {
  const jan1 = new Date(year, 0, 1);
  const d = new Date(jan1.getTime() + (week - 1) * 7 * 86400000);
  const start = new Date(d); start.setDate(d.getDate() - d.getDay() + 1);
  const end = new Date(start); end.setDate(start.getDate() + 6);
  const m = (dt) => dt.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
  return `${m(start)} – ${m(end)}`;
};

// ═══════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════
const C = {
  bg: "#060a12", bg2: "#0c1220", card: "#101828", cardH: "#162040",
  input: "#0a1020", border: "#1c2a48", borderH: "#c8a84e",
  text: "#e4e8f0", sub: "#7088a8", dim: "#3d5070",
  gold: "#c8a84e", goldDk: "#9a7830",
  ok: "#22c55e", warn: "#f59e0b", err: "#ef4444", info: "#3b82f6", purple: "#8b5cf6", cyan: "#06b6d4",
};
const oppC = { "Buena opción": C.ok, "Solo seguimiento": C.sub, "No conviene": C.err };
const classC = { "Confiable": C.ok, "En observación": C.warn, "Riesgoso": C.err, "Descartado": "#6b7280" };
const PAL = [C.gold, C.info, C.ok, C.warn, C.purple, C.err, C.cyan, "#f97316"];

// ═══════════════════════════════════════════════════════════════
// UI ATOMS
// ═══════════════════════════════════════════════════════════════
const Badge = ({ children, color = C.gold, small }) => (
  <span style={{ display: "inline-flex", alignItems: "center", padding: small ? "2px 8px" : "3px 12px", borderRadius: 20, fontSize: small ? 10 : 11, fontWeight: 700, letterSpacing: "0.04em", color, background: `${color}15`, border: `1px solid ${color}28`, whiteSpace: "nowrap", textTransform: "uppercase" }}>{children}</span>
);

const Pill = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{ padding: "6px 16px", borderRadius: 20, border: `1px solid ${active ? C.gold : C.border}`, background: active ? `${C.gold}18` : "transparent", color: active ? C.gold : C.sub, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}>{children}</button>
);

const Btn = ({ children, onClick, variant = "primary", small, disabled, icon: Icon }) => {
  const isPri = variant === "primary";
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: small ? "6px 14px" : "10px 20px", borderRadius: 8, border: "none", cursor: disabled ? "not-allowed" : "pointer", fontSize: small ? 12 : 13, fontWeight: 600, background: isPri ? C.gold : variant === "danger" ? `${C.err}18` : "transparent", color: isPri ? C.bg : variant === "danger" ? C.err : C.sub, opacity: disabled ? 0.5 : 1, transition: "all 0.15s" }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = "0.85"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = disabled ? "0.5" : "1"; }}>
      {Icon && <Icon size={small ? 14 : 16} />}{children}
    </button>
  );
};

const Input = ({ label, value, onChange, type = "text", options, placeholder, required, textarea, readOnly, extra }) => {
  const base = { width: "100%", padding: "10px 14px", background: C.input, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, outline: "none", transition: "border-color 0.2s" };
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: C.sub, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}{required && <span style={{ color: C.err }}>*</span>}{extra}</label>}
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={{ ...base, cursor: "pointer" }} onFocus={e => e.target.style.borderColor = C.borderH} onBlur={e => e.target.style.borderColor = C.border}>
          <option value="">Seleccionar...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...base, resize: "vertical" }} onFocus={e => e.target.style.borderColor = C.borderH} onBlur={e => e.target.style.borderColor = C.border} readOnly={readOnly} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} onFocus={e => e.target.style.borderColor = C.borderH} onBlur={e => e.target.style.borderColor = C.border} readOnly={readOnly} />
      )}
    </div>
  );
};

const Toggle = ({ label, value, onChange }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.sub, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</label>
    <div style={{ display: "flex", gap: 8 }}>
      {[true, false].map(v => (
        <button key={String(v)} onClick={() => onChange(v)} style={{ padding: "7px 20px", borderRadius: 8, border: `1px solid ${value === v ? C.gold : C.border}`, background: value === v ? `${C.gold}18` : "transparent", color: value === v ? C.gold : C.sub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {v ? "Sí" : "No"}
        </button>
      ))}
    </div>
  </div>
);

const Alert = ({ type = "warning", children }) => {
  const c = type === "danger" ? C.err : type === "success" ? C.ok : type === "info" ? C.info : C.warn;
  const Icon = type === "danger" ? XCircle : type === "success" ? CheckCircle : type === "info" ? Info : AlertTriangle;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 16px", background: `${c}10`, border: `1px solid ${c}25`, borderRadius: 8, fontSize: 13, color: c, marginBottom: 8 }}>
      <Icon size={16} style={{ flexShrink: 0, marginTop: 1 }} /><span>{children}</span>
    </div>
  );
};

// ─── MODAL: does NOT close on outside click ──────────────────
const Modal = ({ open, onClose, title, children, wide }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, width: wide ? "min(960px, 96vw)" : "min(620px, 96vw)", maxHeight: "92vh", overflow: "auto", boxShadow: `0 32px 80px rgba(0,0,0,0.6)` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.card, zIndex: 1, borderRadius: "16px 16px 0 0" }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>{title}</h3>
          <button onClick={onClose} style={{ background: `${C.err}15`, border: `1px solid ${C.err}30`, borderRadius: 8, color: C.err, cursor: "pointer", padding: "6px 8px", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600 }}><X size={14} /> Cerrar</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};

const KPI = ({ icon: Icon, label, value, color = C.gold, sub }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", flex: "1 1 170px", minWidth: 170, borderTop: `3px solid ${color}`, transition: "border-color 0.2s, transform 0.2s", cursor: "default" }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.borderTopColor = color; e.currentTarget.style.transform = "none"; }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={17} color={color} /></div>
    </div>
    <div style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 11, color: C.sub, marginTop: 4, fontWeight: 600 }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{sub}</div>}
  </div>
);

const ChartCard = ({ title, children, span = 1 }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, gridColumn: `span ${span}`, minHeight: 300 }}>
    <h4 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: C.text }}>{title}</h4>
    {children}
  </div>
);

const DataTable = ({ columns, data, onRowClick, emptyMsg = "Sin registros", sortable }) => {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const sorted = useMemo(() => {
    if (!sortKey || !sortable) return data;
    return [...data].sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (va == null) return 1; if (vb == null) return -1;
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir, sortable]);

  const handleSort = (key) => {
    if (!sortable) return;
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  if (!data.length) return <div style={{ textAlign: "center", padding: 40, color: C.sub, fontSize: 14 }}><Layers size={28} style={{ opacity: 0.3, marginBottom: 6 }} /><br />{emptyMsg}</div>;
  return (
    <div style={{ overflowX: "auto", borderRadius: 12, border: `1px solid ${C.border}` }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr>{columns.map((c, i) => (
          <th key={i} onClick={() => c.key && c.key !== "_" && handleSort(c.key)} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 700, fontSize: 10, color: sortKey === c.key ? C.gold : C.sub, borderBottom: `1px solid ${C.border}`, background: C.input, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap", cursor: sortable && c.key && c.key !== "_" ? "pointer" : "default", userSelect: "none", transition: "color 0.15s" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              {c.label}
              {sortable && sortKey === c.key && <span style={{ fontSize: 9 }}>{sortDir === "asc" ? "▲" : "▼"}</span>}
            </span>
          </th>
        ))}</tr></thead>
        <tbody>{sorted.map((row, ri) => (
          <tr key={ri} onClick={() => onRowClick?.(row)} style={{ cursor: onRowClick ? "pointer" : "default", transition: "background 0.1s" }}
            onMouseEnter={e => e.currentTarget.style.background = C.cardH}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            {columns.map((c, ci) => <td key={ci} style={{ padding: "11px 14px", borderBottom: `1px solid ${C.border}08`, color: C.text, whiteSpace: c.nowrap ? "nowrap" : "normal", maxWidth: c.maxW || "auto", overflow: "hidden", textOverflow: "ellipsis" }}>{c.render ? c.render(row[c.key], row) : (row[c.key] ?? "")}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// GUIDE MODAL
// ═══════════════════════════════════════════════════════════════
const GuideModal = ({ open, onClose }) => (
  <Modal open={open} onClose={onClose} title="¿Cómo funciona WatchPulse?" wide>
    <div style={{ fontSize: 14, lineHeight: 1.8, color: C.text }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ padding: 20, background: `${C.info}08`, border: `1px solid ${C.info}20`, borderRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><List size={20} color={C.info} /><h4 style={{ margin: 0, color: C.info }}>Seguimiento</h4></div>
          <p style={{ margin: 0, color: C.sub, fontSize: 13, lineHeight: 1.7 }}>Tu <strong style={{ color: C.text }}>registro principal</strong>. Cada reloj que encuentras en cualquier sitio web lo registras aquí con todos sus datos.<br /><br /><strong style={{ color: C.text }}>Ejemplo:</strong> SEIKO Presage SRPD37 a $325 en eBay → Creas SEG-001.</p>
        </div>
        <div style={{ padding: 20, background: `${C.gold}08`, border: `1px solid ${C.gold}20`, borderRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><History size={20} color={C.gold} /><h4 style={{ margin: 0, color: C.gold }}>Histórico</h4></div>
          <p style={{ margin: 0, color: C.sub, fontSize: 13, lineHeight: 1.7 }}>El <strong style={{ color: C.text }}>diario de revisiones</strong>. Cada vez que revisas el mismo producto y ves un precio diferente, lo agregas aquí vinculado al seguimiento original.<br /><br /><strong style={{ color: C.text }}>Ejemplo:</strong> SRPD37 baja a $310 → Agregas H002 al SEG-001. La variación se calcula automáticamente.</p>
        </div>
      </div>
      <div style={{ padding: 20, background: `${C.ok}08`, border: `1px solid ${C.ok}20`, borderRadius: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><GitCompare size={20} color={C.ok} /><h4 style={{ margin: 0, color: C.ok }}>El flujo completo</h4></div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { icon: Eye, text: "Encuentras un reloj", color: C.info },
            { icon: List, text: "Registras en Seguimiento", color: C.info },
            { icon: Clock, text: "Pasan los días...", color: C.sub },
            { icon: RefreshCw, text: "Revisas el precio", color: C.gold },
            { icon: History, text: "Registras en Histórico", color: C.gold },
            { icon: TrendingDown, text: "¿Bajó? → Oportunidad", color: C.ok },
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${step.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><step.icon size={16} color={step.color} /></div>
              <span style={{ fontSize: 11, color: step.color, fontWeight: 600, maxWidth: 90 }}>{step.text}</span>
              {i < 5 && <ArrowRight size={14} color={C.dim} style={{ flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}><Btn onClick={onClose}>Entendido</Btn></div>
  </Modal>
);

// ═══════════════════════════════════════════════════════════════
// COMPARATOR WITH PAGINATION + PER-MODEL CHARTS
// ═══════════════════════════════════════════════════════════════
const Comparator = ({ trackings, history, search }) => {
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);

  const models = useMemo(() => {
    const map = {};
    trackings.forEach(t => {
      if (!t.reference) return;
      if (!map[t.reference]) map[t.reference] = { brand: t.brand, model: t.model, ref: t.reference, entries: [] };
      map[t.reference].entries.push(t);
    });
    let result = Object.values(map).filter(m => m.entries.length > 0).sort((a, b) => b.entries.length - a.entries.length);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(m => (m.brand + m.model + m.ref).toLowerCase().includes(s));
    }
    return result;
  }, [trackings, search]);

  const totalPages = Math.ceil(models.length / COMPARE_PER_PAGE);
  const paged = models.slice(page * COMPARE_PER_PAGE, (page + 1) * COMPARE_PER_PAGE);

  useEffect(() => { setPage(0); }, [search]);

  const getHistoryForRef = (ref) => {
    const ids = trackings.filter(t => t.reference === ref).map(t => t.id);
    return history.filter(h => ids.includes(h.trackingId)).sort((a, b) => new Date(a.revisionDate) - new Date(b.revisionDate));
  };

  const tt = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 };

  if (!models.length) return <div style={{ color: C.sub, padding: 40, textAlign: "center" }}><Layers size={28} style={{ opacity: 0.3, marginBottom: 6 }} /><br />No hay modelos para comparar</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: C.sub }}>{models.length} modelo(s) · Página {page + 1} de {totalPages}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn small variant="ghost" icon={ChevronLeft} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Anterior</Btn>
          <Btn small variant="ghost" icon={ChevronRight} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Siguiente</Btn>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {paged.map(m => {
          const prices = m.entries.map(e => e.publishedPrice).filter(Boolean);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
          const histData = getHistoryForRef(m.ref);
          const chartData = histData.map(h => ({ date: fmtD(h.revisionDate), price: h.observedPrice }));
          const isExpanded = expanded === m.ref;

          return (
            <div key={m.ref} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                onClick={() => setExpanded(isExpanded ? null : m.ref)}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: `${C.gold}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Tag size={18} color={C.gold} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{m.brand} {m.model}</div>
                    <div style={{ fontSize: 12, color: C.sub, fontFamily: "monospace" }}>{m.ref} · {m.entries.length} registro(s) · {histData.length} revisión(es)</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: C.sub, fontWeight: 700 }}>MÍN</div><div style={{ fontSize: 17, fontWeight: 800, color: C.ok }}>${fmt(min)}</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: C.sub, fontWeight: 700 }}>PROM</div><div style={{ fontSize: 17, fontWeight: 800, color: C.gold }}>${fmt(avg)}</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: C.sub, fontWeight: 700 }}>MÁX</div><div style={{ fontSize: 17, fontWeight: 800, color: C.err }}>${fmt(max)}</div></div>
                  <ChevronDown size={18} color={C.sub} style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </div>
              </div>

              {isExpanded && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: 20 }}>
                  {/* Price chart */}
                  {chartData.length >= 2 && (
                    <div style={{ marginBottom: 20 }}>
                      <h5 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: C.text, display: "flex", alignItems: "center", gap: 6 }}>
                        <TrendingDown size={15} color={C.gold} /> Evolución de precio
                      </h5>
                      <div style={{ background: C.input, borderRadius: 10, padding: "16px 12px", border: `1px solid ${C.border}` }}>
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={chartData}>
                            <defs><linearGradient id={`pg-${m.ref}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.gold} stopOpacity={0.3} /><stop offset="95%" stopColor={C.gold} stopOpacity={0} /></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                            <XAxis dataKey="date" tick={{ fill: C.sub, fontSize: 11 }} axisLine={{ stroke: C.border }} />
                            <YAxis domain={["dataMin - 15", "dataMax + 15"]} tick={{ fill: C.sub, fontSize: 11 }} axisLine={{ stroke: C.border }} tickFormatter={v => `$${v}`} />
                            <Tooltip contentStyle={tt} formatter={v => [`$${v}`, "Precio"]} />
                            <Area type="monotone" dataKey="price" stroke={C.gold} fill={`url(#pg-${m.ref})`} strokeWidth={2.5} dot={{ fill: C.gold, r: 5, stroke: C.bg, strokeWidth: 2 }} activeDot={{ r: 7, fill: C.gold }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  {chartData.length < 2 && chartData.length > 0 && (
                    <Alert type="info">Solo hay 1 revisión para este modelo. Agrega más revisiones en Histórico para ver la evolución de precio.</Alert>
                  )}

                  {/* Entries */}
                  <h5 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700 }}>Registros por sitio y vendedor</h5>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {m.entries.sort((a, b) => a.publishedPrice - b.publishedPrice).map(e => (
                      <div key={e.id} style={{ padding: "10px 16px", borderRadius: 10, background: e.publishedPrice === min ? `${C.ok}10` : C.input, border: `1px solid ${e.publishedPrice === min ? C.ok + "30" : C.border}`, minWidth: 160 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: e.publishedPrice === min ? C.ok : C.text, marginBottom: 4 }}>${fmt(e.publishedPrice)}</div>
                        <div style={{ fontSize: 12, color: C.sub }}>{e.website} · {e.vendor}</div>
                        <div style={{ fontSize: 11, color: C.dim }}>{fmtD(e.consultDate)}</div>
                        {e.publishedPrice === min && <Badge color={C.ok} small>Mejor precio</Badge>}
                      </div>
                    ))}
                  </div>

                  {/* History table */}
                  {histData.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <h5 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700 }}>Historial de revisiones</h5>
                      <DataTable columns={[
                        { key: "revisionDate", label: "Fecha", render: v => fmtD(v), nowrap: true },
                        { key: "observedPrice", label: "Precio", render: (v, r) => <span style={{ fontWeight: 700 }}>${fmt(v)}</span>, nowrap: true },
                        { key: "absoluteVariation", label: "Var.", render: v => v < 0 ? <span style={{ color: C.ok }}>−${Math.abs(v).toFixed(2)}</span> : v > 0 ? <span style={{ color: C.err }}>+${v.toFixed(2)}</span> : "—", nowrap: true },
                        { key: "percentVariation", label: "%", render: v => v !== 0 ? <span style={{ color: v < 0 ? C.ok : C.err }}>{v.toFixed(2)}%</span> : "—", nowrap: true },
                        { key: "source", label: "Fuente" },
                        { key: "observations", label: "Nota" },
                      ]} data={histData} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Pagination footer */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20 }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${page === i ? C.gold : C.border}`, background: page === i ? `${C.gold}20` : "transparent", color: page === i ? C.gold : C.sub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function WatchPulse() {
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const db = useSupabase();
  const { trackings, history, vendors, brands, loading: dbLoading, error: dbError } = db;
  const [modal, setModal] = useState(null);
  const [edit, setEdit] = useState(null);
  const [search, setSearch] = useState("");
  const [fWeek, setFWeek] = useState("");
  const [fMonth, setFMonth] = useState("");
  const [fQ, setFQ] = useState("");
  const [fBrand, setFBrand] = useState("");
  const [fResp, setFResp] = useState("");
  const [fOpp, setFOpp] = useState("");
  const [toasts, setToasts] = useState([]);
  const [showGuide, setShowGuide] = useState(false);
  const [dashTab, setDashTab] = useState("overview");

  const toast = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(n => n.id !== id)), 4000);
  }, []);

  const addBrand = useCallback(async (name) => {
    try { await db.addBrand(name); toast(`Marca "${name.trim().toUpperCase()}" agregada`, "success"); } catch (e) { toast("Error al agregar marca", "warning"); }
  }, [db, toast]);

  // GLOBAL SEARCH — works across all sections
  const globalSearch = (item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const all = Object.values(item).filter(v => v != null).join(" ").toLowerCase();
    return all.includes(s);
  };

  const getAlerts = useCallback((t) => {
    const a = [];
    if (!t.brand || !t.model || !t.publishedPrice) a.push({ type: "danger", msg: "Registro incompleto: falta marca, modelo o precio" });
    if (t.isNew === false) a.push({ type: "warning", msg: "Producto no es nuevo — fuera de criterio" });
    if (!t.includesBox) a.push({ type: "warning", msg: "Alerta comercial: no incluye caja" });
    if (!t.hasRFID) a.push({ type: "info", msg: "Sin tag RFID — verificar autenticidad" });
    if (t.warranty === "No especifica") a.push({ type: "info", msg: "Garantía no confirmada" });
    const v = vendors.find(x => x.name === t.vendor);
    if (v && (v.classification === "Riesgoso" || v.classification === "Descartado" || v.incidents)) a.push({ type: "danger", msg: `Alerta vendedor: ${v.classification}${v.incidents ? ` — ${v.incidents}` : ""}` });
    const dups = trackings.filter(x => x.id !== t.id && x.reference === t.reference && t.reference);
    if (dups.length > 0) a.push({ type: "info", msg: `Modelo también en: ${dups.map(d => d.displayId || d.id).join(", ")}` });
    const hist = history.filter(h => h.trackingId === t.id);
    if (hist.length > 1 && hist[hist.length - 1].absoluteVariation < 0) a.push({ type: "success", msg: `Precio en caída: ${hist[hist.length - 1].percentVariation.toFixed(1)}%` });
    if (t.targetPrice && t.publishedPrice && t.publishedPrice <= t.targetPrice) a.push({ type: "success", msg: `¡Precio alcanzó objetivo! (obj: $${fmt(t.targetPrice)})` });
    return a;
  }, [trackings, history, vendors]);

  const filtered = useMemo(() => trackings.filter(t => {
    if (fWeek && t.week !== parseInt(fWeek)) return false;
    if (fMonth && t.month !== parseInt(fMonth)) return false;
    if (fQ && t.quarter !== parseInt(fQ)) return false;
    if (fBrand && t.brand !== fBrand) return false;
    if (fResp && t.responsible !== fResp) return false;
    if (fOpp && t.opportunityState !== fOpp) return false;
    return globalSearch(t);
  }), [trackings, fWeek, fMonth, fQ, fBrand, fResp, fOpp, search]);

  const filteredHistory = useMemo(() => history.filter(globalSearch), [history, search]);
  const filteredVendors = useMemo(() => vendors.filter(globalSearch), [vendors, search]);

  const kpis = useMemo(() => {
    const cw = getWeek(new Date()), cm = new Date().getMonth() + 1, cq = getQ(new Date());
    return {
      week: trackings.filter(t => t.week === cw).length,
      month: trackings.filter(t => t.month === cm).length,
      quarter: trackings.filter(t => t.quarter === cq).length,
      models: new Set(trackings.filter(t => t.model).map(t => `${t.brand}-${t.model}`)).size,
      vendors: vendors.length,
      opps: trackings.filter(t => t.opportunityState === "Buena opción").length,
      revisit: trackings.filter(t => t.worthRevisiting).length,
      drops: history.filter(h => h.absoluteVariation < 0).length,
      incomplete: trackings.filter(t => !t.brand || !t.model || !t.publishedPrice).length,
      outCrit: trackings.filter(t => t.isNew === false).length,
      atTarget: trackings.filter(t => t.targetPrice && t.publishedPrice <= t.targetPrice).length,
      avgPrice: (() => { const p = trackings.filter(t => t.publishedPrice > 0); return p.length ? p.reduce((s, t) => s + t.publishedPrice, 0) / p.length : 0; })(),
      rfidCount: trackings.filter(t => t.hasRFID).length,
      totalRevisions: history.length,
    };
  }, [trackings, history, vendors]);

  const charts = useMemo(() => {
    const byW = {}; trackings.forEach(t => { byW[`S${t.week}`] = (byW[`S${t.week}`] || 0) + 1; });
    const byM = {}; trackings.forEach(t => { const m = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][t.month - 1]; byM[m] = (byM[m] || 0) + 1; });
    const byB = {}; trackings.forEach(t => { if (t.brand) byB[t.brand] = (byB[t.brand] || 0) + 1; });
    const byO = {}; trackings.forEach(t => { byO[t.opportunityState] = (byO[t.opportunityState] || 0) + 1; });
    const byCl = {}; vendors.forEach(v => { byCl[v.classification] = (byCl[v.classification] || 0) + 1; });
    const byWeb = {}; trackings.forEach(t => { byWeb[t.website] = (byWeb[t.website] || 0) + 1; });
    const byMod = {}; trackings.forEach(t => { if (t.model) { const k = `${t.brand} ${t.model}`; byMod[k] = (byMod[k] || 0) + 1; }});
    const targetVsActual = trackings.filter(t => t.targetPrice > 0).map(t => ({
      name: `${t.brand} ${t.model}`.substring(0, 18), actual: t.publishedPrice, target: t.targetPrice,
    }));
    return {
      week: Object.entries(byW).sort((a, b) => parseInt(a[0].slice(1)) - parseInt(b[0].slice(1))).map(([k, v]) => ({ name: k, registros: v })),
      month: Object.entries(byM).map(([k, v]) => ({ name: k, registros: v })),
      brand: Object.entries(byB).map(([k, v]) => ({ name: k, value: v })),
      opp: Object.entries(byO).map(([k, v]) => ({ name: k, value: v })),
      classif: Object.entries(byCl).map(([k, v]) => ({ name: k, value: v })),
      website: Object.entries(byWeb).map(([k, v]) => ({ name: k, value: v })),
      model: Object.entries(byMod).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => ({ name: k, value: v })),
      targetVsActual,
    };
  }, [trackings, vendors]);

  // CRUD — connected to Supabase
  const saveTracking = async (data) => {
    try {
      let state = "Activo";
      if (!data.brand || !data.model || !data.publishedPrice) state = "Incompleto";
      if (data.isNew === false) state = "Fuera de criterio";
      await db.saveTracking({ ...data, recordState: state }, edit?.id);
      if (data.brand && !brands.includes(data.brand.toUpperCase())) await db.addBrand(data.brand);
      toast(edit ? "Actualizado" : "Seguimiento creado", "success");
      setModal(null); setEdit(null);
    } catch (e) { toast("Error: " + e.message, "warning"); }
  };

  const saveHistory = async (data) => {
    try {
      await db.saveHistory(data, edit?.id);
      toast(edit ? "Revisión actualizada" : "Revisión agregada", "success");
      setModal(null); setEdit(null);
    } catch (e) { toast("Error: " + e.message, "warning"); }
  };

  const saveVendor = async (data) => {
    try {
      await db.saveVendor(data, edit?.id);
      toast(edit ? "Vendedor actualizado" : "Vendedor registrado", "success");
      setModal(null); setEdit(null);
    } catch (e) { toast("Error: " + e.message, "warning"); }
  };

  const del = async (type, id) => {
    try {
      if (type === "tracking") await db.deleteTracking(id);
      if (type === "history") await db.deleteHistory(id);
      if (type === "vendor") await db.deleteVendor(id);
      toast("Eliminado", "warning");
    } catch (e) { toast("Error: " + e.message, "warning"); }
  };

  const exportCSV = () => {
    const h = ["ID", "Fecha", "Marca", "Modelo", "Ref", "Precio", "Moneda", "Sitio", "Vendedor", "Oportunidad", "Estado", "RFID"];
    const rows = trackings.map(t => [t.displayId, t.consultDate, t.brand, t.model, t.reference, t.publishedPrice, t.currency, t.website, t.vendor, t.opportunityState, t.recordState, t.hasRFID ? "Sí" : "No"]);
    const csv = [h, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "watchpulse-export.csv"; a.click();
    toast("CSV exportado", "success");
  };

  const navItems = [
    { id: "dashboard", icon: Home, label: "Dashboard" },
    { id: "tracking", icon: List, label: "Seguimiento" },
    { id: "history", icon: History, label: "Histórico" },
    { id: "compare", icon: GitCompare, label: "Comparador" },
    { id: "vendors", icon: UserCheck, label: "Vendedores" },
  ];
  const tt = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 };

  // Loading screen
  if (dbLoading) return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: C.bg, color: C.gold, flexDirection: "column", gap: 16, fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@600;700&display=swap" rel="stylesheet" />
      <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${C.gold}, ${C.goldDk})`, display: "flex", alignItems: "center", justifyContent: "center", animation: "pulse 1.5s ease infinite" }}>
        <Clock size={24} color={C.bg} />
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif" }}>WatchPulse</div>
      <div style={{ fontSize: 13, color: C.sub }}>Conectando con Supabase...</div>
      <style>{`@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }`}</style>
    </div>
  );

  if (dbError) return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: C.bg, color: C.err, flexDirection: "column", gap: 16, fontFamily: "'DM Sans', sans-serif", padding: 40, textAlign: "center" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <AlertCircle size={40} />
      <div style={{ fontSize: 18, fontWeight: 700 }}>Error de conexión</div>
      <div style={{ fontSize: 14, color: C.sub, maxWidth: 400 }}>{dbError}</div>
      <div style={{ fontSize: 13, color: C.sub, marginTop: 8 }}>Verifica que las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén configuradas en tu archivo .env</div>
      <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 8, border: "none", background: C.gold, color: C.bg, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Reintentar</button>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: C.bg, color: C.text, fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@600;700&display=swap" rel="stylesheet" />

      {/* SIDEBAR */}
      <aside style={{ width: collapsed ? 64 : 230, background: C.card, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", transition: "width 0.2s ease", flexShrink: 0, overflow: "hidden" }}>
        <div style={{ padding: collapsed ? "18px 12px" : "18px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.gold}, ${C.goldDk})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Clock size={17} color={C.bg} strokeWidth={2.5} /></div>
          {!collapsed && <div><div style={{ fontSize: 16, fontWeight: 700, color: C.gold, fontFamily: "'Cormorant Garamond', serif" }}>WatchPulse</div><div style={{ fontSize: 9, color: C.sub, letterSpacing: "0.12em", textTransform: "uppercase" }}>Market Monitor v3</div></div>}
        </div>
        <nav style={{ flex: 1, padding: "14px 8px" }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: collapsed ? "11px 14px" : "11px 16px", borderRadius: 10, border: "none", cursor: "pointer", background: page === n.id ? `${C.gold}15` : "transparent", color: page === n.id ? C.gold : C.sub, fontSize: 13, fontWeight: page === n.id ? 700 : 500, transition: "all 0.15s", marginBottom: 3, justifyContent: collapsed ? "center" : "flex-start" }}
              onMouseEnter={e => { if (page !== n.id) e.currentTarget.style.background = `${C.gold}08`; }}
              onMouseLeave={e => { if (page !== n.id) e.currentTarget.style.background = "transparent"; }}>
              <n.icon size={18} />{!collapsed && n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "12px 8px", borderTop: `1px solid ${C.border}` }}>
          <button onClick={() => setShowGuide(true)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer", background: `${C.purple}10`, color: C.purple, fontSize: 12, fontWeight: 600, justifyContent: collapsed ? "center" : "flex-start" }}>
            <HelpCircle size={16} />{!collapsed && "¿Cómo funciona?"}
          </button>
        </div>
        <button onClick={() => setCollapsed(!collapsed)} style={{ padding: 14, border: "none", borderTop: `1px solid ${C.border}`, background: "none", color: C.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, overflow: "auto" }}>
        <header style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", background: `${C.bg}ee`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}` }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{navItems.find(n => n.id === page)?.label || "Dashboard"}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.sub }} />
              <input placeholder="Buscar en toda la plataforma..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ padding: "8px 14px 8px 36px", width: 260, borderRadius: 10, background: C.input, border: `1px solid ${search ? C.gold : C.border}`, color: C.text, fontSize: 13, outline: "none" }} />
              {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.sub, cursor: "pointer" }}><X size={14} /></button>}
            </div>
            <Btn small variant="ghost" icon={Download} onClick={exportCSV}>CSV</Btn>
            <div style={{ position: "relative" }}>
              <button style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Bell size={16} /></button>
              {kpis.incomplete > 0 && <div style={{ position: "absolute", top: -3, right: -3, width: 15, height: 15, borderRadius: "50%", background: C.err, fontSize: 9, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{kpis.incomplete}</div>}
            </div>
          </div>
        </header>

        {/* TOASTS */}
        <div style={{ position: "fixed", top: 14, right: 14, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
          {toasts.map(n => <div key={n.id} style={{ padding: "10px 20px", borderRadius: 10, background: n.type === "success" ? "#16a34a" : n.type === "warning" ? "#d97706" : "#2563eb", color: "#fff", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", animation: "slideIn 0.3s ease" }}>{n.msg}</div>)}
        </div>

        <div style={{ padding: "20px 24px" }}>

          {/* ═══ DASHBOARD ═══ */}
          {page === "dashboard" && (<>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[["overview", "Vista general"], ["analytics", "Analítica"], ["targets", "Precio objetivo"]].map(([id, l]) => <Pill key={id} active={dashTab === id} onClick={() => setDashTab(id)}>{l}</Pill>)}
            </div>

            {dashTab === "overview" && (<>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 18 }}>
                <KPI icon={Clock} label="Esta semana" value={kpis.week} color={C.gold} />
                <KPI icon={BarChart3} label="Este mes" value={kpis.month} color={C.info} />
                <KPI icon={Layers} label="Este trimestre" value={kpis.quarter} color={C.purple} />
                <KPI icon={Eye} label="Modelos monitoreados" value={kpis.models} color={C.cyan} />
                <KPI icon={Users} label="Vendedores" value={kpis.vendors} color="#f97316" />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 18 }}>
                <KPI icon={Target} label="Buenas opciones" value={kpis.opps} color={C.ok} />
                <KPI icon={RefreshCw} label="Para revisar" value={kpis.revisit} color={C.warn} />
                <KPI icon={TrendingDown} label="Caídas de precio" value={kpis.drops} color={C.gold} />
                <KPI icon={AlertCircle} label="Incompletos" value={kpis.incomplete} color={C.err} />
                <KPI icon={Crosshair} label="En precio objetivo" value={kpis.atTarget} color={C.ok} />
              </div>
              <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
                <div style={{ flex: 1, padding: "16px 20px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Precio promedio</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: C.gold }}>${fmt(kpis.avgPrice)}</div>
                </div>
                <div style={{ flex: 1, padding: "16px 20px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Con RFID</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: C.info }}>{kpis.rfidCount} <span style={{ fontSize: 14, color: C.sub }}>de {trackings.length}</span></div>
                </div>
                <div style={{ flex: 1, padding: "16px 20px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Total revisiones</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: C.purple }}>{kpis.totalRevisions}</div>
                </div>
              </div>

              {/* Pendientes */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <h4 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><RefreshCw size={16} color={C.warn} /> Pendientes de revisión ({kpis.revisit})</h4>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {trackings.filter(t => t.worthRevisiting).map(t => (
                    <div key={t.id} onClick={() => { setEdit(t); setModal("view"); setPage("tracking"); }} style={{ padding: "12px 16px", borderRadius: 10, background: C.input, border: `1px solid ${C.border}`, cursor: "pointer", flex: "1 1 220px", minWidth: 220, transition: "border-color 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = C.gold} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{t.brand} {t.model}</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: C.gold }}>${fmt(t.publishedPrice)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: C.sub }}>{t.displayId || t.id} · {t.vendor}</span>
                        <Badge color={oppC[t.opportunityState]} small>{t.opportunityState}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>)}

            {dashTab === "analytics" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 18 }}>
                <ChartCard title="Registros por semana"><ResponsiveContainer width="100%" height={230}><BarChart data={charts.week}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="name" tick={{ fill: C.sub, fontSize: 11 }} axisLine={{ stroke: C.border }} /><YAxis tick={{ fill: C.sub, fontSize: 11 }} axisLine={{ stroke: C.border }} /><Tooltip contentStyle={tt} /><Bar dataKey="registros" fill={C.gold} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
                <ChartCard title="Registros por mes"><ResponsiveContainer width="100%" height={230}><BarChart data={charts.month}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="name" tick={{ fill: C.sub, fontSize: 11 }} axisLine={{ stroke: C.border }} /><YAxis tick={{ fill: C.sub, fontSize: 11 }} axisLine={{ stroke: C.border }} /><Tooltip contentStyle={tt} /><Bar dataKey="registros" fill={C.info} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
                <ChartCard title="Marcas monitoreadas"><ResponsiveContainer width="100%" height={230}><PieChart><Pie data={charts.brand} cx="50%" cy="50%" outerRadius={85} innerRadius={48} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{charts.brand.map((_, i) => <Cell key={i} fill={PAL[i % PAL.length]} />)}</Pie><Tooltip contentStyle={tt} /></PieChart></ResponsiveContainer></ChartCard>
                <ChartCard title="Sitios web"><ResponsiveContainer width="100%" height={230}><PieChart><Pie data={charts.website} cx="50%" cy="50%" outerRadius={85} innerRadius={48} dataKey="value" label={({ name, value }) => `${name} (${value})`}>{charts.website.map((_, i) => <Cell key={i} fill={PAL[i % PAL.length]} />)}</Pie><Tooltip contentStyle={tt} /></PieChart></ResponsiveContainer></ChartCard>
                <ChartCard title="Modelos más monitoreados"><ResponsiveContainer width="100%" height={230}><BarChart data={charts.model} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis type="number" tick={{ fill: C.sub, fontSize: 11 }} axisLine={{ stroke: C.border }} /><YAxis dataKey="name" type="category" tick={{ fill: C.sub, fontSize: 11 }} width={130} axisLine={{ stroke: C.border }} /><Tooltip contentStyle={tt} /><Bar dataKey="value" fill={C.ok} radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></ChartCard>
                <ChartCard title="Estados de oportunidad"><ResponsiveContainer width="100%" height={230}><PieChart><Pie data={charts.opp} cx="50%" cy="50%" outerRadius={85} innerRadius={48} dataKey="value" label={({ value }) => value}>{charts.opp.map((e, i) => <Cell key={i} fill={oppC[e.name] || PAL[i]} />)}</Pie><Tooltip contentStyle={tt} /><Legend wrapperStyle={{ fontSize: 10 }} /></PieChart></ResponsiveContainer></ChartCard>
                <ChartCard title="Vendedores por clasificación"><ResponsiveContainer width="100%" height={230}><BarChart data={charts.classif}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="name" tick={{ fill: C.sub, fontSize: 11 }} axisLine={{ stroke: C.border }} /><YAxis tick={{ fill: C.sub, fontSize: 11 }} axisLine={{ stroke: C.border }} /><Tooltip contentStyle={tt} /><Bar dataKey="value" radius={[6, 6, 0, 0]}>{charts.classif.map((e, i) => <Cell key={i} fill={classC[e.name] || PAL[i]} />)}</Bar></BarChart></ResponsiveContainer></ChartCard>
              </div>
            )}

            {dashTab === "targets" && (<>
              <Alert type="info">Define un precio objetivo por producto. Cuando el precio publicado llega a tu objetivo, el sistema te alerta automáticamente.</Alert>
              {charts.targetVsActual.length > 0 ? (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginTop: 16, marginBottom: 20 }}>
                  <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Precio actual vs Objetivo</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={charts.targetVsActual} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis type="number" tick={{ fill: C.sub, fontSize: 11 }} tickFormatter={v => `$${v}`} axisLine={{ stroke: C.border }} /><YAxis dataKey="name" type="category" tick={{ fill: C.sub, fontSize: 11 }} width={140} axisLine={{ stroke: C.border }} /><Tooltip contentStyle={tt} formatter={v => `$${v}`} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="actual" fill={C.info} name="Actual" radius={[0, 4, 4, 0]} /><Bar dataKey="target" fill={C.ok} name="Objetivo" radius={[0, 4, 4, 0]} /></BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <div style={{ color: C.sub, textAlign: "center", padding: 40 }}>No hay productos con precio objetivo</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {trackings.filter(t => t.targetPrice > 0).sort((a, b) => (a.publishedPrice - a.targetPrice) - (b.publishedPrice - b.targetPrice)).map(t => {
                  const diff = t.publishedPrice - t.targetPrice;
                  const pct = ((diff / t.targetPrice) * 100).toFixed(1);
                  const reached = diff <= 0;
                  return (
                    <div key={t.id} style={{ padding: "14px 18px", background: C.card, border: `1px solid ${reached ? C.ok + "40" : C.border}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                      <div><div style={{ fontSize: 14, fontWeight: 700 }}>{t.brand} {t.model} <span style={{ color: C.sub, fontWeight: 400, fontSize: 12 }}>({t.reference})</span></div><div style={{ fontSize: 12, color: C.sub }}>{t.vendor} · {t.website}</div></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: C.sub }}>ACTUAL</div><div style={{ fontSize: 16, fontWeight: 800 }}>${fmt(t.publishedPrice)}</div></div>
                        <ArrowRight size={16} color={C.dim} />
                        <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: C.sub }}>OBJETIVO</div><div style={{ fontSize: 16, fontWeight: 800, color: C.ok }}>${fmt(t.targetPrice)}</div></div>
                        <Badge color={reached ? C.ok : parseFloat(pct) < 10 ? C.warn : C.err}>{reached ? "ALCANZADO" : `+${pct}%`}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>)}
          </>)}

          {/* ═══ TRACKING ═══ */}
          {page === "tracking" && (<>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <Filter size={14} color={C.sub} />
                {[
                  [fWeek, setFWeek, "Semana", [...new Set(trackings.map(t => t.week))].sort((a,b)=>a-b).map(w => ({ v: String(w), l: `S${w} · ${getWeekRange(2026, w)}` }))],
                  [fMonth, setFMonth, "Mes", [1,2,3,4,5,6,7,8,9,10,11,12].map(m => ({ v: String(m), l: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][m-1] }))],
                  [fQ, setFQ, "Trimestre", [1,2,3,4].map(q => ({ v: String(q), l: `Q${q}` }))],
                ].map(([val, setVal, label, opts]) => (
                  <select key={label} value={val} onChange={e => setVal(e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, background: C.input, border: `1px solid ${val ? C.gold : C.border}`, color: val ? C.gold : C.sub, fontSize: 12, cursor: "pointer" }}>
                    <option value="">{label}</option>
                    {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                ))}
                <select value={fBrand} onChange={e => setFBrand(e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, background: C.input, border: `1px solid ${fBrand ? C.gold : C.border}`, color: fBrand ? C.gold : C.sub, fontSize: 12, cursor: "pointer" }}><option value="">Marca</option>{brands.map(b => <option key={b} value={b}>{b}</option>)}</select>
                <select value={fResp} onChange={e => setFResp(e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, background: C.input, border: `1px solid ${fResp ? C.gold : C.border}`, color: fResp ? C.gold : C.sub, fontSize: 12, cursor: "pointer" }}><option value="">Responsable</option>{RESPONSIBLES.map(r => <option key={r} value={r}>{r}</option>)}</select>
                <select value={fOpp} onChange={e => setFOpp(e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, background: C.input, border: `1px solid ${fOpp ? C.gold : C.border}`, color: fOpp ? C.gold : C.sub, fontSize: 12, cursor: "pointer" }}><option value="">Oportunidad</option>{OPP_STATES.map(o => <option key={o} value={o}>{o}</option>)}</select>
                {(fWeek || fMonth || fQ || fBrand || fResp || fOpp) && <Btn small variant="ghost" icon={X} onClick={() => { setFWeek(""); setFMonth(""); setFQ(""); setFBrand(""); setFResp(""); setFOpp(""); }}>Limpiar</Btn>}
              </div>
              <Btn icon={Plus} onClick={() => { setEdit(null); setModal("tracking"); }}>Nuevo seguimiento</Btn>
            </div>
            <DataTable columns={[
              { key: "displayId", label: "ID", nowrap: true, render: v => <span style={{ fontWeight: 700, color: C.gold, fontFamily: "monospace" }}>{v}</span> },
              { key: "consultDate", label: "Fecha", nowrap: true, render: v => fmtD(v) },
              { key: "week", label: "Sem.", nowrap: true, render: v => <span style={{ color: C.sub }}>S{v}</span> },
              { key: "brand", label: "Marca", render: v => v || <span style={{ color: C.err }}>—</span> },
              { key: "model", label: "Modelo", render: (v, r) => <div><div style={{ fontWeight: 600 }}>{v || <span style={{ color: C.err }}>—</span>}</div>{r.reference && <div style={{ fontSize: 11, color: C.sub }}>{r.reference}</div>}</div> },
              { key: "publishedPrice", label: "Precio", nowrap: true, render: (v, r) => v ? <span style={{ fontWeight: 700 }}>${fmt(v)} <span style={{ fontSize: 10, color: C.sub }}>{r.currency}</span></span> : <span style={{ color: C.err }}>—</span> },
              { key: "website", label: "Sitio", nowrap: true, render: v => <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Globe size={12} color={C.sub} />{v}</div> },
              { key: "vendor", label: "Vendedor", maxW: 130 },
              { key: "hasRFID", label: "RFID", render: v => v ? <Radio size={14} color={C.ok} /> : <span style={{ color: C.dim }}>—</span> },
              { key: "opportunityState", label: "Oportunidad", render: v => <Badge color={oppC[v]} small>{v}</Badge> },
              { key: "recordState", label: "Estado", render: v => <Badge color={v === "Activo" ? C.ok : v === "Incompleto" ? C.err : C.sub} small>{v}</Badge> },
              { key: "consultDate", label: "Días", nowrap: true, render: (v) => {
                const days = Math.floor((new Date() - new Date(v)) / 86400000);
                const color = days <= 3 ? C.ok : days <= 7 ? C.gold : days <= 14 ? C.warn : C.err;
                return <span style={{ fontSize: 12, fontWeight: 700, color, display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} />{days}d</span>;
              }},
              { key: "worthRevisiting", label: "Rev", render: (v, row) => (
                <button onClick={async (e) => { e.stopPropagation(); try { await db.toggleRevisit(row.id, row.worthRevisiting); toast(v ? "Desmarcado" : "Marcado para revisar", "info"); } catch(err) { toast("Error", "warning"); } }}
                  style={{ background: v ? `${C.warn}18` : "transparent", border: `1px solid ${v ? C.warn + "40" : C.border}`, borderRadius: 6, color: v ? C.warn : C.dim, cursor: "pointer", padding: "3px 6px", display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, transition: "all 0.15s" }}
                  title={v ? "Clic para desmarcar" : "Clic para marcar como revisar"}>
                  <RefreshCw size={12} />{v ? "Sí" : "—"}
                </button>
              )},
              { key: "_", label: "", render: (_, row) => (
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={e => { e.stopPropagation(); setEdit(row); setModal("view"); }} style={{ background: "none", border: "none", color: C.sub, cursor: "pointer", padding: 3 }}><Eye size={15} /></button>
                  <button onClick={e => { e.stopPropagation(); setEdit(row); setModal("tracking"); }} style={{ background: "none", border: "none", color: C.sub, cursor: "pointer", padding: 3 }}><Edit3 size={15} /></button>
                  <button onClick={e => { e.stopPropagation(); del("tracking", row.id); }} style={{ background: "none", border: "none", color: C.err, cursor: "pointer", padding: 3, opacity: 0.5 }}><Trash2 size={15} /></button>
                </div>
              )},
            ]} data={filtered} onRowClick={row => { setEdit(row); setModal("view"); }} sortable />
            <div style={{ marginTop: 10, fontSize: 12, color: C.sub }}>{filtered.length} de {trackings.length} registros</div>
          </>)}

          {/* ═══ HISTORY ═══ */}
          {page === "history" && (<>
            <div style={{ padding: "14px 18px", background: `${C.gold}08`, border: `1px solid ${C.gold}20`, borderRadius: 10, marginBottom: 18, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <History size={18} color={C.gold} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
                <strong style={{ color: C.gold }}>Histórico de precios</strong> → Cuando revisas un producto y ves un precio diferente, agrega una revisión vinculada al seguimiento. <strong style={{ color: C.text }}>La variación se calcula automáticamente</strong> al seleccionar el seguimiento y el nuevo precio.
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: C.sub }}>{filteredHistory.length} revisiones</div>
              <Btn icon={Plus} onClick={() => { setEdit(null); setModal("history"); }}>Nueva revisión</Btn>
            </div>
            <DataTable columns={[
              { key: "displayId", label: "ID", nowrap: true, render: v => <span style={{ fontFamily: "monospace", color: C.gold, fontWeight: 700 }}>{v}</span> },
              { key: "trackingDisplayId", label: "Seguimiento", nowrap: true, render: (v, row) => { const t = trackings.find(x => x.id === row.trackingId); return <div><span style={{ fontFamily: "monospace", fontWeight: 600 }}>{v || row.trackingId}</span>{t && <div style={{ fontSize: 11, color: C.sub }}>{t.brand} {t.model}</div>}</div>; }},
              { key: "revisionDate", label: "Fecha", nowrap: true, render: v => fmtD(v) },
              { key: "source", label: "Fuente", render: v => v || "—" },
              { key: "observedPrice", label: "Precio", nowrap: true, render: (v, r) => <span style={{ fontWeight: 700 }}>${fmt(v)} <span style={{ fontSize: 10, color: C.sub }}>{r.currency}</span></span> },
              { key: "absoluteVariation", label: "Var.", nowrap: true, render: v => <span style={{ color: v < 0 ? C.ok : v > 0 ? C.err : C.sub, fontWeight: 600 }}>{v < 0 ? `−$${Math.abs(v).toFixed(2)}` : v > 0 ? `+$${v.toFixed(2)}` : "—"}</span> },
              { key: "percentVariation", label: "%", nowrap: true, render: v => <span style={{ display: "flex", alignItems: "center", gap: 3, color: v < 0 ? C.ok : v > 0 ? C.err : C.sub, fontWeight: 600 }}>{v < 0 ? <TrendingDown size={13} /> : v > 0 ? <TrendingUp size={13} /> : null}{v !== 0 ? `${v.toFixed(2)}%` : "—"}</span> },
              { key: "isActive", label: "Activo", render: v => v ? <CheckCircle size={15} color={C.ok} /> : <XCircle size={15} color={C.dim} /> },
              { key: "observations", label: "Notas", maxW: 200 },
              { key: "_", label: "", render: (_, row) => <div style={{ display: "flex", gap: 4 }}>
                <button onClick={e => { e.stopPropagation(); setEdit(row); setModal("history"); }} style={{ background: "none", border: "none", color: C.sub, cursor: "pointer", padding: 3 }}><Edit3 size={15} /></button>
                <button onClick={e => { e.stopPropagation(); del("history", row.id); }} style={{ background: "none", border: "none", color: C.err, cursor: "pointer", padding: 3, opacity: 0.5 }}><Trash2 size={15} /></button>
              </div>},
            ]} data={filteredHistory} sortable />
          </>)}

          {/* ═══ COMPARE ═══ */}
          {page === "compare" && (<>
            <div style={{ padding: "14px 18px", background: `${C.info}08`, border: `1px solid ${C.info}20`, borderRadius: 10, marginBottom: 18, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <GitCompare size={18} color={C.info} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
                <strong style={{ color: C.info }}>Comparador de precios</strong> → Agrupa registros por referencia, muestra mín/prom/máx, y cada modelo tiene su gráfico de evolución de precio. Haz clic en un modelo para expandirlo. Paginado a {COMPARE_PER_PAGE} modelos por página.
              </div>
            </div>
            <Comparator trackings={trackings} history={history} search={search} />
          </>)}

          {/* ═══ VENDORS ═══ */}
          {page === "vendors" && (<>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: C.sub }}>{filteredVendors.length} vendedores</div>
              <Btn icon={Plus} onClick={() => { setEdit(null); setModal("vendor"); }}>Nuevo vendedor</Btn>
            </div>
            <DataTable columns={[
              { key: "id", label: "ID", nowrap: true, render: v => <span style={{ fontFamily: "monospace", color: C.gold, fontWeight: 700 }}>{v}</span> },
              { key: "name", label: "Vendedor", render: v => <span style={{ fontWeight: 700 }}>{v}</span> },
              { key: "platform", label: "Plataforma", nowrap: true, render: v => <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Globe size={12} color={C.sub} />{v}</div> },
              { key: "country", label: "País" },
              { key: "reputation", label: "Reputación", render: v => v ? <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Star size={12} color={C.warn} />{v}</div> : "—" },
              { key: "classification", label: "Clasificación", render: v => <Badge color={classC[v]}>{v}</Badge> },
              { key: "incidents", label: "Incidencias", render: v => v ? <span style={{ color: C.err }}>{v}</span> : <span style={{ color: C.dim }}>Ninguna</span> },
              { key: "observations", label: "Observaciones", maxW: 200 },
              { key: "_", label: "", render: (_, row) => <div style={{ display: "flex", gap: 4 }}>
                <button onClick={e => { e.stopPropagation(); setEdit(row); setModal("vendor"); }} style={{ background: "none", border: "none", color: C.sub, cursor: "pointer", padding: 3 }}><Edit3 size={15} /></button>
                <button onClick={e => { e.stopPropagation(); del("vendor", row.id); }} style={{ background: "none", border: "none", color: C.err, cursor: "pointer", padding: 3, opacity: 0.5 }}><Trash2 size={15} /></button>
              </div>},
            ]} data={filteredVendors} onRowClick={row => { setEdit(row); setModal("vendor"); }} sortable />
          </>)}
        </div>
      </main>

      {/* ═══ MODALS ═══ */}
      <GuideModal open={showGuide} onClose={() => setShowGuide(false)} />

      {/* VIEW DETAIL */}
      <Modal open={modal === "view"} onClose={() => { setModal(null); setEdit(null); }} title={`Detalle — ${edit?.displayId || edit?.id || ""}`} wide>
        {edit && (() => {
          const alerts = getAlerts(edit);
          const hist = history.filter(h => h.trackingId === edit.id);
          return (
            <div>
              {alerts.length > 0 && <div style={{ marginBottom: 16 }}>{alerts.map((a, i) => <Alert key={i} type={a.type}>{a.msg}</Alert>)}</div>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px 24px", marginBottom: 20 }}>
                {[
                  ["ID", edit.displayId || edit.id], ["Fecha", fmtD(edit.consultDate)], ["Semana / Mes / Q", `S${edit.week} · ${["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][edit.month-1]} · Q${edit.quarter}`],
                  ["Marca", edit.brand], ["Modelo", edit.model], ["Referencia", edit.reference],
                  ["Precio", `$${fmt(edit.publishedPrice)} ${edit.currency}`], ["Precio objetivo", edit.targetPrice ? `$${fmt(edit.targetPrice)}` : "No definido"], ["Sitio web", edit.website],
                  ["Vendedor", edit.vendor], ["Reputación", edit.vendorReputation || "—"], ["RFID", edit.hasRFID ? "Sí" : "No"],
                  ["Nuevo", edit.isNew ? "Sí" : "No"], ["Caja", edit.includesBox ? "Sí" : "No"], ["Garantía", edit.warranty],
                  ["Tipo", edit.trackingType], ["Responsable", edit.responsible], ["Oportunidad", edit.opportunityState],
                  ["Revisar", edit.worthRevisiting ? "Sí" : "No"], ["Estado", edit.recordState],
                ].map(([l, v], i) => <div key={i}><div style={{ fontSize: 10, color: C.sub, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 3 }}>{l}</div><div style={{ fontSize: 14, fontWeight: 500 }}>{v || <span style={{ color: C.dim }}>—</span>}</div></div>)}
              </div>
              {edit.observations && <div style={{ padding: "12px 16px", background: C.input, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 16 }}><div style={{ fontSize: 10, color: C.sub, marginBottom: 4, fontWeight: 700, textTransform: "uppercase" }}>Observaciones</div><div style={{ fontSize: 13 }}>{edit.observations}</div></div>}
              {edit.url && <a href={edit.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: `${C.gold}12`, border: `1px solid ${C.gold}25`, color: C.gold, fontSize: 13, fontWeight: 600, textDecoration: "none", marginBottom: 16 }}><ExternalLink size={14} /> Abrir enlace</a>}
              {hist.length > 0 && <div style={{ marginTop: 16 }}><h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><History size={16} color={C.gold} /> Historial ({hist.length})</h4>
                <DataTable columns={[
                  { key: "revisionDate", label: "Fecha", render: v => fmtD(v) },
                  { key: "observedPrice", label: "Precio", render: (v, r) => `$${fmt(v)} ${r.currency}` },
                  { key: "absoluteVariation", label: "Var.", render: v => v < 0 ? <span style={{ color: C.ok }}>−${Math.abs(v).toFixed(2)}</span> : v > 0 ? <span style={{ color: C.err }}>+${v.toFixed(2)}</span> : "—" },
                  { key: "percentVariation", label: "%", render: v => v !== 0 ? <span style={{ color: v < 0 ? C.ok : C.err }}>{v.toFixed(2)}%</span> : "—" },
                  { key: "observations", label: "Nota" },
                ]} data={hist} />
              </div>}
              <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
                <Btn variant="ghost" icon={Edit3} onClick={() => setModal("tracking")}>Editar</Btn>
                <Btn variant="ghost" onClick={() => { setModal(null); setEdit(null); }}>Cerrar</Btn>
              </div>
            </div>
          );
        })()}
      </Modal>

      <TrackingForm open={modal === "tracking"} onClose={() => { setModal(null); setEdit(null); }} onSave={saveTracking} initial={edit} vendors={vendors} brands={brands} onAddBrand={addBrand} trackings={trackings} />
      <HistoryForm open={modal === "history"} onClose={() => { setModal(null); setEdit(null); }} onSave={saveHistory} initial={edit} trackings={trackings} history={history} />
      <VendorForm open={modal === "vendor"} onClose={() => { setModal(null); setEdit(null); }} onSave={saveVendor} initial={edit} />

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        select option { background: ${C.card}; color: ${C.text}; }
        @keyframes slideIn { from { transform: translateX(80px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TRACKING FORM — no carrier, RFID instead of manual
// ═══════════════════════════════════════════════════════════════
function TrackingForm({ open, onClose, onSave, initial, vendors, brands, onAddBrand, trackings }) {
  const blank = { consultDate: new Date().toISOString().split("T")[0], website: "", url: "", vendor: "", vendorReputation: "", brand: "", model: "", reference: "", publishedPrice: "", currency: "USD", isNew: true, includesBox: true, hasRFID: false, warranty: "Fabricante", worthRevisiting: false, trackingType: "Solo referencia de mercado", responsible: "Christian", observations: "", opportunityState: "Solo seguimiento", targetPrice: "" };
  const [form, setForm] = useState(blank);
  const [newBrand, setNewBrand] = useState("");
  const [showNewBrand, setShowNewBrand] = useState(false);

  useEffect(() => { if (open) { setForm(initial ? { ...initial, publishedPrice: String(initial.publishedPrice || ""), targetPrice: String(initial.targetPrice || "") } : blank); setShowNewBrand(false); setNewBrand(""); } }, [open, initial]);
  const s = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  const handleAddBrand = () => { if (newBrand.trim()) { onAddBrand(newBrand); s("brand")(newBrand.trim().toUpperCase()); setShowNewBrand(false); setNewBrand(""); } };

  // Duplicate detection
  const duplicates = useMemo(() => {
    if (!form.reference || !trackings) return [];
    return trackings.filter(t => t.reference === form.reference && (!initial || t.id !== initial.id));
  }, [form.reference, trackings, initial]);

  // Auto-fill vendor reputation from existing vendors
  useEffect(() => {
    if (form.vendor && vendors) {
      const v = vendors.find(x => x.name === form.vendor);
      if (v && v.reputation && !form.vendorReputation) {
        setForm(p => ({ ...p, vendorReputation: v.reputation }));
      }
    }
  }, [form.vendor, vendors]);

  return (
    <Modal open={open} onClose={onClose} title={initial ? `Editar ${initial.displayId || initial.id}` : "Nuevo seguimiento"} wide>
      {duplicates.length > 0 && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 16px", background: `${C.warn}10`, border: `1px solid ${C.warn}25`, borderRadius: 8, fontSize: 13, color: C.warn, marginBottom: 14 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Referencia ya registrada</strong> — {form.reference} existe en: {duplicates.map(d => (
              <span key={d.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 8px", borderRadius: 4, background: `${C.warn}15`, marginLeft: 4, fontSize: 12, fontFamily: "monospace" }}>
                {d.id} · ${fmt(d.publishedPrice)} · {d.website}
              </span>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 18px" }}>
        <Input label="Fecha de consulta" type="date" value={form.consultDate} onChange={s("consultDate")} required />
        <Input label="Sitio web" options={SITES} value={form.website} onChange={s("website")} required />
        <Input label="URL del producto" value={form.url} onChange={s("url")} placeholder="https://..." />
        <Input label="Vendedor / proveedor" value={form.vendor} onChange={s("vendor")} placeholder="Nombre" />
        <Input label="Reputación vendedor" value={form.vendorReputation} onChange={s("vendorReputation")} placeholder="99.2%, 4.5/5" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 18px" }}>
        <div>
          <Input label="Marca" options={brands} value={form.brand} onChange={s("brand")} required
            extra={<button onClick={() => setShowNewBrand(!showNewBrand)} style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", fontSize: 10, fontWeight: 700, marginLeft: 4 }}><PlusCircle size={12} style={{ verticalAlign: "middle" }} /> Nueva</button>} />
          {showNewBrand && <div style={{ display: "flex", gap: 8, marginTop: -8, marginBottom: 14 }}>
            <input value={newBrand} onChange={e => setNewBrand(e.target.value)} placeholder="Nombre..." onKeyDown={e => e.key === "Enter" && handleAddBrand()} style={{ flex: 1, padding: "8px 12px", background: C.input, border: `1px solid ${C.gold}40`, borderRadius: 8, color: C.text, fontSize: 13, outline: "none" }} />
            <Btn small onClick={handleAddBrand} icon={Check}>Agregar</Btn>
          </div>}
        </div>
        <Input label="Modelo" value={form.model} onChange={s("model")} placeholder="Presage, PRX..." required />
        <Input label="Referencia exacta" value={form.reference} onChange={s("reference")} placeholder="SRPD37" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 18px" }}>
        <Input label="Precio publicado" type="number" value={form.publishedPrice} onChange={s("publishedPrice")} placeholder="0.00" required />
        <Input label="Precio objetivo" type="number" value={form.targetPrice} onChange={s("targetPrice")} placeholder="Tu precio ideal" extra={<span style={{ color: C.dim, fontWeight: 400, fontSize: 9, textTransform: "none" }}> (opcional)</span>} />
        <Input label="Moneda" options={CURRENCIES} value={form.currency} onChange={s("currency")} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 18px" }}>
        <Input label="Garantía" options={WARRANTIES} value={form.warranty} onChange={s("warranty")} />
        <Input label="Tipo de seguimiento" options={TRACKING_TYPES} value={form.trackingType} onChange={s("trackingType")} />
        <Input label="Responsable" options={RESPONSIBLES} value={form.responsible} onChange={s("responsible")} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 18px" }}>
        <Toggle label="Producto nuevo" value={form.isNew} onChange={s("isNew")} />
        <Toggle label="Incluye caja" value={form.includesBox} onChange={s("includesBox")} />
        <Toggle label="Incluye RFID" value={form.hasRFID} onChange={s("hasRFID")} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
        <Toggle label="¿Vale la pena revisar?" value={form.worthRevisiting} onChange={s("worthRevisiting")} />
        <Input label="Estado de oportunidad" options={OPP_STATES} value={form.opportunityState} onChange={s("opportunityState")} />
      </div>
      <Input label="Observaciones" textarea value={form.observations} onChange={s("observations")} placeholder="Notas, contexto..." />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn icon={Check} onClick={() => onSave({ ...form, publishedPrice: parseFloat(form.publishedPrice) || 0, targetPrice: parseFloat(form.targetPrice) || 0 })}>{initial ? "Guardar cambios" : "Crear seguimiento"}</Btn>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// HISTORY FORM — auto-calculated variations
// ═══════════════════════════════════════════════════════════════
function HistoryForm({ open, onClose, onSave, initial, trackings, history }) {
  const blank = { trackingId: "", revisionDate: new Date().toISOString().split("T")[0], observedPrice: "", currency: "USD", absoluteVariation: 0, percentVariation: 0, isActive: true, observations: "", source: "" };
  const [form, setForm] = useState(blank);
  useEffect(() => { if (open) setForm(initial ? { ...initial, observedPrice: String(initial.observedPrice || "") } : blank); }, [open, initial]);
  const s = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  const linked = form.trackingId ? trackings.find(x => x.id === form.trackingId) : null;

  // Get previous price for auto-calc
  const prevPrice = useMemo(() => {
    if (!form.trackingId) return null;
    const revisions = history.filter(h => h.trackingId === form.trackingId).sort((a, b) => new Date(b.revisionDate) - new Date(a.revisionDate));
    if (revisions.length > 0) return revisions[0].observedPrice;
    if (linked) return linked.publishedPrice;
    return null;
  }, [form.trackingId, history, linked]);

  // Auto-calculate variations when price changes
  useEffect(() => {
    if (prevPrice && form.observedPrice) {
      const price = parseFloat(form.observedPrice);
      if (!isNaN(price) && price > 0) {
        const absVar = price - prevPrice;
        const pctVar = (absVar / prevPrice) * 100;
        setForm(p => ({ ...p, absoluteVariation: Math.round(absVar * 100) / 100, percentVariation: Math.round(pctVar * 100) / 100 }));
      }
    } else {
      setForm(p => ({ ...p, absoluteVariation: 0, percentVariation: 0 }));
    }
  }, [form.observedPrice, prevPrice]);

  return (
    <Modal open={open} onClose={onClose} title={initial ? `Editar revisión ${initial.displayId || initial.id}` : "Nueva revisión de precio"}>
      {/* Tracking selector showing display IDs */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: C.sub, marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" }}>ID Seguimiento<span style={{ color: C.err }}>*</span></label>
        <select value={form.trackingId} onChange={e => s("trackingId")(parseInt(e.target.value) || "")}
          style={{ width: "100%", padding: "10px 14px", background: C.input, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, cursor: "pointer", outline: "none" }}>
          <option value="">Seleccionar...</option>
          {trackings.map(t => <option key={t.id} value={t.id}>{t.displayId} — {t.brand} {t.model} ({t.reference})</option>)}
        </select>
      </div>
      {linked && (
        <div style={{ padding: "10px 14px", background: C.input, borderRadius: 8, marginBottom: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
            <Tag size={14} color={C.gold} />
            <span style={{ fontWeight: 600 }}>{linked.brand} {linked.model}</span>
            <span style={{ color: C.sub }}>· {linked.reference}</span>
          </div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>
            Precio actual: <strong style={{ color: C.text }}>${fmt(linked.publishedPrice)}</strong>
            {prevPrice && prevPrice !== linked.publishedPrice && <span> · Última revisión: <strong style={{ color: C.text }}>${fmt(prevPrice)}</strong></span>}
          </div>
        </div>
      )}
      <Input label="Fecha de revisión" type="date" value={form.revisionDate} onChange={s("revisionDate")} required />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Input label="Precio observado" type="number" value={form.observedPrice} onChange={s("observedPrice")} required placeholder={prevPrice ? `Anterior: $${fmt(prevPrice)}` : "0.00"} />
        <Input label="Moneda" options={CURRENCIES} value={form.currency} onChange={s("currency")} />
      </div>
      <Input label="Fuente / Sitio" options={SITES} value={form.source} onChange={s("source")} />

      {/* Auto-calculated display */}
      {form.observedPrice && prevPrice && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div style={{ padding: "12px 16px", background: `${form.absoluteVariation < 0 ? C.ok : form.absoluteVariation > 0 ? C.err : C.sub}10`, border: `1px solid ${form.absoluteVariation < 0 ? C.ok : form.absoluteVariation > 0 ? C.err : C.sub}25`, borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: C.sub, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Variación absoluta (auto)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: form.absoluteVariation < 0 ? C.ok : form.absoluteVariation > 0 ? C.err : C.sub }}>
              {form.absoluteVariation < 0 ? `−$${Math.abs(form.absoluteVariation).toFixed(2)}` : form.absoluteVariation > 0 ? `+$${form.absoluteVariation.toFixed(2)}` : "$0.00"}
            </div>
          </div>
          <div style={{ padding: "12px 16px", background: `${form.percentVariation < 0 ? C.ok : form.percentVariation > 0 ? C.err : C.sub}10`, border: `1px solid ${form.percentVariation < 0 ? C.ok : form.percentVariation > 0 ? C.err : C.sub}25`, borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: C.sub, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Variación porcentual (auto)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: form.percentVariation < 0 ? C.ok : form.percentVariation > 0 ? C.err : C.sub, display: "flex", alignItems: "center", gap: 6 }}>
              {form.percentVariation < 0 ? <TrendingDown size={20} /> : form.percentVariation > 0 ? <TrendingUp size={20} /> : null}
              {form.percentVariation.toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      <Toggle label="¿Sigue activo?" value={form.isActive} onChange={s("isActive")} />
      <Input label="Observaciones" textarea value={form.observations} onChange={s("observations")} />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn icon={Check} onClick={() => onSave({ ...form, observedPrice: parseFloat(form.observedPrice) || 0 })}>{initial ? "Guardar" : "Agregar revisión"}</Btn>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// VENDOR FORM
// ═══════════════════════════════════════════════════════════════
function VendorForm({ open, onClose, onSave, initial }) {
  const blank = { name: "", platform: "", country: "", reputation: "", classification: "En observación", incidents: "", observations: "", createdAt: new Date().toISOString().split("T")[0] };
  const [form, setForm] = useState(blank);
  useEffect(() => { if (open) setForm(initial || blank); }, [open, initial]);
  const s = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} title={initial ? `Editar — ${initial.name}` : "Nuevo vendedor"}>
      <Input label="Nombre del vendedor" value={form.name} onChange={s("name")} required />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Input label="Plataforma" options={SITES} value={form.platform} onChange={s("platform")} />
        <Input label="País" value={form.country} onChange={s("country")} placeholder="USA, Japón..." />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Input label="Reputación" value={form.reputation} onChange={s("reputation")} placeholder="99.2%, 4.5/5" />
        <Input label="Clasificación" options={VENDOR_CLASS} value={form.classification} onChange={s("classification")} />
      </div>
      <Input label="Incidencias" value={form.incidents} onChange={s("incidents")} placeholder="Ej: 1 retraso en envío..." />
      <Input label="Observaciones" textarea value={form.observations} onChange={s("observations")} />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn icon={Check} onClick={() => onSave(form)}>{initial ? "Guardar" : "Registrar"}</Btn>
      </div>
    </Modal>
  );
}
