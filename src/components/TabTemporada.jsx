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
    return 0.35 + (idx / Math.max(fechasOrdenadas.length - 1, 1)) * 0.6;
  };

  // Recopilar zonas únicas por jornada para el diagrama acumulado.
  // Cada jornada puede tener zonas distintas (proporcionales a su conteo de nidos).
  // Se leen de zonas_jornada que se guardó al momento de sembrar.
  const zonasAcumuladas = []; // [{especie, xmin, xmax, ymin, ymax, fecha}]
  const zonasVistas = new Set();
  fechasOrdenadas.forEach((fecha) => {
    const jNidos = jornadasMap[fecha];
    // Tomar las zonas del primer nido de cada especie (todas comparten las mismas)
    const zonasPorEsp = {};
    jNidos.forEach((n) => {
      const zj = n.zonas_jornada || {};
      const key = `zona_${n.especie}`;
      if (zj[key] && !zonasPorEsp[n.especie]) {
        zonasPorEsp[n.especie] = zj[key];
      }
    });
    Object.entries(zonasPorEsp).forEach(([esp, lim]) => {
      const uniq = `${fecha}-${esp}-${lim.xmin}-${lim.xmax}`;
      if (!zonasVistas.has(uniq)) {
        zonasVistas.add(uniq);
        zonasAcumuladas.push({ especie: esp, fecha, ...lim });
      }
    });
  });

  const pctOcupado = nidos.length > 0 ? Math.min((nidos.length / CAP) * 100, 100) : 0;

  return (
    <div>
      {/* Stats acumulados */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-box">
          <div className="stat-val">{resumen.jornadas || 0}</div>
          <div className="stat-lbl">Jornadas</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{nidos.length}</div>
          <div className="stat-lbl">Nidos Activos</div>
        </div>
        <div className="stat-box">
          <div className="stat-val"
            style={{ color: pctOcupado > 80 ? "var(--laud)" : "var(--accent)" }}>
            {pctOcupado.toFixed(1)}%
          </div>
          <div className="stat-lbl">Capacidad Ocupada</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{CAP - nidos.length}</div>
          <div className="stat-lbl">Espacios Libres</div>
        </div>
      </div>

      {/* Barra de capacidad */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Ocupación del Corral ({nidos.length} / {CAP} nidos)</div>
        <div style={{ height: 14, background: "var(--bg3)", borderRadius: 7, overflow: "hidden", marginBottom: 8 }}>
          <div style={{
            width: `${pctOcupado}%`, height: "100%",
            background: pctOcupado > 80
              ? "linear-gradient(90deg,var(--warn),var(--laud))"
              : "linear-gradient(90deg,var(--prieta),var(--accent))",
            borderRadius: 7, transition: "width 0.5s",
          }} />
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontSize: 10, color: "var(--text3)", fontFamily: "var(--font-mono)",
        }}>
          <span>0</span>
          <span>Cap. máx. simultánea: {CAP}</span>
          <span>{CAP}</span>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          {["golfina","prieta","laud"].map((esp) => {
            const cnt = nidos.filter((n) => n.especie === esp).length;
            if (!cnt) return null;
            return (
              <div key={esp} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLS[esp].fill }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  <span className={`badge badge-${esp}`}>{esp}</span>
                  <span style={{ color: "var(--text2)", marginLeft: 6 }}>{cnt} nidos</span>
                </span>
              </div>
            );
          })}
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
                <rect x={PAD} y={PAD} width={VW-2*PAD} height={VH-2*PAD}
                  fill="#1a1f26" stroke="var(--border)" strokeWidth={2} rx={4} />

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

                {/* Todos los nidos — coloreados por especie, brillo por antigüedad */}
                {nidos.map((n, idx) => {
                  const c   = COLS[n.especie];
                  const op  = opacidadJornada(n.fecha_siembra);
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
                        style={{ transition: "r 0.1s" }}
                      />
                    </g>
                  );
                })}

                <text x={VW/2} y={VH+12} textAnchor="middle"
                  fill="#484f58" fontSize={10} fontFamily="DM Mono">
                  Largo (cm)  0 → {LARGO}
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
                <span><span style={{ color: "var(--text2)" }}>Especie: </span>
                  <span className={`badge badge-${hover.especie}`}>{hover.especie}</span></span>
                <span><span style={{ color: "var(--text2)" }}>X: </span>{hover.x?.toFixed(1)} cm</span>
                <span><span style={{ color: "var(--text2)" }}>Y: </span>{hover.y?.toFixed(1)} cm</span>
                <span><span style={{ color: "var(--text2)" }}>Prof.: </span>{hover.prof?.toFixed(1)} cm</span>
                <span><span style={{ color: "var(--text2)" }}>Eclosión: </span>{hover.fecha_eclosion}</span>
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
                  {fechasOrdenadas.map((fecha) => {
                    const jNidos = jornadasMap[fecha];
                    const cG = jNidos.filter((n) => n.especie === "golfina").length;
                    const cP = jNidos.filter((n) => n.especie === "prieta").length;
                    const cL = jNidos.filter((n) => n.especie === "laud").length;
                    const ultEcl = jNidos.reduce(
                      (max, n) => n.fecha_eclosion > max ? n.fecha_eclosion : max, "");
                    return (
                      <tr key={fecha}>
                        <td style={{ fontFamily: "var(--font-mono)", color: "var(--warn)" }}>{fecha}</td>
                        <td style={{ color: "var(--golfina)" }}>{cG}</td>
                        <td style={{ color: "var(--prieta)" }}>{cP}</td>
                        <td style={{ color: "var(--laud)" }}>{cL}</td>
                        <td style={{ fontWeight: 600 }}>{jNidos.length}</td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{ultEcl}</td>
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
