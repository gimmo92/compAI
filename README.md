## Modulo Salary Review AI (Vue 3 + Vite)

Skeleton di una webapp in Vue.js per un modulo di salary review AI, pensato per essere integrato in una suite HCM. Include:
- Router con sezioni: Overview, Suggerimenti AI, Budget, Audit
- Menu a tab orizzontale in alto
- Stili ispirati al file `style.css` (palette primaria `#0A6CD2`, Open Sans, scala grigi)

### Requisiti
- Node.js 18+

### Installazione

```bash
npm install
```

### Avvio in sviluppo

```bash
npm run dev
```

Apri `http://localhost:5173`.

### Build produzione

```bash
npm run build
npm run preview
```

### Struttura
- `src/App.vue`: shell app + header con tab
- `src/components/TopTabs.vue`: menu tab orizzontale
- `src/router/index.js`: definizione rotte
- `src/pages/*`: pagine placeholder del modulo
- `src/styles/theme.css`: variabili e base styling ispirati al tuo `style.css`
- `src/styles/external-origin.css`: utilità leggere coerenti con lo stile originale

### Serverless Gemini (Vercel)
Questa app usa una function serverless in `api/gemini.js` per chiamare Gemini.

Imposta la variabile d'ambiente `GEMINI_API_KEY` nel provider (es. Vercel).

Esempio chiamata dal frontend:
- `src/lib/geminiClient.js` -> `generateGeminiInsight()`
