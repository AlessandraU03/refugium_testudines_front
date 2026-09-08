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

export default function TabCorral({ mejor, zonas = [], corral, nidosPrevios = [] }) {
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

  const VW = 1000;
  const VH = Math.round((ANCHO / LARGO) * VW);
  const PAD = 50;

  const sx = (cm) => PAD + (cm / LARGO) * (VW - 2 * PAD);
  const sy = (cm) => PAD + (cm / ANCHO) * (VH - 2 * PAD);

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

        <div style={{ overflowX: "auto", background: "var(--bg3)" }}>
          <svg viewBox={`0 0 ${VW} ${VH + 20}`} width="100%" style={{ display: "block", minWidth: 600 }}>
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
                  <circle
                    cx={sx(n.x)} cy={sy(n.y)}
                    r={isSelected ? 7 : isHov ? 6 : 4}
                    fill={colorInfo.fill}
                    opacity={isSelected ? 0.85 : 0.4}
                    stroke={isSelected ? "#fff" : colorInfo.stroke}
                    strokeWidth={isSelected ? 2 : isHov ? 1.5 : 1}
                    style={{ transition: "r 0.15s" }}
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
                  {/* Círculo del nido */}
                  <circle
                    cx={sx(g.x)} cy={sy(g.y)}
                    r={isSelected ? 11 : isHov ? 9.5 : 7}
                    fill={colorInfo.fill}
                    stroke={isSelected ? "#fff" : "#000"}
                    strokeWidth={isSelected ? 2.5 : isHov ? 2 : 1.5}
                    opacity={1}
                    style={{ transition: "r 0.15s" }}
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
          </div>
        </div>
      )}
    </div>
  );
}
