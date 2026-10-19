// Exporta el guion y la distribución de tiempos a docs/GUION.md a partir de
// las diapositivas (misma fuente que guion.html). Uso: node tools/export-guion.js
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const ctx = { window: { Widgets: {} }, console };
ctx.window.window = ctx.window;
vm.createContext(ctx);
const load = (f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
['js/config.js', 'js/data/references.js'].forEach(load);
['00-apertura', '01-contexto-fundamentos', '02-arquitectura-cifrado', '03-ejemplo-descifrado', '04-criptoanalisis-seguridad', '99-cierre']
  .forEach((f) => load(`js/slides/${f}.js`));

const { DECK_CONFIG: cfg, SLIDES: S, REFS } = ctx.window;
const fmt = (m) => m.toFixed(1).replace('.', ',');
const mins = (id) => S.filter((s) => (s.person || 0) === id).reduce((a, s) => a + s.minutes, 0);

// HTML de las notas -> Markdown sencillo
function md(html) {
  return html
    .replace(/<p class="script">([\s\S]*?)<\/p>/g, (_, t) => `> ${t.trim()}\n`)
    .replace(/<li>([\s\S]*?)<\/li>/g, (_, t) => `- ${t.trim()}\n`)
    .replace(/<\/?(ul|p)[^>]*>/g, '\n')
    .replace(/<b>|<\/b>|<strong>|<\/strong>/g, '**')
    .replace(/<i>|<\/i>/g, '*')
    .replace(/<[^>]+>/g, '')
    .replace(/\\\(|\\\)/g, '$')
    .split('\n').map((l) => l.trim()).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const total = S.reduce((a, s) => a + s.minutes, 0);
let out = `# Guion y distribución de tiempos

> Archivo generado con \`node tools/export-guion.js\` a partir de \`js/slides/*.js\`. No editar a mano.

**${S.length} diapositivas · ${fmt(total)} min previstos** (sin preguntas). Objetivo: 30–40 min, ≈ 8 min por persona.

| Bloque | Expositor | Diapositivas | Minutos |
|---|---|--:|--:|
`;
[{ id: 0, name: '—', block: 'Portada y cierre (compartidas)' }, ...cfg.presenters].forEach((p) => {
  out += `| ${p.block} | ${p.id ? p.name : '—'} | ${S.filter((s) => (s.person || 0) === p.id).length} | ${fmt(mins(p.id))} |\n`;
});
out += `| **Total** | | **${S.length}** | **${fmt(total)}** |\n\n## Mapa de diapositivas\n\n| # | Diapositiva | Responsable | Min | Acumulado | Interactiva |\n|--:|---|---|--:|--:|:-:|\n`;
let acc = 0;
S.forEach((s, i) => {
  acc += s.minutes;
  const p = cfg.presenters.find((x) => x.id === s.person);
  out += `| ${i + 1} | ${s.title} | ${p ? p.name : 'Compartida'} | ${fmt(s.minutes)} | ${fmt(acc)} | ${s.mount ? '●' : ''} |\n`;
});

cfg.presenters.forEach((p) => {
  out += `\n## Bloque ${p.id} · ${p.block} — ${p.name} (${fmt(mins(p.id))} min)\n`;
  S.forEach((s, i) => {
    if (s.person !== p.id) return;
    const refs = (s.refs || []).map((r) => `[${REFS.byId[r].n}]`).join(' ');
    out += `\n### ${i + 1}. ${s.title} · ${fmt(s.minutes)} min${refs ? ` · fuentes ${refs}` : ''}\n\n${md(s.notes || '')}\n`;
  });
});

out += '\n## Bibliografía\n\n';
REFS.list.forEach((r) => { out += `${r.n}. ${r.full} <${r.url}>\n`; });

fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs', 'GUION.md'), out);
console.log(`docs/GUION.md: ${S.length} diapositivas, ${fmt(total)} min`);
