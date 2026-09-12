import { useEffect, useState, useCallback } from "react";

const API =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://refugium-testudines-back.onrender.com";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const num = (n) => (n == null ? "—" : Number(n).toLocaleString("es-MX"));

export default function TabRecomendacion() {
  const [nidos, setNidos] = useState(767);
  const [corral, setCorral] = useState("1");
  const [mes, setMes] = useState(9);

  const [rec, setRec] = useState(null);
  const [pred, setPred] = useState(null);
  const [err, setErr] = useState(null);
  const [cargando, setCargando] = useState(false);

  const consultar = useCallback(() => {
    if (!nidos || nidos <= 0) return;
    setCargando(true);
    setErr(null);
    Promise.all([
      fetch(`${API}/api/recomendacion?nidos=${nidos}&corral=${corral}`).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("recomendación: HTTP " + r.status))
      ),
      fetch(`${API}/api/prediccion?nidos=${nidos}&mes=${mes}`).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("predicción: HTTP " + r.status))
      ),
    ])
      .then(([a, b]) => {
        setRec(a);
        setPred(b);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setCargando(false));
  }, [nidos, corral, mes]);

  useEffect(() => {
    consultar();
    // sólo al montar: después se consulta con el botón
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sobre = rec && rec.estado === "sobre_capacidad";
  const comp = sobre ? rec.comparacion : null;
  const sin = pred?.escenarios?.sin_sombra;
  const con = pred?.escenarios?.con_sombra;

  return (
    <div>
      {/* ---------------------------------------------------------- controles */}
      <div
        style={{
          display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end",
          marginBottom: 18, padding: "14px 18px",
          background: "var(--card, rgba(255,255,255,0.03))",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
        }}
      >
        <label style={{ fontSize: 12, color: "var(--text2)" }}>
          Nidos a alojar
          <br />
          <input
            type="number" min="1" value={nidos}
            onChange={(e) => setNidos(parseInt(e.target.value || "0", 10))}
            style={{ width: 110, marginTop: 4 }}
          />
        </label>

        <label style={{ fontSize: 12, color: "var(--text2)" }}>
          Corral
          <br />
          <select value={corral} onChange={(e) => setCorral(e.target.value)}
                  style={{ marginTop: 4 }}>
            <option value="1">Corral 1 · 30 × 8 m</option>
            <option value="2">Corral 2 · 40 × 11 m</option>
          </select>
        </label>

        <label style={{ fontSize: 12, color: "var(--text2)" }}>
          Mes de siembra
          <br />
          <select value={mes} onChange={(e) => setMes(parseInt(e.target.value, 10))}
                  style={{ marginTop: 4 }}>
            {MESES.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </label>

        <button onClick={consultar} disabled={cargando}>
          {cargando ? "Calculando…" : "Consultar"}
        </button>
      </div>

      {err && <div className="error-banner">No se pudo consultar: {err}</div>}
      {!rec && !err && <div className="empty-state"><p>Calculando…</p></div>}

      {rec && (
        <>
          {/* ------------------------------------------------ veredicto */}
          <div
            style={{
              background: sobre ? "rgba(245,54,92,0.08)" : "rgba(45,206,137,0.08)",
              border: `1px solid ${sobre ? "rgba(245,54,92,0.3)" : "rgba(45,206,137,0.3)"}`,
              borderRadius: 10, padding: "12px 18px", marginBottom: 16,
              display: "flex", alignItems: "flex-start", gap: 12,
            }}
          >
            <span style={{ fontSize: 20 }}>{sobre ? "⚠️" : "✅"}</span>
            <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>
              {rec.mensaje}
            </div>
          </div>

          {/* ------------------------------------------------ cifras */}
          <div className="grid-4" style={{ marginBottom: 20 }}>
            <div className="stat-box">
              <div className="stat-label">Capacidad recomendada</div>
              <div className="stat-value">{num(rec.capacidad_recomendada)}</div>
              <div className="stat-sub">nidos a {rec.separacion_norma_cm} cm</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">
                {sobre ? "Separación forzada" : "Espacio por nido"}
              </div>
              <div className="stat-value">
                {sobre ? `${rec.separacion_real_cm} cm` : `${rec.separacion_norma_cm} cm`}
              </div>
              <div className="stat-sub">
                {sobre
                  ? `${rec.densidad_real_m2} nidos/m²`
                  : `la rejilla siembra a la norma; sobra espacio para ${rec.separacion_real_cm} cm`}
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Costo de eclosión</div>
              <div className="stat-value">{rec.costo_eclosion_pct} %</div>
              <div className="stat-sub">por nido, por hacinamiento</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">{sobre ? "Excedente" : "Espacios libres"}</div>
              <div className="stat-value">{num(sobre ? rec.excedente : rec.holgura)}</div>
              <div className="stat-sub">nidos</div>
            </div>
          </div>

          {/* ------------------------------------------------ comparación */}
          {comp && (
            <div style={{ marginBottom: 22 }}>
              <h3 style={{ fontSize: 14, marginBottom: 10 }}>
                ¿Conviene apretarlos o dejar fuera el excedente?
              </h3>
              <table className="tabla" style={{ width: "100%", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Decisión</th>
                    <th>Nidos alojados</th>
                    <th>Crías esperadas</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{
                    background: comp.conviene === "apretar" ? "rgba(45,206,137,0.10)" : "transparent",
                  }}>
                    <td>Alojar todos, apretados</td>
                    <td style={{ textAlign: "center" }}>
                      {num(comp.alojar_todos_apretados.nidos_alojados)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <strong>{num(comp.alojar_todos_apretados.crias_esperadas)}</strong>
                    </td>
                  </tr>
                  <tr style={{
                    background: comp.conviene === "no_apretar" ? "rgba(45,206,137,0.10)" : "transparent",
                  }}>
                    <td>
                      Alojar sólo lo recomendado
                      <div style={{ fontSize: 11, color: "var(--text2)" }}>
                        {num(comp.alojar_solo_lo_recomendado.nidos_fuera)} nidos quedan fuera del corral
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {num(comp.alojar_solo_lo_recomendado.nidos_alojados)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <strong>{num(comp.alojar_solo_lo_recomendado.crias_esperadas)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p style={{ fontSize: 11.5, color: "var(--text2)", marginTop: 8, lineHeight: 1.6 }}>
                Diferencia: <strong>{num(comp.diferencia_crias)}</strong> crías a favor de{" "}
                <strong>{comp.conviene === "apretar" ? "apretarlos" : "no apretarlos"}</strong>. El
                cálculo supone que los nidos que quedan fuera salvan el{" "}
                <strong>{(comp.alojar_solo_lo_recomendado.supervivencia_fuera * 100).toFixed(0)} %</strong>{" "}
                de sus crías. Es el supuesto que más pesa en este veredicto y está puesto en el peor
                caso: hace falta un dato de campo del Santuario para ajustarlo.
              </p>
            </div>
          )}

          {/* ------------------------------------------------ predicción */}
          {sin && con && (
            <div style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: 14, marginBottom: 10 }}>
                Crías y proporción sexual en {MESES[mes - 1].toLowerCase()}
              </h3>
              <table className="tabla" style={{ width: "100%", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Escenario</th>
                    <th>Crías totales</th>
                    <th>Hembras</th>
                    <th>Machos</th>
                    <th>Margen letal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Sin sombra</td>
                    <td style={{ textAlign: "center" }}>{num(sin.crias_totales)}</td>
                    <td style={{ textAlign: "center" }}>{sin.pct_hembras} %</td>
                    <td style={{ textAlign: "center" }}>{sin.pct_machos} %</td>
                    <td style={{ textAlign: "center",
                                 color: sin.en_riesgo ? "var(--laud)" : "inherit" }}>
                      {sin.margen_letal_c} °C
                    </td>
                  </tr>
                  <tr style={{ background: "rgba(45,206,137,0.08)" }}>
                    <td>Con malla sombra</td>
                    <td style={{ textAlign: "center" }}>{num(con.crias_totales)}</td>
                    <td style={{ textAlign: "center" }}><strong>{con.pct_hembras} %</strong></td>
                    <td style={{ textAlign: "center" }}><strong>{con.pct_machos} %</strong></td>
                    <td style={{ textAlign: "center" }}>{con.margen_letal_c} °C</td>
                  </tr>
                </tbody>
              </table>
              <p style={{ fontSize: 11.5, color: "var(--text2)", marginTop: 8, lineHeight: 1.6 }}>
                La sombra no cambia el número de crías: cambia el sexo con el que nacen. El
                hacinamiento y la sombra son palancas distintas para problemas distintos, porque el
                calor por densidad llega en el último tercio de la incubación, cuando el sexo ya
                quedó determinado.
              </p>
            </div>
          )}

          {/* ------------------------------------------------ advertencia */}
          <div
            style={{
              background: "rgba(251,99,64,0.07)", border: "1px solid rgba(251,99,64,0.25)",
              borderRadius: 10, padding: "12px 18px", marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
              <strong>Alcance de estas cifras.</strong> El costo de eclosión por hacinamiento sale de
              una medición experimental y es la salida más firme. La proporción sexual depende de la
              temperatura base de la arena, que hoy es el único insumo del modelo sin fuente
              verificada: la dirección del efecto de la sombra es sólida, la magnitud exacta no lo es
              todavía. Por debajo de 2 nidos/m² no se aplica castigo alguno, porque es la densidad
              más baja que el experimento ensayó.
            </div>
          </div>

          {/* ------------------------------------------------ fuentes */}
          {pred?.fuentes && (
            <details style={{ fontSize: 11.5, color: "var(--text2)" }}>
              <summary style={{ cursor: "pointer", marginBottom: 6 }}>
                Fuentes de los coeficientes
              </summary>
              <ul style={{ lineHeight: 1.7, paddingLeft: 18 }}>
                <li><strong>Densidad y eclosión:</strong> {pred.fuentes.densidad_eclosion}</li>
                <li><strong>Efecto de la sombra:</strong> {pred.fuentes.sombra}</li>
                <li><strong>Calor metabólico:</strong> {pred.fuentes.calor_metabolico}</li>
                <li><strong>Proporción sexual:</strong> {pred.fuentes.sexo}</li>
                <li><strong>Densidad máxima:</strong> {rec.fuente_densidad}</li>
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}
