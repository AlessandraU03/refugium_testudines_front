import { useState } from "react";

const COLS = {
  golfina: { 
    fill: "var(--golfina)", 
    stroke: "var(--golfina-stroke)", 
    zona: "var(--golfina-bg)", 
    zonaBorder: "var(--golfina-border)" 
  },
  prieta:  { 
    fill: "var(--prieta)", 
    stroke: "var(--prieta-stroke)", 
    zona: "var(--prieta-bg)", 
    zonaBorder: "var(--prieta-border)" 
  },
  laud:    { 
    fill: "var(--laud)", 
    stroke: "var(--laud-stroke)", 
    zona: "var(--laud-bg)", 
    zonaBorder: "var(--laud-border)" 
  },
};

// Funciones de conversión
const cmToM = (cm) => (cm * 0.01).toFixed(2);
const mToCm = (m) => m / 0.01;

// Devuelve los límites de zona originales del nido previo (guardados al sembrar)
function zonaOriginal(nido) {
  const zj = nido.zonas_jornada || {};
  return zj[`zona_${nido.especie}`] || null;
}

export default function TabCorral({ mejor, zonas, corral, nidosPrevios = [] }) {
  const [hover,            setHover]            = useState(null);
  const [seleccionado,     setSeleccionado]     = useState(null);
  const [mostrarPrevios,   setMostrarPrevios]   = useState(true);
  const [mostrarZonasPrev, setMostrarZonasPrev] = useState(false);

  const LARGO = parseFloat(corral.largo_cm);
  const ANCHO = parseFloat(corral.ancho_cm);
  const VW = 860;
  const VH = Math.round((ANCHO / LARGO) * VW);
  const PAD = 55;

  const sx = (x) => PAD + (x / LARGO) * (VW - 2 * PAD);
  const sy = (y) => PAD + (y / ANCHO) * (VH - 2 * PAD);

  const conteo = {};
  mejor.genes.forEach((g) => { conteo[g.especie] = (conteo[g.especie] || 0) + 1; });

  const jornadasPrevias = {};
  nidosPrevios.forEach((n) => {
    if (!jornadasPrevias[n.fecha_siembra]) jornadasPrevias[n.fecha_siembra] = [];
    jornadasPrevias[n.fecha_siembra].push(n);
  });

  // ¿Existen nidos previos cuya zona original difiere de la zona actual de esa especie?
  const hayZonasPrevDistintas = nidosPrevios.some((n) => {
    const zo = zonaOriginal(n);
    if (!zo) return false;
    const zonaActual = zonas.find((z) => z.especie === n.especie);
    if (!zonaActual) return true;
    return Math.abs(zo.xmin - zonaActual.xmin) > 1 || Math.abs(zo.xmax - zonaActual.xmax) > 1;
  });

  // Colectar rectángulos de zonas históricas únicas (por especie + xmin + xmax)
  const zonasHistoricas = [];
  if (mostrarPrevios && mostrarZonasPrev) {
    const vistos = new Set();
    nidosPrevios.forEach((n) => {
      const zo = zonaOriginal(n);
      if (!zo) return;
      const zonaActual = zonas.find((z) => z.especie === n.especie);
      const esDiferente = !zonaActual ||
        Math.abs(zo.xmin - zonaActual.xmin) > 1 ||
        Math.abs(zo.xmax - zonaActual.xmax) > 1;
      if (!esDiferente) return;
      const key = `${n.especie}-${zo.xmin}-${zo.xmax}`;
      if (!vistos.has(key)) {
        vistos.add(key);
        zonasHistoricas.push({ especie: n.especie, lim: zo });
      }
    });
  }

  const handleNidoClick = (nido) => {
    setSeleccionado({ ...nido });
  };

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {["golfina","prieta","laud"].filter((e) => conteo[e]).map((esp) => (
          <div key={esp} className="stat-box"
            style={{ flex: 1, minWidth: 100, borderColor: COLS[esp].zonaBorder }}>
            <div className="stat-val" style={{ color: COLS[esp].fill }}>{conteo[esp]}</div>
            <div className="stat-lbl">{esp} (esta jornada)</div>
          </div>
        ))}
        {nidosPrevios.length > 0 && (
          <div className="stat-box"
            style={{ flex: 1, minWidth: 100, borderColor: "rgba(255,190,11,0.3)" }}>
            <div className="stat-val" style={{ color: "var(--warn)" }}>{nidosPrevios.length}</div>
            <div className="stat-lbl">nidos previos activos</div>
          </div>
        )}
        <div className="stat-box" style={{ flex: 1, minWidth: 100 }}>
          <div className="stat-val">{mejor.genes.length + nidosPrevios.length}</div>
          <div className="stat-lbl">total en corral</div>
        </div>
        <div className="stat-box" style={{ flex: 1, minWidth: 100 }}>
          <div className="stat-val" style={{ color: "var(--accent)" }}>
            {(mejor.v1 * 100).toFixed(1)}%
          </div>
          <div className="stat-lbl">tasa eclosión corral completo</div>
        </div>
      </div>

      {/* Aviso de zonas distintas entre jornadas */}
      {hayZonasPrevDistintas && (
        <div style={{
          background: "rgba(255,190,11,0.07)", border: "1px solid rgba(255,190,11,0.25)",
          borderRadius: 8, padding: "8px 14px", marginBottom: 10,
          fontSize: 11, color: "var(--warn)", lineHeight: 1.5,
        }}>
          <strong>ℹ Las zonas cambian entre jornadas</strong> porque son proporcionales al número
          de nidos de cada jornada. Los nidos previos están dibujados en sus coordenadas
          reales (donde fueron físicamente sembrados); su color indica su especie correcta.
        </div>
      )}

      {/* Controles */}
      {nidosPrevios.length > 0 && (
        <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button
            className="btn btn-secondary"
            style={{ width: "auto", padding: "6px 14px", fontSize: 11, marginBottom: 0 }}
            onClick={() => setMostrarPrevios((v) => !v)}
          >
            {mostrarPrevios ? "🙈 Ocultar" : "👁 Mostrar"} nidos previos ({nidosPrevios.length})
          </button>
          {hayZonasPrevDistintas && mostrarPrevios && (
            <button
              className="btn btn-secondary"
              style={{ width: "auto", padding: "6px 14px", fontSize: 11, marginBottom: 0 }}
              onClick={() => setMostrarZonasPrev((v) => !v)}
            >
              {mostrarZonasPrev ? "Ocultar" : "Ver"} zonas históricas
            </button>
          )}
          <span style={{ fontSize: 11, color: "var(--text3)", alignSelf: "center" }}>
            {Object.keys(jornadasPrevias).length} jornada(s) guardada(s)
          </span>
        </div>
      )}

      {/* SVG Corral */}
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <span className="card-title" style={{ margin: 0 }}>
            Diagrama del Corral de Incubación
          </span>
          <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 12, fontFamily: "var(--font-mono)" }}>
            {cmToM(LARGO)}m × {cmToM(ANCHO)}m · Click en nido para detalles persistentes
          </span>
        </div>

        <div style={{ overflowX: "auto", background: "var(--bg3)" }}>
          <svg viewBox={`0 0 ${VW} ${VH + 20}`} width="100%"
            style={{ display: "block", minWidth: 480 }}>

            {/* Fondo */}
            <rect x={PAD} y={PAD} width={VW - 2*PAD} height={VH - 2*PAD}
              fill="var(--corral-bg)" stroke="var(--border)" strokeWidth={2} rx={4} />

            {/* Zonas HISTÓRICAS (punteado tenue, solo si el usuario lo activa) */}
            {zonasHistoricas.map(({ especie, lim }) => {
              const c = COLS[especie];
              return (
                <rect
                  key={`zhist-${especie}-${lim.xmin}`}
                  x={sx(lim.xmin)} y={sy(lim.ymin)}
                  width={sx(lim.xmax) - sx(lim.xmin)}
                  height={sy(lim.ymax) - sy(lim.ymin)}
                  fill="none"
                  stroke={c.zonaBorder}
                  strokeWidth={1} strokeDasharray="3 6" opacity={0.45}
                />
              );
            })}

            {/* Zonas de ESTA jornada */}
            {zonas.map((z) => {
              const c = COLS[z.especie];
              return (
                <g key={z.nombre}>
                  <rect
                    x={sx(z.xmin)} y={sy(z.ymin)}
                    width={sx(z.xmax) - sx(z.xmin)}
                    height={sy(z.ymax) - sy(z.ymin)}
                    fill={c.zona} stroke={c.zonaBorder}
                    strokeWidth={1.5} strokeDasharray="6 3"
                  />
                  <text
                    x={(sx(z.xmin) + sx(z.xmax)) / 2} y={sy(z.ymin) + 18}
                    textAnchor="middle" fill={c.fill}
                    fontSize={12} fontWeight={700}
                    fontFamily="Syne,sans-serif" opacity={0.65}
                  >
                    ZONA {z.especie.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* Nidos PREVIOS — dibujados en sus coordenadas reales (x,y físico),
                coloreados por su especie correcta, no por la zona actual */}
            {mostrarPrevios && nidosPrevios.map((n, idx) => {
              const c = COLS[n.especie];
              const isHov = hover?.id === n.id && hover?.jornada_previa;
              const isSelected = seleccionado?.id === n.id && seleccionado?.jornada_previa;
              return (
                <g key={`prev-${idx}`}
                  onMouseEnter={() => setHover({ ...n, jornada_previa: true })}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => handleNidoClick({ ...n, jornada_previa: true })}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx={sx(n.x)} cy={sy(n.y)}
                    r={isSelected ? 7.5 : isHov ? 6.5 : 4.5}
                    fill={c.fill}
                    opacity={isSelected ? 0.85 : 0.38}
                    stroke={isSelected ? "#fff" : isHov ? "#fff" : c.stroke}
                    strokeWidth={isSelected ? 2 : isHov ? 1.5 : 1}
                    style={{ transition: "r 0.15s, stroke-width 0.15s" }}
                  />
                </g>
              );
            })}

            {/* Nidos de ESTA jornada */}
            {mejor.genes.map((g) => {
              const c = COLS[g.especie];
              const isHov = hover?.id === g.id && !hover?.jornada_previa;
              const isSelected = seleccionado?.id === g.id && !seleccionado?.jornada_previa;
              return (
                <g key={g.id}
                  onMouseEnter={() => setHover(g)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => handleNidoClick(g)}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx={sx(g.x)} cy={sy(g.y)}
                    r={isSelected ? 10 : isHov ? 9 : 6}
                    fill={c.fill}
                    stroke={isSelected ? "#fff" : isHov ? "#fff" : c.stroke}
                    strokeWidth={isSelected ? 2.5 : isHov ? 2 : 1}
                    opacity={isSelected ? 1 : 0.9}
                    style={{ transition: "r 0.15s, stroke-width 0.15s" }}
                  />
                  <text
                    x={sx(g.x)} y={sy(g.y) + 15}
                    textAnchor="middle" fill={c.fill}
                    fontSize={7} fontFamily="DM Mono,monospace" opacity={0.7}
                  >
                    {g.prof}cm
                  </text>
                </g>
              );
            })}

            {/* Ejes — ahora en metros */}
            <text x={VW/2} y={VH+12} textAnchor="middle"
              fill="#484f58" fontSize={10} fontFamily="DM Mono">
              Largo (m)  0 → {cmToM(LARGO)}
            </text>
            <text x={13} y={VH/2} textAnchor="middle" fill="#484f58"
              fontSize={10} fontFamily="DM Mono"
              transform={`rotate(-90,13,${VH/2})`}>
              Ancho (m)
            </text>
          </svg>
        </div>

        {/* Tooltip temporal (hover, desaparece al mover mouse si no está seleccionado) */}
        {hover && !seleccionado && (
          <div style={{
            padding: "10px 16px", background: "var(--bg2)",
            borderTop: "1px solid var(--border)",
            display: "flex", gap: 20, flexWrap: "wrap",
            fontFamily: "var(--font-mono)", fontSize: 12,
          }}>
            {hover.jornada_previa ? (
              <>
                <span style={{ color: "var(--warn)" }}>📌 Sembrado: {hover.fecha_siembra}</span>
                <span><span style={{ color: "var(--text2)" }}>Especie: </span>
                  <span className={`badge badge-${hover.especie}`}>{hover.especie}</span></span>
                <span><span style={{ color: "var(--text2)" }}>X: </span>{cmToM(hover.x)} m</span>
                <span><span style={{ color: "var(--text2)" }}>Y: </span>{cmToM(hover.y)} m</span>
                <span><span style={{ color: "var(--text2)" }}>Prof.: </span>{hover.prof} cm</span>
                <span><span style={{ color: "var(--text2)" }}>Eclosión est.: </span>{hover.fecha_eclosion}</span>
              </>
            ) : (
              <>
                <span><span style={{ color: "var(--text2)" }}>Nido #: </span>{hover.id}</span>
                <span><span style={{ color: "var(--text2)" }}>Especie: </span>
                  <span className={`badge badge-${hover.especie}`}>{hover.especie}</span></span>
                <span><span style={{ color: "var(--text2)" }}>X: </span>{cmToM(hover.x)} m</span>
                <span><span style={{ color: "var(--text2)" }}>Y: </span>{cmToM(hover.y)} m</span>
                <span><span style={{ color: "var(--text2)" }}>Prof.: </span>{hover.prof} cm</span>
                <span><span style={{ color: "var(--text2)" }}>Zona: </span>zona_{hover.especie}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Cuadro de información PERSISTENTE al hacer click */}
      {seleccionado && (
        <div className="card" style={{ 
          background: "rgba(45,206,137,0.08)", 
          borderColor: "rgba(45,206,137,0.3)",
          marginBottom: 16
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="card-title" style={{ margin: 0 }}>
              📍 Nido Seleccionado
            </div>
            <button
              className="btn btn-secondary"
              style={{ width: "auto", padding: "4px 12px", fontSize: 11, marginBottom: 0 }}
              onClick={() => setSeleccionado(null)}
            >
              ✕ Cerrar
            </button>
          </div>

          <div style={{
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 14, 
            fontFamily: "var(--font-mono)", 
            fontSize: 12,
          }}>
            {seleccionado.jornada_previa && (
              <div>
                <span style={{ color: "var(--text3)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  📅 Jornada Siembra
                </span>
                <div style={{ color: "var(--warn)", fontWeight: 600, marginTop: 4 }}>
                  {seleccionado.fecha_siembra}
                </div>
              </div>
            )}

            <div>
              <span style={{ color: "var(--text3)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🐢 Especie
              </span>
              <div style={{ marginTop: 4 }}>
                <span className={`badge badge-${seleccionado.especie}`}>
                  {seleccionado.especie.toUpperCase()}
                </span>
              </div>
            </div>

            <div>
              <span style={{ color: "var(--text3)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                📏 Pos. X
              </span>
              <div style={{ color: "var(--accent)", fontWeight: 600, marginTop: 4 }}>
                {cmToM(seleccionado.x)} m
              </div>
            </div>

            <div>
              <span style={{ color: "var(--text3)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                📏 Pos. Y
              </span>
              <div style={{ color: "var(--accent)", fontWeight: 600, marginTop: 4 }}>
                {cmToM(seleccionado.y)} m
              </div>
            </div>

            <div>
              <span style={{ color: "var(--text3)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                ⬇ Profundidad
              </span>
              <div style={{ color: "var(--accent)", fontWeight: 600, marginTop: 4 }}>
                {seleccionado.prof} cm
              </div>
            </div>

            {seleccionado.fecha_eclosion && (
              <div>
                <span style={{ color: "var(--text3)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  🐣 Eclosión Est.
                </span>
                <div style={{ color: "var(--accent)", fontWeight: 600, marginTop: 4 }}>
                  {seleccionado.fecha_eclosion}
                </div>
              </div>
            )}

            {!seleccionado.jornada_previa && (
              <div>
                <span style={{ color: "var(--text3)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  🗺 Zona Asignada
                </span>
                <div style={{ color: "var(--accent)", fontWeight: 600, marginTop: 4 }}>
                  zona_{seleccionado.especie}
                </div>
              </div>
            )}

            {seleccionado.id && (
              <div>
                <span style={{ color: "var(--text3)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  🆔 ID Nido
                </span>
                <div style={{ color: "var(--text2)", fontWeight: 500, marginTop: 4 }}>
                  {seleccionado.id}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="legend" style={{ marginTop: 12 }}>
        {["golfina","prieta","laud"].map((e) => (
          <div key={e} className="legend-item">
            <div className="legend-dot" style={{ background: COLS[e].fill }} />
            <span style={{ color: "var(--text2)" }}>{e} (esta jornada, opaco)</span>
          </div>
        ))}
        {nidosPrevios.length > 0 && (
          <div className="legend-item">
            <div className="legend-dot" style={{ background: "#aaa", opacity: 0.45 }} />
            <span style={{ color: "var(--text3)" }}>
              jornadas previas (semitransparente, color = especie real, posición = donde fue sembrado)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}