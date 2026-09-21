import { useState } from "react";

const cmToM = (cm) => (cm * 0.01).toFixed(2);

// Fondo y etiqueta de cada zona de especie. Los nidos se colorean por semana de
// incubación, no por especie, así que la zona sólo aporta el contexto de fondo.
const ZONA_COLS = {
  golfina: { bg: "var(--golfina-bg)", borde: "var(--golfina-border)", texto: "var(--golfina)" },
  prieta:  { bg: "var(--prieta-bg)",  borde: "var(--prieta-border)",  texto: "var(--prieta)"  },
  laud:    { bg: "var(--laud-bg)",    borde: "var(--laud-border)",    texto: "var(--laud)"    },
};

// Índice 0-based a etiqueta tipo hoja de cálculo: A..Z, AA, AB, ...
function etiquetaColumna(idx) {
  let etiqueta = "";
  let n = idx + 1;
  while (n > 0) {
    const resto = (n - 1) % 26;
    etiqueta = String.fromCharCode(65 + resto) + etiqueta;
    n = Math.floor((n - 1) / 26);
  }
  return etiqueta;
}

// La rejilla se deriva del corral, no de medidas fijas
function obtenerSectorFisico(xCm, yCm, celda, nCols, nFilas) {
  const colIdx = Math.min(Math.max(0, Math.floor(xCm / celda)), nCols - 1);
  const rowIdx = Math.min(Math.max(0, Math.floor(yCm / celda)), nFilas - 1);
  return `${etiquetaColumna(colIdx)}-${rowIdx + 1}`;
}

// Asignar color según semana de incubación
function getColorPorSemana(semana_info, eclosionado) {
  if (eclosionado) return { fill: "#7f8c8d", stroke: "#95a5a6", label: "Eclosionado" };
  if (!semana_info) return { fill: "#3498db", stroke: "#2980b9", label: "?" };

  const { semana, en_pts, semana_critica } = semana_info;

  if (en_pts || semana_critica) {
    return { fill: "#e74c3c", stroke: "#c0392b", label: `Semana ${semana} (🔥 PTS)` };
  }
  if (semana <= 2) {
    return { fill: "#27ae60", stroke: "#229954", label: `Semana ${semana} (Seguro)` };
  }
  if (semana >= 4 && semana <= 5) {
    return { fill: "#f39c12", stroke: "#d68910", label: `Semana ${semana}` };
  }
  return { fill: "#3498db", stroke: "#2980b9", label: `Semana ${semana}` };
}

// Silueta de tortuga por especie. La forma del caparazón distingue a cada una:
// la golfina es casi redonda, la prieta más ovalada y la laúd alargada y con
// las quillas longitudinales que le dan su nombre (tortuga de cuero).
const FORMA = {
  golfina: { rx: 1.00, ry: 0.92, quillas: 0 },
  prieta:  { rx: 0.86, ry: 1.06, quillas: 0 },
  laud:    { rx: 0.72, ry: 1.22, quillas: 3 },
};

function Tortuga({ x, y, r, fill, stroke, borde = 1.2, especie = "golfina", opacity = 1 }) {
  const f = FORMA[especie] || FORMA.golfina;
  const rx = r * f.rx;
  const ry = r * f.ry;
  const al = r * 0.42;            // aleta
  const quillas = [];
  for (let i = 0; i < f.quillas; i++) {
    const dx = (i - (f.quillas - 1) / 2) * rx * 0.55;
    quillas.push(
      <line key={i} x1={dx} y1={-ry * 0.62} x2={dx} y2={ry * 0.62}
        stroke={stroke} strokeWidth={borde * 0.7} opacity={0.75} />
    );
  }
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      {/* aletas delanteras y traseras */}
      <ellipse cx={-rx * 0.85} cy={-ry * 0.40} rx={al} ry={al * 0.58} fill={fill} stroke={stroke} strokeWidth={borde * 0.6} />
      <ellipse cx={rx * 0.85} cy={-ry * 0.40} rx={al} ry={al * 0.58} fill={fill} stroke={stroke} strokeWidth={borde * 0.6} />
      <ellipse cx={-rx * 0.72} cy={ry * 0.62} rx={al * 0.78} ry={al * 0.5} fill={fill} stroke={stroke} strokeWidth={borde * 0.6} />
      <ellipse cx={rx * 0.72} cy={ry * 0.62} rx={al * 0.78} ry={al * 0.5} fill={fill} stroke={stroke} strokeWidth={borde * 0.6} />
      {/* cabeza */}
      <circle cx={0} cy={-ry * 1.02} r={r * 0.34} fill={fill} stroke={stroke} strokeWidth={borde * 0.7} />
      {/* caparazón */}
      <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={fill} stroke={stroke} strokeWidth={borde} />
      {quillas}
    </g>
  );
}

// Cuánto enfría la malla y cuánto el riego, para un nido.
//
// Los tres números suman la temperatura final por construcción: el modelo se
// corre descubierto y sin regar como referencia, y cada intervención es lo que
// resta respecto a ella.
function Desglose({ s }) {
  const total = (s.delta_malla_c || 0) + (s.delta_riego_c || 0);
  const esc = (v) => (total === 0 ? 0 : Math.abs(v) / Math.abs(total) * 100);
  const barra = (color, v) => (
    <div style={{ height: 8, borderRadius: 4, background: color,
      width: `${esc(v)}%`, minWidth: v ? 2 : 0 }} />
  );
  return (
    <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10 }}>
        De dónde sale su temperatura
      </div>
      <div style={{ display: "grid", gap: 8, fontSize: 12,
        fontFamily: "var(--font-mono)" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text2)" }}>Arena descubierta y sin regar</span>
          <strong>{s.temp_sin_intervenir_c} °C</strong>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 60px",
          alignItems: "center", gap: 10 }}>
          <span style={{ color: "var(--text2)" }}>Malla sombra</span>
          {barra("var(--text3)", s.delta_malla_c)}
          <strong style={{ textAlign: "right" }}>{s.delta_malla_c} °C</strong>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 60px",
          alignItems: "center", gap: 10 }}>
          <span style={{ color: "var(--text2)" }}>
            Riego {s.riego ? "" : "(no alcanza a este nido)"}
          </span>
          {barra("rgba(56,189,248,0.8)", s.delta_riego_c)}
          <strong style={{ textAlign: "right" }}>{s.delta_riego_c} °C</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between",
          paddingTop: 8, borderTop: "1px solid var(--border)" }}>
          <span>Temperatura del PTS</span>
          <strong style={{ color: "var(--accent)" }}>
            {s.temp_estimada_pts} °C
          </strong>
        </div>
      </div>
      {Math.abs(s.delta_riego_c || 0) > Math.abs(s.delta_malla_c || 0) && (
        <p style={{ fontSize: 11, color: "var(--warn)", lineHeight: 1.6,
          margin: "10px 0 0" }}>
          A este nido lo salva el <strong>agua</strong>, no la malla: es de los
          que hay que seguir regando.
        </p>
      )}
    </div>
  );
}

export default function TabCorral({ mejor, zonas = [], corral, nidosPrevios = [],
                                   malla = null, riego = null, riegoActivo = false }) {
  const [zoom, setZoom] = useState(1.6);
  const [hover, setHover] = useState(null);
  const [seleccionado, setSeleccionado] = useState(null);
  const [mostrarPrevios, setMostrarPrevios] = useState(true);
  const [mostrarZonasPrev, setMostrarZonasPrev] = useState(false);

  const LARGO = Number(corral.largo_cm) || 4000;
  const ANCHO = Number(corral.ancho_cm) || 3500;

  // Rejilla de sectores derivada del corral (sector_celda_cm en corral_incubacion.csv)
  const CELDA   = Number(corral.sector_celda_cm) || 200;
  const N_COLS  = Math.max(1, Math.ceil(LARGO / CELDA));
  const N_FILAS = Math.max(1, Math.ceil(ANCHO / CELDA));
  const sector  = (x, y) => obtenerSectorFisico(x, y, CELDA, N_COLS, N_FILAS);

  // Escala ÚNICA para los dos ejes, y el lado mayor del corral es el que fija
  // el tamaño del dibujo.
  //
  // Antes el viewBox era siempre 1000 de ancho y la altura salía de la
  // proporción, con el relleno restado después: eso hacía que un centímetro
  // midiera distinto a lo largo que a lo ancho. Con el corral de 30 × 8 m la
  // diferencia era pequeña; con uno de 30 × 40 m las tortugas salían ovaladas
  // y un metro de separación se veía más corto en un eje que en el otro.
  //
  // Tomar el lado mayor evita además que un corral más ancho que largo se
  // dibuje como una tira vertical de tres pantallas de alto.
  const PAD = 50;
  const DIBUJO = 900;                             // lado mayor del área útil
  const escala = DIBUJO / Math.max(LARGO, ANCHO); // unidades de viewBox por cm
  const VW = Math.round(LARGO * escala) + 2 * PAD;
  const VH = Math.round(ANCHO * escala) + 2 * PAD;

  const sx = (cm) => PAD + cm * escala;
  const sy = (cm) => PAD + cm * escala;

  // Tamaño del ícono EN CENTÍMETROS DE TERRENO, no en píxeles fijos.
  //
  // Antes el radio era una constante (7-8 unidades del viewBox), así que al
  // cambiar las medidas del corral el ícono crecía respecto al terreno y dos
  // nidos separados un metro se veían encimados aunque no lo estuvieran.
  // Atado a la escala, una tortuga siempre mide lo mismo sobre la arena: unos
  // 30 cm de radio, menos de la mitad de la separación mínima de la norma.
  const rNido = Math.max(2.5, 30 * escala);       // 30 cm de radio real

  const jornadasPrevias = {};
  nidosPrevios.forEach((n) => {
    if (n.zonas_jornada) {
      Object.entries(n.zonas_jornada).forEach(([nombre, lim]) => {
        const key = `${lim.especie}-${lim.xmin}-${lim.ymin}`;
        jornadasPrevias[key] = { especie: lim.especie, lim };
      });
    }
  });
  const zonasHistoricas = Object.values(jornadasPrevias);

  const handleNidoClick = (nido) => {
    if (seleccionado?.id === nido.id && seleccionado?.jornada_previa === nido.jornada_previa) {
      setSeleccionado(null);
    } else {
      setSeleccionado(nido);
    }
  };

  const lineasX = [];
  for (let c = 1; c < N_COLS; c++) lineasX.push(c * CELDA);
  const lineasY = [];
  for (let f = 1; f < N_FILAS; f++) lineasY.push(f * CELDA);

  return (
    <div>
      {/* Controles */}
      {nidosPrevios.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <button
            className={`btn ${mostrarPrevios ? "btn-primary" : "btn-secondary"}`}
            style={{ width: "auto", padding: "6px 12px", fontSize: 12 }}
            onClick={() => setMostrarPrevios(!mostrarPrevios)}
          >
            {mostrarPrevios ? "✓ Mostrar" : "✕ Ocultar"} nidos previos ({nidosPrevios.length})
          </button>
          {mostrarPrevios && zonasHistoricas.length > 0 && (
            <button
              className={`btn ${mostrarZonasPrev ? "btn-primary" : "btn-secondary"}`}
              style={{ width: "auto", padding: "6px 12px", fontSize: 12 }}
              onClick={() => setMostrarZonasPrev(!mostrarZonasPrev)}
            >
              {mostrarZonasPrev ? "✓ Ver" : "✕ Ocultar"} zonas históricas
            </button>
          )}
        </div>
      )}

      {/* Leyenda de Semanas */}
      <div className="card" style={{ padding: "12px 16px", marginBottom: 16, background: "var(--bg2)" }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 16, height: 16, background: "#27ae60", borderRadius: 2 }} />
            <span>Semana 1–2 (Seguro)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 16, height: 16, background: "#e74c3c", borderRadius: 2 }} />
            <span><strong>Semana 3 (🔥 CRÍTICA — PTS)</strong></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 16, height: 16, background: "#f39c12", borderRadius: 2 }} />
            <span>Semana 4–5 (Próximo eclosión)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 16, height: 16, background: "#7f8c8d", borderRadius: 2 }} />
            <span>Eclosionado</span>
          </div>
        </div>

        {/* Forma de la tortuga = especie. Color = semana de incubación. */}
        <div style={{
          display: "flex", gap: 20, flexWrap: "wrap", fontSize: 12,
          marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)",
          alignItems: "center",
        }}>
          <span style={{ color: "var(--text3)" }}>La forma indica la especie:</span>
          {[["golfina", "Golfina"], ["prieta", "Prieta"], ["laud", "Laúd"]].map(([esp, txt]) => (
            <div key={esp} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <svg width={26} height={26} viewBox="0 0 26 26">
                <Tortuga x={13} y={13} r={8} especie={esp}
                  fill="var(--text2)" stroke="var(--bg)" borde={1.2} />
              </svg>
              <span className={`badge badge-${esp}`}>{txt}</span>
            </div>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "var(--text3)" }}>Zoom</span>
            {[1, 1.6, 2.4, 3.5].map((z) => (
              <button
                key={z}
                className={`btn ${zoom === z ? "btn-primary" : "btn-secondary"}`}
                style={{ width: "auto", padding: "4px 10px", fontSize: 11, margin: 0 }}
                onClick={() => setZoom(z)}
              >
                {z}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Corral */}
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <span className="card-title" style={{ margin: 0 }}>
            Diagrama del Corral de Incubación
          </span>
          <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 12, fontFamily: "var(--font-mono)" }}>
            {cmToM(LARGO)}m × {cmToM(ANCHO)}m · rejilla {cmToM(CELDA)}m ({N_COLS}×{N_FILAS} sectores) · Click en nido para ver detalles · Color por semana
          </span>
        </div>

        {/* Desplazamiento en LOS DOS ejes y alto acotado: un corral más ancho
            que largo se dibuja alto, y sin este tope empujaba el resto de la
            pestaña fuera de la pantalla en lugar de dejarse recorrer. */}
        <div style={{ overflow: "auto", maxHeight: "78vh", background: "var(--bg3)" }}>
          <svg viewBox={`0 0 ${VW} ${VH + 20}`} width={`${100 * zoom}%`}
            style={{ display: "block", minWidth: 600 * zoom }}>
            {/* Fondo general */}
            <rect x={PAD} y={PAD} width={VW - 2 * PAD} height={VH - 2 * PAD}
              fill="rgba(0,0,0,0.3)" stroke="var(--border)" strokeWidth={2} rx={4} />

            {/* Zonas por especie de esta jornada */}
            {zonas.map((z) => {
              const c = ZONA_COLS[z.especie] || ZONA_COLS.golfina;
              return (
                <g key={z.nombre}>
                  <rect
                    x={sx(z.xmin)} y={sy(z.ymin)}
                    width={sx(z.xmax) - sx(z.xmin)}
                    height={sy(z.ymax) - sy(z.ymin)}
                    fill={c.bg} stroke={c.borde}
                    strokeWidth={1.5} strokeDasharray="6 3"
                  />
                  {/* Fuera del área de siembra: con el llenado secuencial la
                      primera hilera ocupa justo el borde superior de la zona */}
                  <text
                    x={(sx(z.xmin) + sx(z.xmax)) / 2} y={sy(z.ymin) - 10}
                    textAnchor="middle" fill={c.texto}
                    fontSize={12} fontWeight={700}
                    fontFamily="Syne,sans-serif" opacity={0.8}
                  >
                    ZONA {z.especie.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* Malla sombra (csv/sitio.csv). La sombra real se corre con el sol,
                así que cada nido lleva su propia fracción de sombra calculada. */}
            {malla && (
              <g pointerEvents="none">
                <defs>
                  <pattern id="rayado-malla" width="10" height="10" patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="10" stroke="var(--text3)" strokeWidth="1.5" opacity="0.35" />
                  </pattern>
                </defs>
                <rect
                  x={sx(malla.xmin)} y={sy(malla.ymin)}
                  width={sx(malla.xmax) - sx(malla.xmin)}
                  height={sy(malla.ymax) - sy(malla.ymin)}
                  fill="url(#rayado-malla)" stroke="var(--text3)"
                  strokeWidth={1} strokeDasharray="2 4"
                />
                <text x={sx(malla.xmin) + 6} y={sy(malla.ymax) + 16}
                  fill="var(--text3)" fontSize={11} fontFamily="var(--font-mono)">
                  malla sombra (cubre el corral; el sol entra por los lados)
                </text>
              </g>
            )}

            {/* Región regada (csv/sitio.csv). Es la SEGUNDA intervención del
                corral y la única que se paga cada temporada, así que tiene que
                verse: un nido dentro de ella está a salvo por el agua, no por
                la malla, y dejar de regarlo lo pone en riesgo.
                A diferencia de la sombra no depende del sol: se aplica o no. */}
            {riego && riegoActivo && (
              <g pointerEvents="none">
                <rect
                  x={sx(riego.xmin)} y={sy(riego.ymin)}
                  width={sx(riego.xmax) - sx(riego.xmin)}
                  height={sy(riego.ymax) - sy(riego.ymin)}
                  fill="rgba(56,189,248,0.07)" stroke="rgba(56,189,248,0.55)"
                  strokeWidth={1.5} strokeDasharray="7 5"
                />
                <text x={sx(riego.xmin) + 6} y={sy(riego.ymin) + 16}
                  fill="rgba(56,189,248,0.9)" fontSize={11} fontFamily="var(--font-mono)">
                  zona de riego
                </text>
              </g>
            )}

            {/* Cuadrícula de sectores (tenue) */}
            {lineasX.map((xVal, idx) => (
              <line
                key={`gridx-${idx}`}
                x1={sx(xVal)} y1={PAD}
                x2={sx(xVal)} y2={VH - PAD}
                stroke="rgba(255,255,255,0.04)"
                strokeDasharray="2 2"
              />
            ))}

            {/* Nidos PREVIOS */}
            {mostrarPrevios && nidosPrevios.map((n, idx) => {
              const isEcl = n.eclosionado;
              const colorInfo = getColorPorSemana(n.semana_info, isEcl);
              const isHov = hover?.id === n.id && hover?.jornada_previa;
              const isSelected = seleccionado?.id === n.id && seleccionado?.jornada_previa;
              return (
                <g
                  key={`prev-${idx}`}
                  onMouseEnter={() => setHover({ ...n, jornada_previa: true })}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => handleNidoClick({ ...n, jornada_previa: true })}
                  style={{ cursor: "pointer" }}
                >
                  <Tortuga
                    x={sx(n.x)} y={sy(n.y)}
                    r={rNido * (isSelected ? 1.25 : isHov ? 1.1 : 0.8)}
                    especie={n.especie}
                    fill={colorInfo.fill}
                    opacity={isSelected ? 0.9 : 0.45}
                    stroke={isSelected ? "#fff" : colorInfo.stroke}
                    borde={isSelected ? 2 : 1}
                  />
                </g>
              );
            })}

            {/* Nidos de ESTA JORNADA (destacados) */}
            {mejor.genes.map((g) => {
              const colorInfo = getColorPorSemana(g.semana_info, false);
              const isHov = hover?.id === g.id && !hover?.jornada_previa;
              const isSelected = seleccionado?.id === g.id && !seleccionado?.jornada_previa;

              return (
                <g
                  key={g.id}
                  onMouseEnter={() => setHover(g)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => handleNidoClick(g)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Tortuga del nido, con la silueta de su especie */}
                  <Tortuga
                    x={sx(g.x)} y={sy(g.y)}
                    r={rNido * (isSelected ? 1.35 : isHov ? 1.18 : 1.0)}
                    especie={g.especie}
                    fill={colorInfo.fill}
                    stroke={isSelected ? "#fff" : "#000"}
                    borde={isSelected ? 2.5 : isHov ? 2 : 1.4}
                  />

                  {/* Indicador de PTS en la esquina (punto adicional si está en semana 3) */}
                  {g.semana_info?.semana_critica && (
                    <circle
                      cx={sx(g.x) + 7} cy={sy(g.y) - 7}
                      r={3.5}
                      fill="#fff"
                      stroke="#e74c3c"
                      strokeWidth={1.5}
                    />
                  )}

                  {/* Tooltip en hover/selección */}
                  {(isSelected || isHov) && (
                    <g>
                      <rect
                        x={sx(g.x) - 60} y={sy(g.y) - 45}
                        width={120} height={40}
                        fill="var(--bg)"
                        stroke={colorInfo.fill}
                        strokeWidth={2}
                        rx={4}
                      />
                      <text
                        x={sx(g.x)} y={sy(g.y) - 28}
                        textAnchor="middle" fill={colorInfo.fill}
                        fontSize={11} fontWeight="bold" fontFamily="var(--font-mono)"
                      >
                        {sector(g.x, g.y)}
                      </text>
                      <text
                        x={sx(g.x)} y={sy(g.y) - 14}
                        textAnchor="middle" fill="var(--text)"
                        fontSize={10} fontFamily="var(--font-mono)"
                      >
                        {g.especie}
                      </text>
                      <text
                        x={sx(g.x)} y={sy(g.y) + 2}
                        textAnchor="middle" fill="var(--text3)"
                        fontSize={9} fontFamily="var(--font-mono)"
                      >
                        Prof: {g.prof}cm
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Ejes */}
            <text x={VW / 2} y={VH + 12} textAnchor="middle"
              fill="#484f58" fontSize={10} fontFamily="DM Mono">
              Largo del Corral (0 → {cmToM(LARGO)}m)
            </text>
          </svg>
        </div>

        {/* Información en hover temporal */}
        {hover && !seleccionado && (
          <div style={{
            padding: "12px 16px", background: "var(--bg2)",
            borderTop: "1px solid var(--border)",
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16,
            fontFamily: "var(--font-mono)", fontSize: 12,
          }}>
            <span>
              <span style={{ color: "var(--text2)" }}>Nido ID: </span>
              <strong>{hover.id}</strong>
            </span>
            <span>
              <span style={{ color: "var(--text2)" }}>Especie: </span>
              <strong>{hover.especie}</strong>
            </span>
            <span>
              <span style={{ color: "var(--text2)" }}>Sector: </span>
              <strong style={{ color: "var(--warn)" }}>{sector(hover.x, hover.y)}</strong>
            </span>
            <span>
              <span style={{ color: "var(--text2)" }}>Profundidad: </span>
              <strong>{hover.prof?.toFixed(1)} cm</strong>
            </span>
            {hover.semana_info && (
              <>
                <span>
                  <span style={{ color: "var(--text2)" }}>Semana: </span>
                  <strong style={{ color: hover.semana_info.semana_critica ? "#e74c3c" : "#27ae60" }}>
                    {hover.semana_info.semana} {hover.semana_info.en_pts ? "(🔥 PTS)" : ""}
                  </strong>
                </span>
                <span>
                  <span style={{ color: "var(--text2)" }}>Días faltantes: </span>
                  <strong>{hover.semana_info.dias_faltantes}</strong>
                </span>
              </>
            )}
            {hover.num_huevas > 0 && (
              <span>
                <span style={{ color: "var(--text2)" }}>Huevas: </span>
                <strong>{hover.num_huevas}</strong>
              </span>
            )}
            {hover.jornada_previa && (
              <span className="badge" style={{
                background: hover.eclosionado ? "rgba(127,140,141,0.2)" : "rgba(161,85,232,0.2)",
                color: hover.eclosionado ? "#7f8c8d" : "var(--laud)"
              }}>
                {hover.eclosionado ? "Eclosionado (Descanso)" : "Nido Previo"}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tarjeta de selección persistente */}
      {seleccionado && (
        <div className="card" style={{ border: "2px solid var(--accent)", position: "relative" }}>
          <button
            onClick={() => setSeleccionado(null)}
            style={{
              position: "absolute", top: 12, right: 16,
              background: "none", border: "none", color: "var(--text3)",
              cursor: "pointer", fontSize: 18
            }}
          >
            ✕
          </button>
          <div className="card-title" style={{ color: "var(--accent)", marginBottom: 14 }}>
            📍 Nido Seleccionado para Siembra
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
            <div>
              <span style={{ color: "var(--text3)", fontSize: 11, display: "block", marginBottom: 4 }}>ID Nido</span>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{seleccionado.id}</span>
            </div>
            <div>
              <span style={{ color: "var(--text3)", fontSize: 11, display: "block", marginBottom: 4 }}>Especie</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>
                {seleccionado.especie}
              </span>
            </div>
            <div>
              <span style={{ color: "var(--text3)", fontSize: 11, display: "block", marginBottom: 4 }}>Sector Físico</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--warn)", fontFamily: "var(--font-mono)" }}>
                {sector(seleccionado.x, seleccionado.y)}
              </span>
            </div>
            <div>
              <span style={{ color: "var(--text3)", fontSize: 11, display: "block", marginBottom: 4 }}>Profundidad</span>
              <span style={{ fontSize: 14, fontFamily: "var(--font-mono)" }}>
                <strong>{seleccionado.prof?.toFixed(1)}</strong> cm
              </span>
            </div>
            {seleccionado.semana_info && (
              <div>
                <span style={{ color: "var(--text3)", fontSize: 11, display: "block", marginBottom: 4 }}>Semana Incubación</span>
                <span style={{
                  fontSize: 14, fontWeight: 700,
                  color: seleccionado.semana_info.semana_critica ? "#e74c3c" : "#27ae60"
                }}>
                  Semana {seleccionado.semana_info.semana} {seleccionado.semana_info.en_pts ? "🔥" : ""}
                </span>
              </div>
            )}
            {seleccionado.num_huevas > 0 && (
              <div>
                <span style={{ color: "var(--text3)", fontSize: 11, display: "block", marginBottom: 4 }}>Huevas</span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{seleccionado.num_huevas}</span>
              </div>
            )}
            {seleccionado.proporcion_sexual && (
              <div>
                <span style={{ color: "var(--text3)", fontSize: 11, display: "block", marginBottom: 4 }}>Sex Ratio</span>
                <span style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}>
                  <strong style={{ color: "var(--laud)" }}>{seleccionado.proporcion_sexual.pct_hembras}% ♀</strong> / <strong style={{ color: "var(--prieta)" }}>{seleccionado.proporcion_sexual.pct_machos}% ♂</strong>
                </span>
              </div>
            )}
            {seleccionado.sombra_solar != null && (
              <div>
                <span style={{ color: "var(--text3)", fontSize: 11, display: "block", marginBottom: 4 }}>Sombra del día</span>
                <span style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}>
                  <strong>{(seleccionado.sombra_solar * 100).toFixed(0)}%</strong> de la insolación directa
                  {seleccionado.proporcion_sexual && (
                    <> · PTS {seleccionado.proporcion_sexual.temp_estimada_pts} °C</>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* De dónde sale la temperatura de ESTE nido: qué parte la quitó la
              malla y qué parte el riego. Sin este desglose el número aparecía
              sin explicación, y es justo lo que decide la recomendación
              económica: si un nido está a salvo por la malla, regarlo no
              compra nada; si lo está por el agua, dejar de regar lo condena. */}
          {seleccionado.proporcion_sexual?.delta_malla_c != null && (
            <Desglose s={seleccionado.proporcion_sexual} />
          )}
        </div>
      )}
    </div>
  );
}
