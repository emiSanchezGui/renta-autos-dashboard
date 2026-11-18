# Renta de autos · Dashboard de ROI

Dashboard interactivo (React + Vite + Recharts) para comparar modelos de autos en renta y ver en cuántos meses se recupera la inversión. Basado en la lógica de `renta_carros.xlsm`.

## Qué incluye
- **Selectores de modelo con buscador** (como un segmentador de menú desplegable con búsqueda en Power BI). Si el modelo no existe, se puede agregar desde el buscador.
- **Parámetros por modelo**: renta semanal, seguro, % de mantenimiento / aguinaldo / fondo y precio de compra (mismas listas que Hoja2 del Excel).
- **Curva de renta acumulada vs. precio de compra** (gráfica de línea).
- **Distribución de la renta mensual** (dona por modelo).
- **Curva en tabla** mes a mes, con botón para ocultar/mostrar el detalle por modelo (equivalente a las macros `Ocultar` / `Mostrar`).
- Selector de **base de %**: renta semanal (igual que el Excel) o renta mensual.

Los cambios se guardan en el navegador de cada usuario (localStorage).

## Desarrollo
```bash
npm install
npm run dev
```

El despliegue a GitHub Pages es automático con cada push a `main` (`.github/workflows/deploy.yml`).
