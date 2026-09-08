import { useState } from "react";

const cmToM = (cm) => (cm * 0.01).toFixed(2);

export default function TabClustering({ clustering, nidosPrevios = [], mejor }) {
  const [hoverCuadrante, setHoverCuadrante] = useState(null);

  // Unir nidos nuevos y previos activos para el mapeo térmico
  const todosNidos = [];
  if (mejor && mejor.genes) {
    mejor.genes.forEach((g) => {
      todosNidos.push({ x: g.x, y: g.y, id: g.id, tipo: "nuevo", eclosionado: false });
    });
  }
  nidosPrevios.forEach((n) => {
    todosNidos.push({ x: n.x, y: n.y, id: n.id, tipo: "previo", eclosionado: n.eclosionado });
  });

  // Si no hay nidos, mostrar estado vacío
  if (todosNidos.length === 0) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text3)" }}>
        <p>No hay nidos activos en el corral para realizar el análisis de densidad térmica.</p>
        <p style={{ fontSize: 11, marginTop: 6 }}>Ejecuta el AG y siembra nidos para habilitar el mapa térmico.</p>
      </div>
    );
  }

  // Dimensiones del corral (40m x 35m)
  const LARGO_M = 40;
  const ANCHO_M = 35;
  const TAM_CUADRANTE_M = 2; // Cuadrantes de 2m x 2m

  const cols = Math.ceil(LARGO_M / TAM_CUADRANTE_M); // 20 columnas
  const rows = Math.ceil(ANCHO_M / TAM_CUADRANTE_M); // 18 filas

  // Inicializar matriz de cuadrantes
  const grid = Array(rows).fill(null).map((_, r) => 
    Array(cols).fill(null).map((_, c) => ({
      row: r,
      col: c,
      xmin: c * TAM_CUADRANTE_M,
      xmax: (c + 1) * TAM_CUADRANTE_M,
      ymin: r * TAM_CUADRANTE_M,
      ymax: (r + 1) * TAM_CUADRANTE_M,
      nidos: [],
      activos: 0,
      eclosionados: 0
    }))
  );

  // Clasificar los nidos en su cuadrante correspondiente
  todosNidos.forEach((n) => {
    const xM = n.x * 0.01;
    const yM = n.y * 0.01;
    const c = Math.min(Math.floor(xM / TAM_CUADRANTE_M), cols - 1);
    const r = Math.min(Math.floor(yM / TAM_CUADRANTE_M), rows - 1);
    if (grid[r] && grid[r][c]) {
      grid[r][c].nidos.push(n);
      if (n.eclosionado) {
        grid[r][c].eclosionados++;
      } else {
        grid[r][c].activos++;
      }
    }
  });

  // Aplanar la rejilla para renderizarla fácilmente
  const cuadrantesAplanados = grid.flat();

  // Encontrar hotspots (cuadrantes de 2x2m con 5 o más nidos activos en incubación)
  // Biológicamente, 5 nidos en 4m² (2x2m) es una densidad muy alta para Golfina en corrales.
  const hotspotsGrid = cuadrantesAplanados.filter((quad) => quad.activos >= 5);

  // SVG Render Setup
  const VW = 860;
  const VH = Math.round((ANCHO_M / LARGO_M) * VW);
  const PAD = 55;

  const sx = (m) => PAD + (m / LARGO_M) * (VW - 2 * PAD);
  const sy = (m) => PAD + (m / ANCHO_M) * (VH - 2 * PAD);

  // Determinar color de relleno térmico según nidos activos
  const getHeatColor = (activos) => {
    if (activos === 0) return "none";
    if (activos <= 2) return "rgba(45, 206, 137, 0.25)";  // Verde - Seguro
    if (activos <= 4) return "rgba(255, 190, 11, 0.45)";  // Amarillo - Precaución
    return "rgba(245, 54, 92, 0.7)";                     // Rojo - Hotspot Crítico
  };

  const getEstatusText = (activos) => {
    if (activos === 0) return "Vacío";
    if (activos <= 2) return "Seguro (Baja densidad)";
    if (activos <= 4) return "Precaución (Densidad media)";
    return "🔥 Hotspot Crítico (Alta concentración)";
  };

  return (
    <div>
      {/* Explicación Biológica Sencilla */}
      <div className="card" style={{ background: "rgba(161, 85, 232, 0.04)", borderColor: "rgba(161, 85, 232, 0.2)", marginBottom: 16 }}>
        <h4 style={{ color: "var(--text)", margin: "0 0 6px 0", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <span>🐢</span> Mapa de Densidad Térmica (Rejilla de 2×2 metros)
        </h4>
        <p style={{ fontSize: 11.5, color: "var(--text2)", lineHeight: 1.6, margin: 0 }}>
          Para proteger los huevos, dividimos el corral en cuadrantes de **2×2 metros**. Cuando sembramos **5 o más nidos activos** 
          en el mismo cuadrante, la respiración de los embriones produce un exceso de calor que se acumula en la arena. 
          Si la temperatura supera los **29.7°C**, nacerán únicamente tortugas hembras (bloqueando la diversidad de género) 
          y se reduce la tasa de eclosión. Este mapa te permite identificar esos cuadrantes de riesgo al instante.
        </p>
      </div>

      {/* Alertas Biológicas Claras */}
      {hotspotsGrid.length > 0 ? (
        <div style={{
          background: "rgba(245, 54, 92, 0.08)", border: "1px solid rgba(245, 54, 92, 0.3)",
          color: "var(--laud)", borderRadius: 10, padding: "12px 20px", marginBottom: 16,
          fontSize: 12, lineHeight: 1.6
        }}>
          <h4 style={{ margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: 6 }}>
            <span>⚠️</span> Alerta de Cuadrante Sobresaturado (Riesgo Térmico)
          </h4>
          <p style={{ margin: 0 }}>
            Se han detectado **{hotspotsGrid.length} cuadrante(s)** con alta concentración de nidos activos:
          </p>
          <ul style={{ margin: "6px 0 0 20px", padding: 0 }}>
            {hotspotsGrid.map((h, idx) => (
              <li key={idx} style={{ marginBottom: 4 }}>
                <strong>Sector en X: {h.xmin}-{h.xmax}m, Y: {h.ymin}-{h.ymax}m</strong> con <strong>{h.activos} nidos activos</strong>. Evita sembrar nuevos nidos en esta zona durante los próximos días.
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div style={{
          background: "rgba(45, 206, 137, 0.08)", border: "1px solid rgba(45, 206, 137, 0.25)",
          color: "var(--golfina)", borderRadius: 10, padding: "10px 16px", marginBottom: 16,
          fontSize: 12, display: "flex", alignItems: "center", gap: 8
        }}>
          <span>✅</span>
          <span><strong>Distribución de Calor Segura:</strong> Todos los cuadrantes de 2x2m tienen densidades bajas o moderadas. El corral cuenta con una distribución térmica ideal.</span>
        </div>
      )}

      {/* Visualización del Mapa Térmico */}
      <div className="grid-2">
        {/* Renderizado de Rejilla Térmica */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
            <span className="card-title" style={{ margin: 0 }}>Mapa de Temperatura de la Arena</span>
            <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 12, fontFamily: "var(--font-mono)" }}>
              Pasa el cursor sobre un cuadrante para ver el detalle de nidos
            </span>
          </div>

          <div style={{ overflowX: "auto", background: "#111418" }}>
            <svg viewBox={`0 0 ${VW} ${VH + 20}`} width="100%" style={{ display: "block" }}>
              {/* Fondo del corral */}
              <rect x={PAD} y={PAD} width={VW - 2*PAD} height={VH - 2*PAD} fill="#181d24" stroke="var(--border)" strokeWidth={1} />

              {/* Dibujar Cuadrantes Térmicos */}
              {cuadrantesAplanados.map((q, idx) => {
                const fillCol = getHeatColor(q.activos);
                return (
                  <rect
                    key={idx}
                    x={sx(q.xmin)}
                    y={sy(q.ymin)}
                    width={sx(q.xmax) - sx(q.xmin)}
                    height={sy(q.ymax) - sy(q.ymin)}
                    fill={fillCol}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth={0.5}
                    style={{ cursor: "pointer", transition: "fill 0.2s" }}
                    onMouseEnter={() => setHoverCuadrante(q)}
                  />
                );
              })}

              {/* Pintar los nidos individuales como puntitos discretos sobre la cuadrícula */}
              {todosNidos.map((n, idx) => (
                <circle
                  key={idx}
                  cx={sx(n.x * 0.01)}
                  cy={sy(n.y * 0.01)}
                  r={2.5}
                  fill={n.eclosionado ? "#7f8c8d" : "var(--golfina)"}
                  opacity={n.eclosionado ? 0.3 : 0.8}
                />
              ))}

              {/* Borde exterior del corral */}
              <rect x={PAD} y={PAD} width={VW - 2*PAD} height={VH - 2*PAD} fill="none" stroke="var(--border)" strokeWidth={2} />

              {/* Ejes en metros */}
              <text x={VW/2} y={VH+12} textAnchor="middle" fill="#8c9ba5" fontSize={10} fontFamily="DM Mono">
                Largo del Corral (0 a 40 metros)
              </text>
              <text x={13} y={VH/2} textAnchor="middle" fill="#8c9ba5" fontSize={10} fontFamily="DM Mono" transform={`rotate(-90,13,${VH/2})`}>
                Ancho (0 a 35 metros)
              </text>
            </svg>
          </div>

          {/* Información del cuadrante enfocado */}
          <div style={{
            padding: "12px 20px", background: "var(--bg2)", borderTop: "1px solid var(--border)",
            minHeight: 52, display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: 12, fontFamily: "var(--font-mono)"
          }}>
            {hoverCuadrante ? (
              <>
                <span style={{ color: "var(--text2)" }}>
                  📍 Cuadrante: <strong>X: {hoverCuadrante.xmin}-{hoverCuadrante.xmax}m, Y: {hoverCuadrante.ymin}-{hoverCuadrante.ymax}m</strong>
                </span>
                <span>
                  Nidos Activos: <strong style={{ color: hoverCuadrante.activos >= 5 ? "var(--laud)" : "var(--golfina)" }}>{hoverCuadrante.activos}</strong>
                </span>
                <span>
                  Arena en Descanso: <strong>{hoverCuadrante.eclosionados}</strong>
                </span>
                <span className={`badge badge-${hoverCuadrante.activos >= 5 ? "laud" : hoverCuadrante.activos >= 3 ? "prieta" : "golfina"}`}>
                  {getEstatusText(hoverCuadrante.activos)}
                </span>
              </>
            ) : (
              <span style={{ color: "var(--text3)", fontStyle: "italic" }}>
                Pasa el cursor sobre la cuadrícula del corral para analizar sectores específicos.
              </span>
            )}
          </div>
        </div>

        {/* Leyenda y Tabla Resumida de Riesgo */}
        <div className="card">
          <div className="card-title">Leyenda de Rangos de Calor</div>
          <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, background: "rgba(45, 206, 137, 0.05)", borderRadius: 8, border: "1px solid rgba(45, 206, 137, 0.15)" }}>
              <div style={{ width: 24, height: 24, borderRadius: 4, background: "rgba(45, 206, 137, 0.25)", border: "1px solid var(--golfina)" }} />
              <div>
                <strong style={{ color: "var(--golfina)", fontSize: 12 }}>Rango Verde: Seguro (1 a 2 nidos activos)</strong>
                <p style={{ margin: "2px 0 0 0", fontSize: 10, color: "var(--text3)" }}>Baja acumulación de calor metabólico. Temperatura estable de la arena.</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, background: "rgba(255, 190, 11, 0.05)", borderRadius: 8, border: "1px solid rgba(255, 190, 11, 0.15)" }}>
              <div style={{ width: 24, height: 24, borderRadius: 4, background: "rgba(255, 190, 11, 0.45)", border: "1px solid var(--prieta)" }} />
              <div>
                <strong style={{ color: "var(--prieta)", fontSize: 12 }}>Rango Amarillo: Densidad Media (3 a 4 nidos activos)</strong>
                <p style={{ margin: "2px 0 0 0", fontSize: 10, color: "var(--text3)" }}>Zona con temperatura templada. Concentración moderada de nidos.</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, background: "rgba(245, 54, 92, 0.05)", borderRadius: 8, border: "1px solid rgba(245, 54, 92, 0.15)" }}>
              <div style={{ width: 24, height: 24, borderRadius: 4, background: "rgba(245, 54, 92, 0.7)", border: "1px solid var(--laud)" }} />
              <div>
                <strong style={{ color: "var(--laud)", fontSize: 12 }}>Rango Rojo: Hotspot Crítico (5 o más nidos activos)</strong>
                <p style={{ margin: "2px 0 0 0", fontSize: 10, color: "var(--text3)" }}>Peligro térmico. Alta densidad en 4m². Riesgo elevado de feminización o muerte embrionaria.</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, background: "var(--bg3)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: 24, height: 24, borderRadius: 4, background: "#181d24", border: "1px solid rgba(255,255,255,0.05)" }}>
                <circle cx={12} cy={12} r={2.5} fill="var(--golfina)" />
              </div>
              <div>
                <strong style={{ color: "var(--text2)", fontSize: 12 }}>Puntos en el mapa</strong>
                <p style={{ margin: "2px 0 0 0", fontSize: 10, color: "var(--text3)" }}>Cada punto representa la ubicación exacta y sembrada de un nido (Naranja = Activo, Gris = Eclosionado/Descanso).</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
