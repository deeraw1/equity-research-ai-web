"use client";

import { useEffect, useState } from "react";
import { api, API_URL } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";

type Company = { ticker: string; name?: string; sector?: string; industry?: string; n_chunks: number };
type Hit = { company: string; section: string; score: number; chunk_id: number; text: string };

export default function EquityResearch() {
  const [tab, setTab] = useState<"ask" | "memo" | "dcf" | "comps">("ask");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/companies`)
      .then(r => r.json()).then(setCompanies)
      .catch(e => setError(String(e)));
  }, []);

  return (
    <div style={{ minHeight: "100vh", padding: "40px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <header style={{ marginBottom: 32 }}>
          <div className="section-label">AI in Finance · RAG</div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.5px" }}>
            Equity Research Analyst
          </h1>
          <p style={{ color: "var(--muted)", marginTop: 8, maxWidth: 760, fontSize: "0.95rem" }}>
            Retrieval-augmented Q&A and structured investment memos over Nigerian (NSE) and US (SEC) filings.
            Every answer is grounded in citation-numbered excerpts. Includes DCF and peer-comp valuation triangulation.
          </p>
          <div style={{ marginTop: 14, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <span className="pill pill-neutral">{companies.length} issuers indexed</span>
            <span className="pill pill-neutral">{companies.reduce((a, c) => a + c.n_chunks, 0)} chunks</span>
            {companies.map(c => <span key={c.ticker} style={{ fontSize: "0.78rem", color: "var(--faint)" }}>{c.ticker}</span>)}
          </div>
        </header>

        {error && <div style={{ color: "var(--bad)", marginBottom: 18 }}>API unreachable: {error}</div>}

        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 28 }}>
          <div className={"tab " + (tab === "ask" ? "active" : "")} onClick={() => setTab("ask")}>Ask filings</div>
          <div className={"tab " + (tab === "memo" ? "active" : "")} onClick={() => setTab("memo")}>Investment memo</div>
          <div className={"tab " + (tab === "dcf" ? "active" : "")} onClick={() => setTab("dcf")}>DCF</div>
          <div className={"tab " + (tab === "comps" ? "active" : "")} onClick={() => setTab("comps")}>Peer comps</div>
        </div>

        {tab === "ask" && <AskPanel companies={companies} />}
        {tab === "memo" && <MemoPanel companies={companies} />}
        {tab === "dcf" && <DCFPanel />}
        {tab === "comps" && <CompsPanel />}
      </div>
    </div>
  );
}

function AskPanel({ companies }: { companies: Company[] }) {
  const [q, setQ] = useState("What is the company's competitive moat?");
  const [company, setCompany] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function go() {
    setBusy(true); setErr("");
    try {
      const r = await api<{ hits: Hit[] }>("/ask", { query: q, company: company || null, k: 6 });
      setHits(r.hits);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
      <div className="card" style={{ height: "fit-content" }}>
        <div className="section-title">Query</div>
        <div style={{ marginBottom: 14 }}>
          <label className="label">Question</label>
          <textarea className="input" value={q} onChange={e => setQ(e.target.value)} rows={3} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="label">Scope</label>
          <select className="select" value={company} onChange={e => setCompany(e.target.value)}>
            <option value="">All companies</option>
            {companies.map(c => <option key={c.ticker} value={c.ticker}>{c.ticker}</option>)}
          </select>
        </div>
        <button className="btn" onClick={go} disabled={busy} style={{ width: "100%" }}>
          {busy ? "Retrieving..." : "Ask"}
        </button>
        {err && <div style={{ color: "var(--bad)", fontSize: "0.8rem", marginTop: 10 }}>{err}</div>}
      </div>

      <div className="card">
        <div className="section-title">Top retrievals</div>
        {hits.length === 0 ? (
          <div style={{ color: "var(--faint)", padding: "30px 0", textAlign: "center" }}>Ask a question to retrieve matching filing excerpts.</div>
        ) : hits.map((h, i) => (
          <div className="cite" key={i}>
            <div className="meta">[{i + 1}] {h.company} · {h.section} · score {h.score.toFixed(3)}</div>
            <div>{h.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MemoPanel({ companies }: { companies: Company[] }) {
  const [company, setCompany] = useState(companies[0]?.ticker || "DANGCEM");
  useEffect(() => { if (!company && companies[0]) setCompany(companies[0].ticker); }, [companies, company]);

  const [questions, setQuestions] = useState<string[]>([
    "What is the company's competitive moat?",
    "What are the principal risk factors?",
    "How is revenue trending and what are the drivers?",
    "What is management's capital allocation policy?",
  ]);
  const [memo, setMemo] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function go() {
    setBusy(true); setErr(""); setMemo(null);
    try {
      setMemo(await api("/memo", { company, questions: questions.filter(q => q.trim()) }));
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
      <div className="card" style={{ height: "fit-content" }}>
        <div className="section-title">Memo configuration</div>
        <div style={{ marginBottom: 14 }}>
          <label className="label">Company</label>
          <select className="select" value={company} onChange={e => setCompany(e.target.value)}>
            {companies.map(c => <option key={c.ticker} value={c.ticker}>{c.ticker} — {c.name || c.ticker}</option>)}
          </select>
        </div>
        <label className="label">Questions</label>
        {questions.map((q, i) => (
          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <input className="input" value={q} onChange={e => setQuestions(questions.map((x, j) => i === j ? e.target.value : x))} />
            <button className="btn" style={{ background: "transparent", border: "1px solid var(--border2)", color: "var(--bad)", padding: "0 12px" }}
                    onClick={() => setQuestions(questions.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
        <button className="btn" style={{ width: "100%", background: "transparent", border: "1px solid var(--border2)", color: "var(--accent2)", marginTop: 6 }}
                onClick={() => setQuestions([...questions, ""])}>+ Add question</button>
        <button className="btn" onClick={go} disabled={busy} style={{ width: "100%", marginTop: 14 }}>
          {busy ? "Generating..." : "Generate memo"}
        </button>
        {err && <div style={{ color: "var(--bad)", fontSize: "0.8rem", marginTop: 10 }}>{err}</div>}
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div className="section-title" style={{ borderBottom: "none", margin: 0, padding: 0 }}>
            Investment Memo {memo && `— ${memo.company}`}
          </div>
          {memo && <span className={"pill " + (memo.mode === "llm_synthesised" ? "pill-good" : "pill-neutral")}>
            {memo.mode === "llm_synthesised" ? "LLM synthesised" : "Evidence only"}
          </span>}
        </div>
        {!memo ? (
          <div style={{ color: "var(--faint)", padding: "30px 0", textAlign: "center" }}>
            Configure questions and generate a memo. Without an API key, the API returns evidence-only mode (still grounded with citations).
          </div>
        ) : memo.sections.map((s: any, i: number) => (
          <div key={i} style={{ marginBottom: 28, paddingBottom: 22, borderBottom: i < memo.sections.length - 1 ? "1px solid var(--border)" : "none" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 10, color: "var(--text)" }}>
              Q{i + 1}. {s.question}
            </h3>
            {s.answer && (
              <p style={{ fontSize: "0.92rem", lineHeight: 1.65, marginBottom: 14, color: "var(--text)" }}>
                {s.answer}
              </p>
            )}
            {s.evidence.map((h: Hit, j: number) => (
              <div className="cite" key={j}>
                <div className="meta">[{j + 1}] {h.company} · {h.section} · score {h.score.toFixed(3)}</div>
                <div style={{ fontSize: "0.82rem" }}>{h.text}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DCFPanel() {
  const [fcf0, setFcf0] = useState(500);
  const [growth, setGrowth] = useState(0.10);
  const [tg, setTg] = useState(0.025);
  const [wacc, setWacc] = useState(0.09);
  const [years, setYears] = useState(5);
  const [shares, setShares] = useState(100);
  const [netDebt, setNetDebt] = useState(0);
  const [res, setRes] = useState<any>(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");

  async function go() {
    setBusy(true); setErr("");
    try {
      setRes(await api("/dcf", {
        fcf0, growth, terminal_growth: tg, wacc, years,
        shares_out: shares, net_debt: netDebt,
      }));
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
      <div className="card">
        <div className="section-title">Two-stage DCF inputs</div>
        <div style={{ marginBottom: 12 }}><label className="label">FCF₀ ($M)</label><input className="input" type="number" value={fcf0} onChange={e => setFcf0(+e.target.value)} /></div>
        <div style={{ marginBottom: 12 }}><label className="label">Stage-1 growth</label><input className="input" type="number" step="0.01" value={growth} onChange={e => setGrowth(+e.target.value)} /></div>
        <div style={{ marginBottom: 12 }}><label className="label">Terminal growth</label><input className="input" type="number" step="0.005" value={tg} onChange={e => setTg(+e.target.value)} /></div>
        <div style={{ marginBottom: 12 }}><label className="label">WACC</label><input className="input" type="number" step="0.005" value={wacc} onChange={e => setWacc(+e.target.value)} /></div>
        <div style={{ marginBottom: 12 }}><label className="label">Stage-1 years</label><input className="input" type="number" value={years} onChange={e => setYears(+e.target.value)} /></div>
        <div style={{ marginBottom: 12 }}><label className="label">Shares outstanding (M)</label><input className="input" type="number" value={shares} onChange={e => setShares(+e.target.value)} /></div>
        <div style={{ marginBottom: 12 }}><label className="label">Net debt ($M)</label><input className="input" type="number" value={netDebt} onChange={e => setNetDebt(+e.target.value)} /></div>
        <button className="btn" onClick={go} disabled={busy} style={{ width: "100%", marginTop: 6 }}>
          {busy ? "Valuing..." : "Run DCF"}
        </button>
        {err && <div style={{ color: "var(--bad)", fontSize: "0.8rem", marginTop: 10 }}>{err}</div>}
      </div>

      <div>
        {!res ? <div className="card" style={{ padding: "60px 24px", textAlign: "center", color: "var(--faint)" }}>Run DCF to see valuation.</div> : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
              <KPI label="EV ($M)" value={res.enterprise_value.toFixed(0)} accent />
              <KPI label="Equity ($M)" value={res.equity_value.toFixed(0)} />
              <KPI label="Per share" value={"$" + res.per_share.toFixed(2)} accent />
              <KPI label="Terminal % of EV" value={(res.tv_share_of_ev * 100).toFixed(0) + "%"} />
            </div>
            <div className="card" style={{ marginBottom: 18 }}>
              <div className="section-title">PV of explicit-period FCF</div>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={res.explicit_pvs.map((v: number, i: number) => ({ year: `Y${i + 1}`, pv: v }))}>
                    <CartesianGrid stroke="#181f2e" strokeDasharray="3 3" />
                    <XAxis dataKey="year" stroke="#8a9ab8" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#8a9ab8" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid #1e2d44" }} />
                    <Bar dataKey="pv" fill="#7c3aed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="section-title">Sensitivity — per-share value (WACC × terminal g)</div>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>WACC \\ g →</th>
                      {res.sensitivity.terminal_growth.map((g: number) => <th key={g}>{(g * 100).toFixed(2)}%</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {res.sensitivity.wacc.map((w: number, i: number) => (
                      <tr key={i}>
                        <td style={{ color: "var(--muted)", fontWeight: 600 }}>{(w * 100).toFixed(2)}%</td>
                        {res.sensitivity.values[i].map((v: number | null, j: number) => (
                          <td key={j} style={{ color: v == null ? "var(--faint)" : "var(--text)" }}>
                            {v == null ? "—" : "$" + v.toFixed(2)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CompsPanel() {
  const [target, setTarget] = useState({ ticker: "TGT", revenue: 1000, ebitda: 250, net_income: 120 });
  const [peers, setPeers] = useState([
    { ticker: "P1", revenue: 800, ebitda: 220, net_income: 110, market_cap: 2200, ev: 2400 },
    { ticker: "P2", revenue: 1200, ebitda: 310, net_income: 160, market_cap: 3500, ev: 3800 },
    { ticker: "P3", revenue: 950, ebitda: 240, net_income: 105, market_cap: 2400, ev: 2700 },
  ]);
  const [res, setRes] = useState<any>(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");

  async function go() {
    setBusy(true); setErr("");
    try { setRes(await api("/comps", { target, peers })); }
    catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
      <div className="card">
        <div className="section-title">Target & peers</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
          <div>
            <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "1px" }}>Target</h3>
            <div style={{ marginBottom: 10 }}><label className="label">Ticker</label><input className="input" value={target.ticker} onChange={e => setTarget({ ...target, ticker: e.target.value })} /></div>
            <div style={{ marginBottom: 10 }}><label className="label">Revenue</label><input className="input" type="number" value={target.revenue} onChange={e => setTarget({ ...target, revenue: +e.target.value })} /></div>
            <div style={{ marginBottom: 10 }}><label className="label">EBITDA</label><input className="input" type="number" value={target.ebitda} onChange={e => setTarget({ ...target, ebitda: +e.target.value })} /></div>
            <div style={{ marginBottom: 10 }}><label className="label">Net income</label><input className="input" type="number" value={target.net_income} onChange={e => setTarget({ ...target, net_income: +e.target.value })} /></div>
          </div>
          <div>
            <h3 style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "1px" }}>Peers</h3>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Ticker</th><th>Rev</th><th>EBITDA</th><th>NI</th><th>MC</th><th>EV</th><th></th></tr></thead>
                <tbody>
                  {peers.map((p, i) => (
                    <tr key={i}>
                      {(["ticker", "revenue", "ebitda", "net_income", "market_cap", "ev"] as const).map(f => (
                        <td key={f}><input className="input" style={{ padding: "5px 8px" }}
                                    type={f === "ticker" ? "text" : "number"}
                                    value={(p as any)[f]}
                                    onChange={e => setPeers(peers.map((x, j) =>
                                      i === j ? { ...x, [f]: f === "ticker" ? e.target.value : +e.target.value } : x))} /></td>
                      ))}
                      <td><button className="btn" style={{ background: "transparent", border: "1px solid var(--border2)", color: "var(--bad)", padding: "0 10px" }}
                                  onClick={() => setPeers(peers.filter((_, j) => j !== i))}>×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn" style={{ marginTop: 10, background: "transparent", border: "1px solid var(--border2)", color: "var(--accent2)" }}
                    onClick={() => setPeers([...peers, { ticker: "PN", revenue: 1000, ebitda: 250, net_income: 120, market_cap: 2500, ev: 2700 }])}>
              + Add peer
            </button>
          </div>
        </div>
        <button className="btn" onClick={go} disabled={busy} style={{ marginTop: 18 }}>
          {busy ? "Triangulating..." : "Triangulate valuation"}
        </button>
        {err && <div style={{ color: "var(--bad)", fontSize: "0.8rem", marginTop: 10 }}>{err}</div>}
      </div>

      {res && (
        <>
          <div className="card">
            <div className="section-title">Peer multiples</div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Ticker</th><th>EV / Revenue</th><th>EV / EBITDA</th><th>P / E</th></tr></thead>
                <tbody>
                  {res.peer_multiples.map((m: any) => (
                    <tr key={m.ticker}>
                      <td style={{ fontWeight: 600 }}>{m.ticker}</td>
                      <td>{m.ev_revenue?.toFixed(2) ?? "—"}x</td>
                      <td>{m.ev_ebitda?.toFixed(2) ?? "—"}x</td>
                      <td>{m.p_e?.toFixed(2) ?? "—"}x</td>
                    </tr>
                  ))}
                  <tr style={{ background: "var(--surface2)" }}>
                    <td style={{ fontWeight: 700, color: "var(--accent2)" }}>Median</td>
                    <td style={{ color: "var(--accent2)" }}>{res.median_multiples.ev_revenue?.toFixed(2)}x</td>
                    <td style={{ color: "var(--accent2)" }}>{res.median_multiples.ev_ebitda?.toFixed(2)}x</td>
                    <td style={{ color: "var(--accent2)" }}>{res.median_multiples.p_e?.toFixed(2)}x</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <KPI label="Implied EV from EV/Sales" value={res.implied_target.ev_from_revenue?.toFixed(0) ?? "—"} accent />
            <KPI label="Implied EV from EV/EBITDA" value={res.implied_target.ev_from_ebitda?.toFixed(0) ?? "—"} accent />
            <KPI label="Implied MC from P/E" value={res.implied_target.mc_from_pe?.toFixed(0) ?? "—"} accent />
          </div>
        </>
      )}
    </div>
  );
}

function KPI({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card-tight">
      <div style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: "1.25rem", fontWeight: 700, fontVariantNumeric: "tabular-nums",
                    color: accent ? "var(--accent2)" : "var(--text)" }}>{value}</div>
    </div>
  );
}
