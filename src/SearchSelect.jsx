import { useEffect, useMemo, useRef, useState } from 'react'

// Equivalente a un segmentador "Menú desplegable" con búsqueda de Power BI.
export default function SearchSelect({ label, value, options, onChange, onAdd, accent }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hi, setHi] = useState(0)
  const ref = useRef(null)
  const inputRef = useRef(null)

  const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const filtered = useMemo(() => options.filter((o) => norm(o).includes(norm(q.trim()))), [options, q])
  const canAdd = q.trim() && !options.some((o) => norm(o) === norm(q.trim()))
  const items = canAdd ? [...filtered, { add: q.trim() }] : filtered

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => {
    if (open) {
      setQ('')
      setHi(Math.max(0, options.indexOf(value)))
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (it) => {
    if (typeof it === 'object') onAdd(it.add)
    else onChange(it)
    setOpen(false)
  }

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter' && items[hi] !== undefined) { e.preventDefault(); pick(items[hi]) }
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="slicer" ref={ref}>
      <span className="slicer-label">{label}</span>
      <button type="button" className="slicer-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="swatch" style={{ background: accent }} />
        <span className="slicer-value">{value}</span>
        <span className="chev">▾</span>
      </button>
      {open && (
        <div className="slicer-pop" role="listbox">
          <div className="slicer-search">
            <span aria-hidden>🔍</span>
            <input ref={inputRef} value={q} placeholder="Buscar" onChange={(e) => { setQ(e.target.value); setHi(0) }} onKeyDown={onKey} />
          </div>
          <ul>
            {items.map((it, i) => {
              const isAdd = typeof it === 'object'
              const text = isAdd ? `+ Agregar "${it.add}"` : it
              return (
                <li key={text} className={`${i === hi ? 'hi' : ''} ${it === value ? 'sel' : ''} ${isAdd ? 'add' : ''}`} onMouseEnter={() => setHi(i)} onMouseDown={(e) => { e.preventDefault(); pick(it) }}>
                  {!isAdd && <span className="radio">{it === value ? '●' : '○'}</span>}
                  {text}
                </li>
              )
            })}
            {items.length === 0 && <li className="empty">Sin resultados</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
