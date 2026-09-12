import { useEffect, useState } from "react";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea,
} from "recharts";

const API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000"
  : "https://refugium-testudines-back.onrender.com";

const MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function TabCapacidad() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  // "registro" = los nidos que el Santuario ya sembro con el sistema.
  // "historico" = la temporada 2022 publicada, que sirve de referencia.
  const [fuente, setFuente] = useState("registro");

  useEffect(() => {
    fetch(`${API}/api/capacidad`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then(setD)
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="error-banner">No se pudo calcular la capacidad: {err}</div>;
  if (!d) return <div className="empty-state"><p>Calculando capacidad…</p></div>;

  const hayRegistro = !!d.registro;
  const usarRegistro = hayRegistro && fuente === "registro";
  const act = usarRegistro ? d.registro : d;

  const data = act.serie.map((p) => {
    const [, m, dd] = p.fecha.split("-");
    return {
      fecha: p.fecha,
      etiqueta: `${dd} ${MES[parseInt(m, 10) - 1]}`,
      ocupados: p.ocupados,
      capacidad: d.capacidad_total,
      deficit: p.deficit,
    };
  });

  const idx = (f) => data.findIndex((p) => p.fecha === f);
  const iIni = act.ventana_inicio ? idx(act.ventana_inicio) : -1;
  const iFin = act.ventana_fin ? idx(act.ventana_fin) : -1;
  const pct = (act.cobertura_del_pico * 100).toFixed(0);

  const btn = (activo) => ({
    padding: "6px 14px", fontSize: 12, cursor: "pointer",
    borderRadius: 8, border: "1px solid var(--border)",
    background: activo ? "rgba(32,227,178,0.14)" : "transparent",
    color: activo ? "var(--accent)" : "var(--text2)",
    fontWeight: activo ? 700 : 400,
  });

  return (
    <div>
      {hayRegistro ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 11, color: "var(--text3)", marginRight: 4 }}>
            Fuente de la curva:
          </span>
          <button style={btn(usarRegistro)} onClick={() => setFuente("registro")}>
            Temporada en curso · {d.registro.nidos_sembrados} nidos sembrados
          </button>
          <button style={btn(!usarRegistro)} onClick={() => setFuente("historico")}>
            Referencia {d.anio_datos} · {d.nidos_temporada} nidos
          </button>
        </div>
      ) : (
        <div style={{
          background: "rgba(251,99,64,0.07)", border: "1px solid rgba(251,99,64,0.25)",
          borderRadius: 10, padding: "10px 16px", marginBottom: 14,
          fontSize: 12, color: "var(--text2)", lineHeight: 1.6,
        }}>
          Todavia no hay jornadas guardadas, asi que la curva es la de la temporada{" "}
          {d.anio_datos} publicada en la literatura. Conforme se guarden jornadas con
          <strong> Ejecutar AG</strong> y <strong>Guardar jornada</strong>, esta pestana
          mostrara la ocupacion real del corral con las fechas exactas de cada siembra.
        </div>
      )}

      <div style={{
        background: "rgba(245,54,92,0.08)", border: "1px solid rgba(245,54,92,0.3)",
        borderRadius: 10, padding: "12px 18px", marginBottom: 16,
        display: "flex", alignItems: "flex-start", gap: 12,
      }}>
        <span style={{ fontSize: 20 }}>📐</span>
        <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
          {usarRegistro
            ? <>Con los nidos sembrados hasta ahora, la superficie instalada cubre el{" "}
                <strong style={{ color: "var(--laud)" }}>{pct} %</strong> de la ocupación máxima
                alcanzada. Durante <strong>{act.dias_con_deficit} días</strong> la densidad
                necesaria supera el límite de {d.densidad_max_nidos_m2} nido/m².</>
            : <>La superficie instalada cubre el <strong style={{ color: "var(--laud)" }}>{pct} %</strong> de
                la ocupación máxima de la temporada. Durante <strong>{act.dias_con_deficit} días</strong> del
                año la densidad necesaria supera el límite de {d.densidad_max_nidos_m2} nido/m², lo que
                implica sembrar a <strong>{act.separacion_en_pico_m} m</strong> de separación en lugar de 1.00 m.</>}
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-box">
          <div className="stat-val" style={{ color: "var(--accent)" }}>{d.capacidad_total}</div>
          <div className="stat-lbl">Capacidad segura (nidos)</div>
        </div>
        <div className="stat-box">
          <div className="stat-val" style={{ color: "var(--laud)" }}>{act.pico_ocupacion}</div>
          <div className="stat-lbl">Pico de ocupación</div>
        </div>
        <div className="stat-box">
          <div className="stat-val" style={{ color: "var(--warn)" }}>{act.deficit_maximo}</div>
          <div className="stat-lbl">Déficit máximo (nidos)</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{act.area_faltante_m2}</div>
          <div className="stat-lbl">Superficie faltante (m²)</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          {usarRegistro
            ? "Ocupación simultánea del corral · temporada en curso"
            : `Ocupación simultánea del corral · temporada ${d.anio_datos}`}
          <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 10, fontFamily: "var(--font-mono)" }}>
            {usarRegistro ? act.nidos_sembrados : d.nidos_temporada} nidos · incubación {d.dias_incubacion} d + {d.dias_hasta_excavacion} d hasta excavar
          </span>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={330}>
            <ComposedChart data={data} margin={{ top: 10, right: 20, left: 8, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="etiqueta" interval={30} tick={{ fontSize: 10 }} />
              <YAxis width={56} label={{ value: "Nidos", angle: -90, position: "insideLeft", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 12 }}
                formatter={(v, n) => [v + " nidos", n === "ocupados" ? "Ocupación" : n === "capacidad" ? "Capacidad segura" : "Déficit"]}
              />
              <Legend wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: 12, paddingTop: 8 }} />

              {iIni >= 0 && iFin >= 0 && (
                <ReferenceArea x1={data[iIni].etiqueta} x2={data[iFin].etiqueta}
                  fill="rgba(245,54,92,0.10)" stroke="rgba(245,54,92,0.35)" strokeDasharray="4 4" />
              )}
              <ReferenceLine y={d.capacidad_total} stroke="var(--accent)" strokeDasharray="5 4"
                label={{ value: `capacidad segura ${d.capacidad_total}`, fill: "#00f2fe", fontSize: 10, position: "insideTopRight" }} />

              <Area type="monotone" dataKey="deficit" name="Déficit" stroke="none" fill="rgba(245,54,92,0.30)" isAnimationActive={false} />
              <Line type="monotone" dataKey="ocupados" name="Ocupación" stroke="var(--laud)" strokeWidth={2} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p style={{ fontSize: 10, color: "var(--text3)", marginTop: 8, fontStyle: "italic", paddingLeft: 8 }}>
          {act.ventana_inicio
            ? <>La franja sombreada marca la ventana crítica, del {act.ventana_inicio} al {act.ventana_fin}. </>
            : <>Ningún día supera la capacidad segura. </>}
          {usarRegistro
            ? <>Curva construida con las {act.jornadas} jornadas guardadas, del {act.primera_siembra} al {act.ultima_siembra},
                con la fecha exacta de cada siembra.</>
            : <>Fuente de los conteos de anidación: {d.fuente_datos}. Los nidos de cada mes se reparten
                por igual entre sus días, porque la fuente sólo publica totales mensuales.</>}
        </p>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title">Superficie instalada</div>
        <table style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ color: "var(--text3)", textAlign: "left" }}>
              <th style={{ padding: "6px 8px" }}>Corral</th>
              <th style={{ padding: "6px 8px" }}>Medidas</th>
              <th style={{ padding: "6px 8px" }}>Área</th>
              <th style={{ padding: "6px 8px" }}>Capacidad</th>
              <th style={{ padding: "6px 8px" }}>Fuente</th>
            </tr>
          </thead>
          <tbody>
            {d.corrales.map((c) => (
              <tr key={c.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "6px 8px" }}>{c.nombre}</td>
                <td style={{ padding: "6px 8px" }}>{c.largo_m} × {c.ancho_m} m</td>
                <td style={{ padding: "6px 8px" }}>{c.area_m2} m²</td>
                <td style={{ padding: "6px 8px", color: "var(--accent)" }}>{c.capacidad} nidos</td>
                <td style={{ padding: "6px 8px", color: "var(--text3)", fontSize: 10 }}>{c.fuente}</td>
              </tr>
            ))}
            <tr style={{ borderTop: "2px solid var(--border)", fontWeight: 700 }}>
              <td style={{ padding: "6px 8px" }}>Total</td>
              <td style={{ padding: "6px 8px" }}>—</td>
              <td style={{ padding: "6px 8px" }}>{d.area_total_m2} m²</td>
              <td style={{ padding: "6px 8px", color: "var(--accent)" }}>{d.capacidad_total} nidos</td>
              <td />
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: 10, color: "var(--text3)", marginTop: 10, fontStyle: "italic" }}>
          La capacidad se deriva de la superficie por la densidad máxima de {d.densidad_max_nidos_m2} nido/m²
          (Best Practices in Sea Turtle Hatchery Management, IOTN 2018; NOM-162-SEMARNAT-2012).
          Las medidas se editan en <code>backend/csv/corrales.csv</code>.
        </p>
      </div>
    </div>
  );
}
