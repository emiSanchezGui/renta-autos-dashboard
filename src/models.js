// Catálogo de modelos. Versa y Attitude vienen del Excel; el resto arranca con
// valores base para que los ajustes. Cualquier cambio se guarda en el navegador.
const BASE = { semanal: 2700, seguro: 1800, mant: 0.1, agui: 0.1, fondo: 0.1, precio: 150000 }

export const CATALOGO = {
  'Nissan Versa': { ...BASE, fromExcel: true },
  'Dodge Attitude': { ...BASE, semanal: 3700, seguro: 2700, fromExcel: true },
  'Nissan March': { ...BASE },
  'Nissan V-Drive': { ...BASE },
  'Nissan Sentra': { ...BASE },
  'Chevrolet Aveo': { ...BASE },
  'Chevrolet Onix': { ...BASE },
  'Kia Rio': { ...BASE },
  'Kia Soluto': { ...BASE },
  'Hyundai Grand i10': { ...BASE },
  'Hyundai Accent': { ...BASE },
  'Toyota Yaris': { ...BASE },
  'Volkswagen Vento': { ...BASE },
  'Volkswagen Virtus': { ...BASE },
  'Mitsubishi Mirage G4': { ...BASE },
  'Renault Kwid': { ...BASE },
  'MG 5': { ...BASE },
  'Suzuki Dzire': { ...BASE },
}

export const DEFAULT_PARAMS = BASE

// Listas de validación de Hoja2 del Excel
export const MONTOS = Array.from({ length: 28 }, (_, i) => 1300 + i * 100) // Hoja2!C1:C28
export const PORCENTAJES = Array.from({ length: 10 }, (_, i) => +(0.05 * (i + 1)).toFixed(2)) // Hoja2!A1:A10

const KEY = 'renta-autos-v1'
export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
export function saveState(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* almacenamiento no disponible */
  }
}
