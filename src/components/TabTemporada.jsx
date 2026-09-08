import { useState } from "react";

const COLS = {
  golfina: { fill: "#2dce89", stroke: "#1aab6d" },
  prieta:  { fill: "#4b9cf5", stroke: "#2a7fd4" },
  laud:    { fill: "#f5365c", stroke: "#d41a3e" },
};

const ZONA_COLS = {
  golfina: { zona: "rgba(45,206,137,0.06)",  border: "rgba(45,206,137,0.25)" },
  prieta:  { zona: "rgba(75,156,245,0.06)",   border: "rgba(75,156,245,0.25)" },
  laud:    { zona: "rgba(245,54,92,0.06)",    border: "rgba(245,54,92,0.25)"  },
};

const cmToM = (cm) => (cm * 0.01).toFixed(2);

function obtenerSectorFisico(xCm, yCm) {
  const xM = xCm * 0.01;
  const yM = yCm * 0.01;
  const colIdx = Math.min(Math.floor(xM / 2), 19);
  const rowIdx = Math.min(Math.floor(yM / 2), 17);
  const letras = "ABCDEFGHIJKLMNOPQRST";
  const letra = letras[colIdx] || "?";
  const numero = rowIdx + 1;
  return `${letra}-${numero}`;
}

export default function TabTemporada({ temporada, corral }) {
  const [hover, setHover] = useState(null);

  if (!temporada) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <p>No hay jornadas registradas en esta temporada</p>
        <p className="empty-sub">Ejecuta el AG y guarda una jornada para verla aquí</p>
      </div>
    );
  }

  const { nidos = [], resumen = {}, corral: c } = temporada;
  const corralData = corral || c || {};
  const LARGO = parseFloat(corralData.largo_cm || 4000);
  const ANCHO = parseFloat(corralData.ancho_cm || 3500);
  const CAP   = parseInt(corralData.capacidad_maxima_nidos_simultaneos || 400);

  const VW = 860;
  const VH = Math.round((ANCHO / LARGO) * VW);
  const PAD = 55;
  const sx = (x) => PAD + (x / LARGO) * (VW - 2 * PAD);
  const sy = (y) => PAD + (y / ANCHO) * (VH - 2 * PAD);

  // Agrupar por jornada (fecha_siembra)
  const jornadasMap = {};
  nidos.forEach((n) => {
    if (!jornadasMap[n.fecha_siembra]) jornadasMap[n.fecha_siembra] = [];
    jornadasMap[n.fecha_siembra].push(n);
  });
  const fechasOrdenadas = Object.keys(jornadasMap).sort();

  // Opacidad de nido según antigüedad (más reciente = más brillante)
  const opacidadJornada = (fecha) => {
    const idx = fechasOrdenadas.indexOf(fecha);
    if (idx === -1) return 0.45;
    return 0.35 + (idx / Math.max(fechasOrdenadas.length - 1, 1)) * 0.55;
  };

  // Recompilar zonas acumuladas históricas a partir de los nidos previos
  const zonasAcumuladas = [];
  const zonasVistas = new Set();
  nidos.forEach((n) => {
    if (n.zonas_jornada) {
      Object.entries(n.zonas_jornada).forEach(([nombre, lim]) => {
        const key = `${n.fecha_siembra}-${lim.especie}-${lim.xmin}-${lim.ymin}`;
        if (!zonasVistas.has(key)) {
          zonasVistas.add(key);
          zonasAcumuladas.push({ fecha: n.fecha_siembra, especie: lim.especie, ...lim });
        }
      });
    }
  });

  // Parámetros de cuadrícula de 2x2 metros
  const lineasX = [];
  for (let xM = 2; xM < 40; xM += 2) {
    lineasX.push(xM * 100);
  }
  const lineasY = [];
  for (let yM = 2; yM < 35; yM += 2) {
    lineasY.push(yM * 100);
  }
  const letrasColumnas = "ABCDEFGHIJKLMNOPQRST".split("");

  return (
    <div>
      {/* Indicadores resumidos de capacidad */}
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <div className="card text-center">
          <div className="num-large" style={{ color: "var(--accent)" }}>{fechasOrdenadas.length}</div>
          <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase" }}>Jornadas</div>
        </div>
        <div className="card text-center">
          <div className="num-large">{nidos.filter(n => !n.eclosionado).length}</div>
          <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase" }}>Nidos Activos</div>
        </div>
        <div className="card text-center">
          <div className="num-large" style={{ color: "var(--laud)" }}>
            {((nidos.filter(n => !n.eclosionado).length / CAP) * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase" }}>Capacidad Ocupada</div>
        </div>
        <div className="card text-center">
          <div className="num-large" style={{ color: "var(--golfina)" }}>
            {Math.max(0, CAP - nidos.filter(n => !n.eclosionado).length)}
          </div>
          <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase" }}>Espacios Libres</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Ocupación del Corral ({nidos.filter(n => !n.eclosionado).length} / {CAP} nidos)</div>
        <div style={{ height: 10, background: "var(--bg3)", borderRadius: 5, overflow: "hidden" }}>
          <div style={{
            width: `${Math.min((nidos.filter(n => !n.eclosionado).length / CAP) * 100, 100)}%`,
            height: "100%", background: "var(--accent)", transition: "width 0.4s"
          }} />
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLS.golfina.fill }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
              <span className="badge badge-golfina">golfina</span>
              <span style={{ color: "var(--text2)", marginLeft: 6 }}>
                {nidos.filter((n) => !n.eclosionado).length} nidos activos
              </span>
            </span>
          </div>
          {nidos.some((n) => n.eclosionado) && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ 
                width: 10, height: 10, borderRadius: "50%", 
                background: "#7f8c8d", border: "1px dashed #95a5a6" 
              }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                <span className="badge badge-sec" style={{ background: "#7f8c8d" }}>descanso</span>
                <span style={{ color: "var(--text2)", marginLeft: 6 }}>
                  {nidos.filter((n) => n.eclosionado).length} zonas en descanso
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {nidos.length === 0 ? (
        <div className="card" style={{ textAlign: "center", color: "var(--text3)", padding: 40 }}>
          <p>No hay nidos activos en el corral actualmente.</p>
          <p style={{ fontSize: 11, marginTop: 6 }}>Guarda una jornada para que aparezca aquí.</p>
        </div>
      ) : (
        <>
          {/* Aviso si hay múltiples jornadas con zonas distintas */}
          {fechasOrdenadas.length > 1 && zonasAcumuladas.length > 3 && (
            <div style={{
              background: "rgba(255,190,11,0.07)", border: "1px solid rgba(255,190,11,0.2)",
              borderRadius: 8, padding: "8px 14px", marginBottom: 10,
              fontSize: 11, color: "var(--warn)", lineHeight: 1.5,
            }}>
              <strong>ℹ Zonas dinámicas:</strong> Las líneas punteadas en el diagrama muestran las zonas
              de cada jornada histórica. Las zonas cambian entre jornadas porque son proporcionales
              al número de nidos recolectados en cada jornada. Cada nido está dibujado
              en su posición física real (donde fue sembrado).
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
              <span className="card-title" style={{ margin: 0 }}>
                Corral Acumulado — Todas las Jornadas Activas
              </span>
              <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 12, fontFamily: "var(--font-mono)" }}>
                Nidos más brillantes = jornadas más recientes · Hover para detalles
              </span>
            </div>
            <div style={{ overflowX: "auto", background: "var(--bg3)" }}>
              <svg viewBox={`0 0 ${VW} ${VH+20}`} width="100%"
                style={{ display: "block", minWidth: 480 }}>
                
                {/* Fondo */}
                <rect x={PAD} y={PAD} width={VW-2*PAD} height={VH-2*PAD}
                  fill="#1a1f26" stroke="var(--border)" strokeWidth={2} rx={4} />

                {/* Cuadrícula de 2x2 metros */}
                {lineasX.map((xVal, idx) => (
                  <line
                    key={`gridx-${idx}`}
                    x1={sx(xVal)} y1={PAD}
                    x2={sx(xVal)} y2={VH - PAD}
                    stroke="rgba(255,255,255,0.05)"
                    strokeDasharray="2 3"
                  />
                ))}
                {lineasY.map((yVal, idx) => (
                  <line
                    key={`gridy-${idx}`}
                    x1={PAD} y1={sy(yVal)}
                    x2={VW - PAD} y2={sy(yVal)}
                    stroke="rgba(255,255,255,0.05)"
                    strokeDasharray="2 3"
                  />
                ))}

                {/* Letras de Columnas (A-T) arriba */}
                {letrasColumnas.map((letra, idx) => (
                  <text
                    key={`letcol-${idx}`}
                    x={sx(idx * 200 + 100)}
                    y={PAD - 8}
                    textAnchor="middle"
                    fill="#5b6975"
                    fontSize={9}
                    fontFamily="var(--font-mono)"
                    fontWeight="bold"
                  >
                    {letra}
                  </text>
                ))}

                {/* Números de Filas (1-18) izquierda */}
                {Array.from({ length: 18 }).map((_, idx) => (
                  <text
                    key={`numrow-${idx}`}
                    x={PAD - 12}
                    y={sy(idx * 200 + 100) + 3.5}
                    textAnchor="end"
                    fill="#5b6975"
                    fontSize={9}
                    fontFamily="var(--font-mono)"
                    fontWeight="bold"
                  >
                    {idx + 1}
                  </text>
                ))}

                {/* Zonas históricas de cada jornada (punteadas, tenues) */}
                {zonasAcumuladas.map((z, idx) => {
                  const c = ZONA_COLS[z.especie] || {};
                  // Calcular opacidad del borde según antigüedad de la jornada
                  const fidx = fechasOrdenadas.indexOf(z.fecha);
                  const op = 0.3 + (fidx / Math.max(fechasOrdenadas.length - 1, 1)) * 0.4;
                  return (
                    <rect
                      key={`za-${idx}`}
                      x={sx(z.xmin)} y={sy(z.ymin)}
                      width={sx(z.xmax) - sx(z.xmin)}
                      height={sy(z.ymax) - sy(z.ymin)}
                      fill={c.zona || "none"}
                      stroke={c.border || "#555"}
                      strokeWidth={1}
                      strokeDasharray={fidx === fechasOrdenadas.length - 1 ? "6 3" : "3 5"}
                      opacity={op}
                    />
                  );
                })}

                {/* Etiquetas de zona de la jornada más reciente */}
                {zonasAcumuladas
                  .filter((z) => z.fecha === fechasOrdenadas[fechasOrdenadas.length - 1])
                  .map((z, idx) => {
                    const c = COLS[z.especie];
                    return (
                      <text key={`zetiq-${idx}`}
                        x={(sx(z.xmin) + sx(z.xmax)) / 2} y={sy(z.ymin) + 16}
                        textAnchor="middle" fill={c.fill}
                        fontSize={11} fontWeight={700}
                        fontFamily="Syne,sans-serif" opacity={0.55}
                      >
                        {z.especie.toUpperCase()}
                      </text>
                    );
                  })
                }

                {/* Todos los nidos (gris y punteado si eclosionó) */}
                {nidos.map((n, idx) => {
                  const isEcl = n.eclosionado;
                  const c   = isEcl ? { fill: "#7f8c8d", stroke: "#95a5a6" } : COLS[n.especie];
                  const op  = isEcl ? 0.25 : opacidadJornada(n.fecha_siembra);
                  const isH = hover?.idx === idx;
                  return (
                    <g key={idx}
                      onMouseEnter={() => setHover({ ...n, idx })}
                      onMouseLeave={() => setHover(null)}
                      style={{ cursor: "pointer" }}
                    >
                      <circle
                        cx={sx(n.x)} cy={sy(n.y)}
                        r={isH ? 9 : 5}
                        fill={c.fill} opacity={isH ? 1 : op}
                        stroke={isH ? "#fff" : c.stroke}
                        strokeWidth={isH ? 2 : 0.5}
                        strokeDasharray={isEcl ? "2 2" : "none"}
                        style={{ transition: "r 0.1s" }}
                      />
                    </g>
                  );
                })}

                <text x={VW/2} y={VH+12} textAnchor="middle"
                  fill="#484f58" fontSize={10} fontFamily="DM Mono">
                  Largo del Corral (Estacas A a T · Metros 0 → {cmToM(LARGO)}m)
                </text>
              </svg>
            </div>
            {hover && (
              <div style={{
                padding: "10px 16px", background: "var(--bg2)",
                borderTop: "1px solid var(--border)",
                display: "flex", gap: 20, flexWrap: "wrap",
                fontFamily: "var(--font-mono)", fontSize: 12,
              }}>
                <span><span style={{ color: "var(--text2)" }}>Jornada: </span>
                  <span style={{ color: "var(--warn)" }}>{hover.fecha_siembra}</span></span>
                <span>
                  <span style={{ color: "var(--text2)" }}>Sector Físico: </span>
                  <strong style={{ color: "var(--accent)" }}>{obtenerSectorFisico(hover.x, hover.y)}</strong>
                </span>
                <span><span style={{ color: "var(--text2)" }}>Especie: </span>
                  <span className={`badge badge-${hover.especie}`}>{hover.especie}</span></span>
                <span><span style={{ color: "var(--text2)" }}>X: </span>{cmToM(hover.x)} m</span>
                <span><span style={{ color: "var(--text2)" }}>Y: </span>{cmToM(hover.y)} m</span>
                <span><span style={{ color: "var(--text2)" }}>Prof.: </span>{hover.prof?.toFixed(1)} cm</span>
                <span><span style={{ color: "var(--text2)" }}>Eclosión: </span>{hover.fecha_eclosion} {hover.eclosionado ? "(Descanso Arena)" : ""}</span>
              </div>
            )}
          </div>

          {/* Tabla por jornada */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title">Detalle por Jornada</div>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Jornada</th>
                    <th>Golfina</th>
                    <th>Prieta</th>
                    <th>Laúd</th>
                    <th>Total</th>
                    <th>Eclosión más tardía</th>
                  </tr>
                </thead>
                <tbody>
                  {fechasOrdenadas.map((f) => {
                    const gps = jornadasMap[f];
                    const g = gps.filter((n) => n.especie === "golfina").length;
                    const p = gps.filter((n) => n.especie === "prieta").length;
                    const l = gps.filter((n) => n.especie === "laud").length;
                    const tot = gps.length;
                    // Encontrar la fecha de eclosión más lejana
                    const ecls = gps.map((n) => n.fecha_eclosion).sort();
                    const maxEcl = ecls[ecls.length - 1];
                    return (
                      <tr key={f}>
                        <td style={{ color: "var(--warn)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{f}</td>
                        <td>{g}</td>
                        <td>{p}</td>
                        <td>{l}</td>
                        <td style={{ fontWeight: 700 }}>{tot}</td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>{maxEcl}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
