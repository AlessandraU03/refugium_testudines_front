const COLORES_ESP = {
  golfina: { color: "var(--golfina)", bg: "var(--golfina-bg)" },
  prieta:  { color: "var(--prieta)",  bg: "var(--prieta-bg)"  },
  laud:    { color: "var(--laud)",    bg: "var(--laud-bg)"    },
};

function diasHasta(fechaStr) {
  const hoy  = new Date();
  const meta = new Date(fechaStr);
  const diff = Math.round((meta - hoy) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function TabFechas({ fechas }) {
  return (
    <div>
      {/* Descripción */}
      <div className="card" style={{ background: "rgba(79, 172, 254, 0.03)", borderColor: "rgba(79, 172, 254, 0.18)", marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>
          Fechas estimadas de eclosión calculadas a partir de la fecha de siembra y los
          <strong style={{ color: "var(--text)" }}> días promedio de incubación documentados</strong> por
          especie en la base de conocimiento. Permite al personal planificar el monitoreo del corral con anticipación.
        </p>
      </div>

      {/* Tabla principal */}
      <div className="card">
        <div className="card-title">Tabla de Fechas de Eclosión por Especie</div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Especie</th>
                <th>Fecha Siembra</th>
                <th>Días Incubación</th>
                <th>Fecha Estimada Eclosión</th>
                <th>Días Restantes</th>
              </tr>
            </thead>
            <tbody>
              {fechas.map((f) => {
                const restantes = diasHasta(f.fecha_eclosion);
                const c = COLORES_ESP[f.especie];
                return (
                  <tr key={f.especie}>
                    <td>
                      <span className={`badge badge-${f.especie}`}>
                        {f.especie.charAt(0).toUpperCase() + f.especie.slice(1)}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{f.fecha_siembra}</td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "var(--text2)" }}>
                      {f.dias_incubacion} días
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", color: c.color, fontWeight: 600 }}>
                      {f.fecha_eclosion}
                    </td>
                    <td>
                      <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                        color: restantes > 0 ? c.color : "var(--warn)",
                        fontWeight: 600,
                      }}>
                        {restantes > 0 ? `${restantes} días` : restantes === 0 ? "Hoy" : "Eclosión pasada"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tarjetas visuales por especie */}
      <div className="grid-2" style={{ marginTop: 16 }}>
        {fechas.map((f) => {
          const c = COLORES_ESP[f.especie];
          const restantes = diasHasta(f.fecha_eclosion);
          const pctTranscurrido = Math.min(
            ((f.dias_incubacion - Math.max(restantes, 0)) / f.dias_incubacion) * 100,
            100
          );
          return (
            <div key={f.especie} className="card" style={{ borderColor: c.color + "44" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span className={`badge badge-${f.especie}`} style={{ fontSize: 13 }}>
                  {f.especie.charAt(0).toUpperCase() + f.especie.slice(1)}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text2)" }}>
                  {f.dias_incubacion} días incubación
                </span>
              </div>

              {/* Barra de progreso de incubación */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>
                  Progreso de incubación
                </div>
                <div style={{ height: 8, background: "var(--bg3)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    width: `${pctTranscurrido}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${c.color}88, ${c.color})`,
                    borderRadius: 4,
                    transition: "width 0.5s"
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "var(--text3)", fontFamily: "var(--font-mono)" }}>
                  <span>{f.fecha_siembra}</span>
                  <span>{pctTranscurrido.toFixed(0)}%</span>
                  <span>{f.fecha_eclosion}</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center" }}>
                <div className="stat-box" style={{ borderColor: c.color + "44", minWidth: 120 }}>
                  <div className="stat-val" style={{ color: c.color, fontSize: 28 }}>
                    {restantes > 0 ? restantes : 0}
                  </div>
                  <div className="stat-lbl">días para eclosión</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
