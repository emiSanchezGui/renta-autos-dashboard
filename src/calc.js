// Réplica de la lógica de Hoja1 del Excel renta_carros.xlsm
//
// Fila 7  Renta mensual          = renta semanal * 4
// C4:C6   Mant/Aguinaldo/Fondo    = renta semanal * %   (modo "excel")
// C7      Neto mensual            = mensual - mant - aguinaldo - fondo - seguro
// Fila 11 Renta acumulada         = neto * n
// Fila 13 Mantenimiento acumulado = (C4 * 4) * n
// Fila 16 Aguinaldo acumulado     = (C5 * 4) * n, se reinicia en enero (col O del Excel)
// Fila 19 Fondo acumulado         = (C6 * 4) * n
// Fila 23 ROI                     = acumulado >= precio de compra
// J1      Meses para ROI          = COUNTIF(fila ROI, FALSE)

export const MESES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function buildMonths(start, count) {
  const [y, m] = start.split('-').map(Number)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(y, m - 1 + i, 1)
    return { idx: i + 1, year: d.getFullYear(), month: d.getMonth(), label: `${MESES_ES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` }
  })
}

// modo "excel": deducción del neto = % de la renta SEMANAL (igual a C4:C6),
//               pero el fondo acumulado suma 4x esa cantidad (igual a fila 13/16/19).
// modo "mensual": % sobre la renta mensual, consistente entre neto y fondos.
export function monthly(p, modo) {
  const mensual = p.semanal * 4
  const base = modo === 'mensual' ? mensual : p.semanal
  const mant = base * p.mant
  const agui = base * p.agui
  const fondo = base * p.fondo
  const neto = mensual - mant - agui - fondo - p.seguro
  const acumFactor = modo === 'mensual' ? 1 : 4
  return { mensual, mant, agui, fondo, seguro: p.seguro, neto, acumMant: mant * acumFactor, acumAgui: agui * acumFactor, acumFondo: fondo * acumFactor }
}

export function curve(p, months, modo) {
  const m = monthly(p, modo)
  let agui = 0
  let sinceReset = 0
  return months.map((mo, i) => {
    // El Excel reinicia el aguinaldo en enero una vez que ya se acumuló al menos un año
    if (mo.month === 0 && sinceReset >= 12) { agui = 0; sinceReset = 0 }
    agui += m.acumAgui
    sinceReset++
    const renta = m.neto * (i + 1)
    return {
      renta,
      mant: m.acumMant * (i + 1),
      agui,
      fondo: m.acumFondo * (i + 1),
      roi: renta >= p.precio,
    }
  })
}

export function paybackFromCurve(rows) {
  // Igual a COUNTIF(..., FALSE): meses del horizonte sin recuperar la inversión
  return rows.filter((r) => !r.roi).length
}

export function exactPayback(p, modo) {
  const { neto } = monthly(p, modo)
  if (neto <= 0) return Infinity
  return Math.ceil(p.precio / neto)
}

export const fmt = (n) => (Number.isFinite(n) ? n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }) : '—')
export const fmtK = (n) => (Math.abs(n) >= 1000 ? `$${(n / 1000).toLocaleString('es-MX', { maximumFractionDigits: 0 })}k` : `$${n}`)
