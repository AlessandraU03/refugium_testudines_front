const COLORES_ESP = {
  golfina: { color: "var(--golfina)", bg: "var(--golfina-bg)" },
};

function diasHasta(fechaStr) {
  const hoy  = new Date();
  const meta = new Date(fechaStr);
  const diff = Math.round((meta - hoy) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function TabFechas({ fechas }) {
  const f = fechas && fechas.length > 0 ? fechas[0] : null;
  const propSex = f?.proporcion_sexual || { pct_machos: 1.1, pct_hembras: 98.9, temp_estimada_pts: 32.8, sesgo: "Feminizado" };

  return (
    <div>
      {/* Explicación Biológica y Científica */}
      <div className="card" style={{ background: "rgba(79, 172, 254, 0.03)", borderColor: "rgba(79, 172, 254, 0.18)", marginBottom: 16 }}>
        <h4 style={{ color: "var(--text)", margin: "0 0 6px 0", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <span>⏳</span> Calendario de Desarrollo Embrionario y Periodo Termosensible (PTS)
        </h4>
        <p style={{ fontSize: 11.5, color: "var(--text2)", lineHeight: 1.6, margin: 0 }}>
          De acuerdo con los estudios de <strong>Sandoval et al. (2020)</strong> y <strong>de la Torre-Robles et al. (2017)</strong>, 
          el sexo de las tortugas golfinas se define exclusivamente durante el <strong>segundo tercio del periodo de incubación</strong> (Periodo Termosensible o PTS). 
          Durante estos días clave, las temperaturas mayores a <strong>29.95°C</strong> inducen la diferenciación de hembras, mientras que temperaturas menores a <strong>28°C</strong> producen machos.
        </p>
      </div>

      {/* Tarjeta de Proporción Sexual (Girondot 1999 / Sandoval 2020) */}
      {f && (
        <div className="card" style={{ marginBottom: 16, border: "1px solid rgba(161, 85, 232, 0.3)", background: "rgba(161, 85, 232, 0.03)" }}>
          <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>🧬 Estimación de Proporción Sexual (Modelo de Girondot)</span>
            <span className="badge badge-sec" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
              Pivote: 29.95°C · S = -0.63
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 12 }}>
            {/* Medidor visual de proporción */}
            <div style={{ background: "var(--bg2)", padding: 16, borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8, fontFamily: "var(--font-mono)" }}>
                PROPORCIÓN ESPERADA EN ESTA JORNADA
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
                <span style={{ color: "var(--prieta)" }}>♂ Machos: {propSex.pct_machos}%</span>
                <span style={{ color: "var(--laud)" }}>♀ Hembras: {propSex.pct_hembras}%</span>
              </div>
              <div style={{ height: 12, background: "var(--bg3)", borderRadius: 6, overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${propSex.pct_machos}%`, height: "100%", background: "var(--prieta)", transition: "width 0.4s" }} />
                <div style={{ width: `${propSex.pct_hembras}%`, height: "100%", background: "var(--laud)", transition: "width 0.4s" }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: "var(--text2)", fontStyle: "italic" }}>
                Diagnóstico: <strong>{propSex.sesgo}</strong>
              </div>
            </div>

            {/* Ventana Crítica PTS */}
            <div style={{ background: "var(--bg2)", padding: 16, borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8, fontFamily: "var(--font-mono)" }}>
                VENTANA CRÍTICA DE DIFERENCIACIÓN SEXUAL (PTS)
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--warn)", fontFamily: "var(--font-mono)" }}>
                {f.pts_inicio} → {f.pts_fin}
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "var(--text2)" }}>
                {f.pts_dias}
              </p>
              <div style={{ marginTop: 8, fontSize: 11, color: "var(--text3)" }}>
                Temperatura media estimada en arena: <strong style={{ color: "var(--text)" }}>{propSex.temp_estimada_pts}°C</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla principal */}
      <div className="card">
        <div className="card-title">Cronograma de Desarrollo de la Jornada</div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Especie</th>
                <th>Fecha Siembra</th>
                <th>Ventana PTS (Diferenciación)</th>
                <th>Incubación Total</th>
                <th>Fecha Estimada Eclosión</th>
                <th>Días Restantes</th>
              </tr>
            </thead>
            <tbody>
              {fechas.map((item) => {
                const restantes = diasHasta(item.fecha_eclosion);
                const c = COLORES_ESP[item.especie] || { color: "var(--golfina)" };
                return (
                  <tr key={item.especie}>
                    <td>
                      <span className={`badge badge-${item.especie}`}>
                        {item.especie.charAt(0).toUpperCase() + item.especie.slice(1)}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{item.fecha_siembra}</td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "var(--warn)", fontWeight: 600 }}>
                      {item.pts_inicio} al {item.pts_fin}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "var(--text2)" }}>
                      {item.dias_incubacion} días
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", color: c.color, fontWeight: 600 }}>
                      {item.fecha_eclosion}
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

      {/* Barra de progreso de incubación */}
      {f && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">Línea de Tiempo de Incubación</div>
          {fechas.map((item) => {
            const c = COLORES_ESP[item.especie] || { color: "var(--golfina)" };
            const restantes = diasHasta(item.fecha_eclosion);
            const pctTranscurrido = Math.min(
              ((item.dias_incubacion - Math.max(restantes, 0)) / item.dias_incubacion) * 100,
              100
            );
            return (
              <div key={item.especie} style={{ marginTop: 10 }}>
                <div style={{ height: 10, background: "var(--bg3)", borderRadius: 5, overflow: "hidden" }}>
                  <div style={{
                    width: `${pctTranscurrido}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${c.color}88, ${c.color})`,
                    borderRadius: 5,
                    transition: "width 0.5s"
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--text3)", fontFamily: "var(--font-mono)" }}>
                  <span>🌱 Siembra: {item.fecha_siembra}</span>
                  <span style={{ color: "var(--warn)" }}>⚠️ Ventana PTS: {item.pts_inicio} al {item.pts_fin}</span>
                  <span style={{ color: c.color }}>🐣 Eclosión: {item.fecha_eclosion}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
