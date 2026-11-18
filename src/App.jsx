import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import SearchSelect from './SearchSelect.jsx'
import { CATALOGO, DEFAULT_PARAMS, MONTOS, PORCENTAJES, loadState, saveState } from './models.js'
import { buildMonths, curve, monthly, paybackFromCurve, exactPayback, fmt, fmtK } from './calc.js'

const SLOT_COLORS = ['var(--series-1)', 'var(--series-2)']
const PIE_KEYS = [
  { key: 'neto', label: 'Ganancia neta', color: 'var(--pie-1)' },
  { key: 'seguro', label: 'Seguro', color: 'var(--pie-2)' },
  { key: 'mant', label: 'Mantenimiento', color: 'var(--pie-3)' },
  { key: 'agui', label: 'Aguinaldo', color: 'var(--pie-4)' },
  { key: 'fondo', label: 'Fondo', color: 'var(--pie-5)' },
]

function initialState() {
  const saved = loadState()
  const params = {}
  for (const [k, v] of Object.entries(CATALOGO)) params[k] = { ...v }
  if (saved?.params) for (const [k, v] of Object.entries(saved.params)) params[k] = { ...params[k], ...v }
  return {
    params,
    sel: saved?.sel ?? ['Nissan Versa', 'Dodge Attitude'],
    inicio: saved?.inicio ?? '2026-12',
    meses: saved?.meses ?? 25,
    modo: saved?.modo ?? 'excel',
  }
}

export default function App() {
  const [st, setSt] = useState(initialState)
  const [detalle, setDetalle] = useState(true)
  useEffect(() => saveState(st), [st])

  const modelos = useMemo(() => Object.keys(st.params).sort((a, b) => a.localeCompare(b, 'es')), [st.params])
  const months = useMemo(() => buildMonths(st.inicio, st.meses), [st.inicio, st.meses])

  const data = st.sel.map((name) => {
    const p = st.params[name]
    const rows = curve(p, months, st.modo)
    return { name, p, m: monthly(p, st.modo), rows, payback: paybackFromCurve(rows), exact: exactPayback(p, st.modo) }
  })

  const setSel = (i, name) => setSt((s) => ({ ...s, sel: s.sel.map((x, j) => (j === i ? name : x)) }))
  const addModel = (i, name) => setSt((s) => ({ ...s, params: { ...s.params, [name]: { ...DEFAULT_PARAMS } }, sel: s.sel.map((x, j) => (j === i ? name : x)) }))
  const setParam = (name, key, val) => setSt((s) => ({ ...s, params: { ...s.params, [name]: { ...s.params[name], [key]: val } } }))
  const resetModel = (name) => setSt((s) => ({ ...s, params: { ...s.params, [name]: { ...(CATALOGO[name] ?? DEFAULT_PARAMS) } } }))

  const chartData = months.map((mo, i) => ({ label: mo.label, a: data[0].rows[i].renta, b: data[1].rows[i].renta }))
  const sameModel = st.sel[0] === st.sel[1]
  const roiMax = Math.max(data[0].exact, data[1].exact)
  const j3 = Math.max(data[0].payback, data[1].payback)

  return (
    <div className="viz-root">
      <header className="top">
        <div className="title">
          <h1>Renta de autos · Retorno de inversión</h1>
          <p>Compara dos modelos y ve en cuántos meses se paga cada auto.</p>
        </div>
        <div className="filters">
          <SearchSelect label="Modelo 1" value={st.sel[0]} options={modelos} onChange={(v) => setSel(0, v)} onAdd={(v) => addModel(0, v)} accent={SLOT_COLORS[0]} />
          <SearchSelect label="Modelo 2" value={st.sel[1]} options={modelos} onChange={(v) => setSel(1, v)} onAdd={(v) => addModel(1, v)} accent={SLOT_COLORS[1]} />
          <label className="ctl">
            <span>Inicio</span>
            <input type="month" value={st.inicio} onChange={(e) => e.target.value && setSt((s) => ({ ...s, inicio: e.target.value }))} />
          </label>
          <label className="ctl">
            <span>Meses</span>
            <input type="number" min={6} max={60} value={st.meses} onChange={(e) => setSt((s) => ({ ...s, meses: Math.min(60, Math.max(6, +e.target.value || 6)) }))} />
          </label>
          <label className="ctl">
            <span>Base de % (mant., aguinaldo, fondo)</span>
            <select value={st.modo} onChange={(e) => setSt((s) => ({ ...s, modo: e.target.value }))}>
              <option value="excel">Renta semanal (igual al Excel)</option>
              <option value="mensual">Renta mensual</option>
            </select>
          </label>
        </div>
      </header>

      <section className="kpis">
        {data.map((d, i) => (
          <div className="kpi" key={i}>
            <div className="kpi-head"><span className="swatch" style={{ background: SLOT_COLORS[i] }} />{d.name}</div>
            <div className="kpi-big">{fmt(d.m.neto)}<small>/mes neto</small></div>
            <div className="kpi-sub">
              {Number.isFinite(d.exact) ? <>Recupera {fmt(d.p.precio)} en <b>{d.exact} meses</b></> : <b className="warn">⚠ El neto no es positivo: no recupera la inversión</b>}
            </div>
          </div>
        ))}
        <div className="kpi">
          <div className="kpi-head">Ambos autos pagados</div>
          <div className="kpi-big">{Number.isFinite(roiMax) ? roiMax : '—'}<small>meses</small></div>
          <div className="kpi-sub">Celda J3 del Excel: <b>{j3 >= st.meses ? `> ${st.meses}` : j3}</b> (cuenta los meses <i>antes</i> de recuperar)</div>
        </div>
      </section>

      <section className="params">
        {data.map((d, i) => (
          <ParamCard key={i} d={d} color={SLOT_COLORS[i]} modo={st.modo} onChange={(k, v) => setParam(d.name, k, v)} onReset={() => resetModel(d.name)} />
        ))}
      </section>

      <section className="card">
        <h2>Curva de renta acumulada vs. precio de compra</h2>
        <div className="legend-row">
          {data.map((d, i) => (
            <span key={i} className="leg"><span className="leg-line" style={{ background: SLOT_COLORS[i] }} />{d.name}</span>
          ))}
          <span className="leg"><span className="leg-dash" />Precio de compra</span>
        </div>
        <div style={{ width: '100%', height: 340 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 16, right: 24, bottom: 4, left: 8 }}>
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'var(--grid)' }} interval="preserveStartEnd" minTickGap={16} />
              <YAxis tickFormatter={fmtK} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickLine={false} axisLine={false} width={56} />
              <Tooltip content={<LineTip names={data.map((d) => d.name)} precios={data.map((d) => d.p.precio)} />} cursor={{ stroke: 'var(--text-muted)', strokeWidth: 1 }} />
              {data.map((d, i) => (
                (i === 0 || d.p.precio !== data[0].p.precio) && (
                  <ReferenceLine key={i} y={d.p.precio} stroke="var(--text-muted)" strokeDasharray="5 4" label={{ value: `Precio ${sameModel || data[0].p.precio === data[1].p.precio ? '' : d.name} ${fmtK(d.p.precio)}`, position: 'insideTopLeft', fill: 'var(--text-secondary)', fontSize: 11 }} />
                )
              ))}
              <Line type="monotone" dataKey="a" name={data[0].name} stroke={SLOT_COLORS[0]} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: 'var(--surface-1)', strokeWidth: 2 }} />
              {!sameModel && <Line type="monotone" dataKey="b" name={data[1].name} stroke={SLOT_COLORS[1]} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: 'var(--surface-1)', strokeWidth: 2 }} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="pies">
        {data.map((d, i) => (
          <div className="card" key={i}>
            <h2><span className="swatch" style={{ background: SLOT_COLORS[i] }} />¿A dónde se va la renta mensual? · {d.name}</h2>
            <p className="muted">Renta mensual de {fmt(d.m.mensual)}</p>
            <PieBlock m={d.m} />
          </div>
        ))}
      </section>

      <section className="card">
        <div className="table-head">
          <h2>Curva en tabla</h2>
          <button type="button" className="btn" onClick={() => setDetalle((x) => !x)}>{detalle ? 'Ocultar detalle por modelo' : 'Mostrar detalle por modelo'}</button>
        </div>
        <CurveTable data={data} months={months} detalle={detalle} />
      </section>

      <footer className="muted foot">
        Los cambios se guardan en este navegador. Lógica basada en <i>renta_carros.xlsm</i>.
      </footer>
    </div>
  )
}

function ParamCard({ d, color, modo, onChange, onReset }) {
  const { p, m, name } = d
  const pct = (k, label, monto) => (
    <div className="prow">
      <span>{label}</span>
      <select value={p[k]} onChange={(e) => onChange(k, +e.target.value)}>
        {PORCENTAJES.map((v) => <option key={v} value={v}>{Math.round(v * 100)}%</option>)}
      </select>
      <span className="calc">{fmt(monto)}</span>
    </div>
  )
  const money = (k, label) => (
    <div className="prow">
      <span>{label}</span>
      <select value={p[k]} onChange={(e) => onChange(k, +e.target.value)}>
        {(MONTOS.includes(p[k]) ? MONTOS : [...MONTOS, p[k]].sort((a, b) => a - b)).map((v) => <option key={v} value={v}>{fmt(v)}</option>)}
      </select>
      <span />
    </div>
  )
  return (
    <div className="card pcard">
      <div className="pcard-head">
        <h2><span className="swatch" style={{ background: color }} />{name}</h2>
        <button type="button" className="link" onClick={onReset}>Restablecer</button>
      </div>
      {!p.fromExcel && <p className="hint">Valores base: ajústalos a este modelo.</p>}
      {money('semanal', 'Renta semanal')}
      {money('seguro', 'Seguro (mensual)')}
      {pct('mant', 'Mantenimiento', m.mant)}
      {pct('agui', 'Aguinaldo', m.agui)}
      {pct('fondo', 'Fondo', m.fondo)}
      <div className="prow">
        <span>Precio compra</span>
        <input type="number" step={1000} min={0} value={p.precio} onChange={(e) => onChange('precio', Math.max(0, +e.target.value || 0))} />
        <span />
      </div>
      <div className="prow total">
        <span>Renta mensual</span>
        <span>{fmt(m.mensual)}</span>
        <span className="calc"><b>{fmt(m.neto)}</b> neto</span>
      </div>
      {modo === 'excel' && <p className="hint">% calculado sobre la renta semanal, como en el Excel.</p>}
    </div>
  )
}

function LineTip({ active, payload, label, names, precios }) {
  if (!active || !payload?.length) return null
  return (
    <div className="tip">
      <div className="tip-title">{label}</div>
      {payload.map((p) => {
        const i = p.dataKey === 'a' ? 0 : 1
        const pct = precios[i] ? Math.round((p.value / precios[i]) * 100) : 0
        return (
          <div key={p.dataKey} className="tip-row">
            <span className="swatch" style={{ background: p.stroke }} />
            <span>{names[i]}</span>
            <b>{fmt(p.value)}</b>
            <span className="muted">{pct}% del precio</span>
          </div>
        )
      })}
    </div>
  )
}

function PieBlock({ m }) {
  if (m.neto <= 0) return <p className="warn">⚠ Los costos superan la renta: el neto es {fmt(m.neto)}. Ajusta los parámetros.</p>
  const rows = PIE_KEYS.map((k) => ({ ...k, value: m[k.key] })).filter((r) => r.value > 0)
  const total = m.mensual
  return (
    <div className="pie-wrap">
      <div style={{ width: 220, height: 220 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="label" innerRadius={58} outerRadius={100} stroke="var(--surface-1)" strokeWidth={2} isAnimationActive={false}>
              {rows.map((r) => <Cell key={r.key} fill={r.color} />)}
            </Pie>
            <Tooltip formatter={(v, n) => [`${fmt(v)} (${((v / total) * 100).toFixed(1)}%)`, n]} contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--grid)', borderRadius: 8, color: 'var(--text-primary)' }} />
            <Legend content={() => null} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="pie-legend">
        {rows.map((r) => (
          <li key={r.key}>
            <span className="swatch" style={{ background: r.color }} />
            <span>{r.label}</span>
            <b>{fmt(r.value)}</b>
            <span className="muted">{((r.value / total) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CurveTable({ data, months, detalle }) {
  const [A, B] = data
  const sum = (k) => months.map((_, i) => A.rows[i][k] + B.rows[i][k])
  const line = (label, vals, cls = '', color) => (
    <tr className={cls}>
      <th>{color && <span className="swatch" style={{ background: color }} />}{label}</th>
      {vals.map((v, i) => <td key={i}>{fmt(v)}</td>)}
    </tr>
  )
  const roi = (d, color) => (
    <tr className="roi">
      <th><span className="swatch" style={{ background: color }} />ROI {d.name}</th>
      {d.rows.map((r, i) => <td key={i} className={r.roi ? 'ok' : 'no'}>{r.roi ? '✓ Sí' : '✗ No'}</td>)}
    </tr>
  )
  return (
    <div className="table-scroll">
      <table className="curve">
        <thead>
          <tr><th>Concepto</th>{months.map((m) => <th key={m.idx}>{m.label}</th>)}</tr>
          <tr className="idx"><th>Mes #</th>{months.map((m) => <th key={m.idx}>{m.idx}</th>)}</tr>
        </thead>
        <tbody>
          {line(`Renta ${A.name}`, A.rows.map((r) => r.renta), 'strong', SLOT_COLORS[0])}
          {line(`Renta ${B.name}`, B.rows.map((r) => r.renta), 'strong', SLOT_COLORS[1])}
          {detalle && line(`Mantenimiento ${A.name}`, A.rows.map((r) => r.mant), 'sub')}
          {detalle && line(`Mantenimiento ${B.name}`, B.rows.map((r) => r.mant), 'sub')}
          {line('Mantenimiento', sum('mant'), 'group')}
          {detalle && line(`Aguinaldo ${A.name}`, A.rows.map((r) => r.agui), 'sub')}
          {detalle && line(`Aguinaldo ${B.name}`, B.rows.map((r) => r.agui), 'sub')}
          {line('Aguinaldo', sum('agui'), 'group')}
          {detalle && line(`Fondo ${A.name}`, A.rows.map((r) => r.fondo), 'sub')}
          {detalle && line(`Fondo ${B.name}`, B.rows.map((r) => r.fondo), 'sub')}
          {line('Fondo', sum('fondo'), 'group')}
          {roi(A, SLOT_COLORS[0])}
          {roi(B, SLOT_COLORS[1])}
        </tbody>
      </table>
    </div>
  )
}
