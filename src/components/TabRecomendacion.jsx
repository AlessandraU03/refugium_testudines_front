import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";

// Qué conviene hacer con el corral, dado que el presupuesto es limitado.
//
// No decide por el Santuario: presenta el intercambio. La dosis que más rinde
// por litro y la que más acerca al equilibrio sexual no son la misma, y esa
// elección es de quien administra el corral.

const API_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://refugium-testudines-back.onrender.com";

const MESES = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
  "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function TabRecomendacion({ corral }) {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const largo = corral ? Number(corral.largo_cm) / 100 : 30;
  const ancho = corral ? Number(corral.ancho_cm) / 100 : 8;

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    setError(null);
    fetch(`${API_URL}/api/recomendacion?mes=${mes}&largo_m=${largo}&ancho_m=${ancho}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("no se pudo consultar"))))
      .then((j) => { if (vivo) { setDatos(j); setCargando(false); } })
      .catch((e) => { if (vivo) { setError(e.message); setCargando(false); } });
    return () => { vivo = false; };
  }, [mes, largo, ancho]);

  if (error) return <div className="error-banner">⚠ {error}</div>;
  if (cargando || !datos) {
    return (
      <div className="empty-state">
        <div className="empty-icon">💧</div>
        <p>Calculando recomendación…</p>
      </div>
    );
  }

  const { cuanto, donde, como, arena } = datos;
  const ef = cuanto.mas_eficiente;
  const eq = cuanto.mas_equilibrada;

  const curva = cuanto.escenarios.map((e) => ({
    dosis: e.dosis_mm,
    hembras: e.pct_hembras,
    agua: e.agua_m3,
  }));

  return (
    <div>
      {/* Selector de mes */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Recomendación de manejo</div>
        <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7, margin: "0 0 12px" }}>
          El corral ya cuenta con malla sombra y riego. La pregunta no es si usarlos,
          sino <strong>cuánto, dónde y cómo</strong>, porque el agua cuesta. Abajo está
          el intercambio entre lo que se gasta y lo que se gana, para el mes que elijas.
        </p>
        <div className="field" style={{ maxWidth: 260, margin: 0 }}>
          <label>Mes de siembra</label>
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {MESES.slice(1).map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* CUÁNTO */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Cuánto regar</div>
        <div className="grid-2" style={{ marginBottom: 14 }}>
          <div className="stat-box" style={{ textAlign: "left", padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6 }}>
              MÁS RENDIMIENTO POR LITRO
            </div>
            <div className="stat-val" style={{ color: "var(--accent)" }}>
              {ef?.dosis_mm} mm
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 6, lineHeight: 1.6 }}>
              {ef?.agua_m3} m³ de agua · {ef?.pct_hembras} % hembras · margen letal{" "}
              {ef?.margen_letal_c > 0 ? "+" : ""}{ef?.margen_letal_c} °C
            </div>
          </div>
          <div className="stat-box" style={{ textAlign: "left", padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6 }}>
              MÁS CERCA DEL EQUILIBRIO SEXUAL
            </div>
            <div className="stat-val" style={{ color: "var(--laud)" }}>
              {eq?.dosis_mm} mm
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 6, lineHeight: 1.6 }}>
              {eq?.agua_m3} m³ de agua · {eq?.pct_hembras} % hembras · margen letal{" "}
              {eq?.margen_letal_c > 0 ? "+" : ""}{eq?.margen_letal_c} °C
            </div>
          </div>
        </div>

        <div className="chart-wrap-sm">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={curva} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="dosis" tick={{ fontSize: 11 }} unit=" mm"
                label={{ value: "Dosis de riego (mm)", position: "insideBottom", offset: -12, fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit=" %" domain={["auto", "auto"]} />
              <Tooltip
                formatter={(v, n) => [n === "hembras" ? `${v} %` : `${v} m³`, n]}
                contentStyle={{ background: "var(--bg)", border: "1px solid var(--border)", fontSize: 11 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="hembras" name="hembras"
                stroke="var(--laud)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="tbl-wrap" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Dosis</th><th>Agua</th><th>Hembras</th>
                <th>Margen letal</th><th>Enfriamiento</th><th>°C por m³</th>
              </tr>
            </thead>
            <tbody>
              {cuanto.escenarios.map((e) => (
                <tr key={e.dosis_mm}
                  style={e.dosis_mm === ef?.dosis_mm
                    ? { background: "rgba(0,255,178,0.06)" } : undefined}>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{e.dosis_mm} mm</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{e.agua_m3} m³</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{e.pct_hembras} %</td>
                  <td style={{
                    fontFamily: "var(--font-mono)",
                    color: e.en_riesgo ? "var(--laud)" : "var(--text2)",
                  }}>
                    {e.margen_letal_c > 0 ? "+" : ""}{e.margen_letal_c} °C
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{e.ganancia_c} °C</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>
                    {e.grados_por_m3 ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.7, marginTop: 10 }}>
          {cuanto.nota}
        </p>
      </div>

      {/* DÓNDE */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Dónde regar</div>
        <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7, margin: "0 0 12px" }}>
          El toldo cubre por arriba, pero los lados están abiertos: el sol bajo de la
          mañana y de la tarde entra de costado y calienta el perímetro. Medido para este
          mes, el centro recibe <strong>{(donde.sombra_centro * 100).toFixed(0)} %</strong> de
          sombra y el perímetro sólo <strong>{(donde.sombra_perimetro * 100).toFixed(0)} %</strong>.
          Regar únicamente la franja de {donde.franja_m} m del borde ataca donde duele y
          cuesta menos agua.
        </p>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr><th>Escenario</th><th>Área regada</th><th>Agua</th><th>Hembras</th><th>Margen letal</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Perímetro sin regar</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>—</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>0 m³</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{donde.perimetro_sin_regar.pct_hembras} %</td>
                <td style={{ fontFamily: "var(--font-mono)", color: "var(--laud)" }}>
                  +{donde.perimetro_sin_regar.margen_letal_c} °C
                </td>
              </tr>
              <tr style={{ background: "rgba(0,255,178,0.06)" }}>
                <td><strong>Sólo el perímetro</strong></td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{donde.solo_perimetro.area_regada_m2} m²</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{donde.solo_perimetro.agua_m3} m³</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{donde.solo_perimetro.pct_hembras} %</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>+{donde.solo_perimetro.margen_letal_c} °C</td>
              </tr>
              <tr>
                <td>Todo el corral</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{donde.todo_el_corral.area_regada_m2} m²</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{donde.todo_el_corral.agua_m3} m³</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{donde.todo_el_corral.pct_hembras} %</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>+{donde.todo_el_corral.margen_letal_c} °C</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CÓMO */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Cómo regar</div>
        <ul style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.9, paddingLeft: 18, margin: 0 }}>
          <li>Frecuencia: <strong>{como.frecuencia}</strong></li>
          <li>Duración: <strong>{como.dias} días</strong>, {como.reparto}</li>
          <li>Cuándo: {como.ventana}</li>
        </ul>
        <p style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.7, marginTop: 10 }}>
          {como.fuente}
        </p>
        <p style={{ fontSize: 11, color: "var(--warn)", lineHeight: 1.7, marginTop: 6 }}>
          {como.advertencia}
        </p>
      </div>

      {/* ARENA */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Cambio de arena</div>
        <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7, margin: "0 0 10px" }}>
          Recomendación: <strong>{arena.recomendacion}</strong>. Para este corral son{" "}
          <strong>{arena.volumen_m3} m³</strong> de arena, calculados sobre la
          profundidad de siembra más honda ({arena.profundidad_cm} cm, laúd).
        </p>
        <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7, margin: "0 0 10px" }}>
          {arena.motivo}
        </p>
        <p style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.7, margin: 0 }}>
          {arena.fuente}
        </p>
        <p style={{ fontSize: 11, color: "var(--warn)", lineHeight: 1.7, marginTop: 6 }}>
          {arena.advertencia}
        </p>
      </div>

      {datos.supuestos?.length > 0 && (
        <details>
          <summary style={{ fontSize: 12, cursor: "pointer", color: "var(--warn)" }}>
            {datos.supuestos.length} parámetros del sitio son supuestos, no mediciones
          </summary>
          <ul style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.6, paddingLeft: 18 }}>
            {datos.supuestos.map((s) => (
              <li key={s.campo}><code>{s.campo} = {s.valor}</code>: {s.fuente}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
