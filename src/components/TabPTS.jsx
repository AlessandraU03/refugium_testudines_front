import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Cell,
} from "recharts";

// Proporción sexual de la jornada, nido por nido.
//
// Esta pestaña sustituye a una que generaba una curva de temperatura sintética
// y estimaba el sexo con una sola temperatura pivote. Daba 71.9 % de hembras
// mientras el resto del sistema daba 96-98 %: dos cifras distintas en la misma
// aplicación. Ahora muestra el resultado del modelo real.

const COLOR_ESP = {
  golfina: "var(--golfina)",
  prieta:  "var(--prieta)",
  laud:    "var(--laud)",
};
const NOMBRE = { golfina: "Golfina", prieta: "Prieta", laud: "Laúd" };

const LIMITE_LETAL = 36.0;

function Vacio({ icono, titulo, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icono}</div>
      <p>{titulo}</p>
      <p className="empty-sub">{sub}</p>
    </div>
  );
}

export default function TabPTS({ mejor, fechas = [], validacion = [], rendimiento, sitio }) {
  const genes = mejor?.genes || [];
  if (!genes.length) {
    return <Vacio icono="🔥" titulo="Optimización inactiva"
      sub="Ejecuta el AG para ver la proporción sexual que resultaría de esta colocación." />;
  }

  const conSombra = genes.some((g) => g.sombra_solar != null);

  // Pivote documentada de cada especie, tal como la usó el modelo.
  const pivotePorEsp = {};
  validacion.forEach((v) => { if (v.pivote_c != null) pivotePorEsp[v.especie] = v.pivote_c; });

  // --- Resumen por especie -------------------------------------------------
  const porEsp = {};
  genes.forEach((g) => {
    const s = g.proporcion_sexual;
    if (!s) return;
    (porEsp[g.especie] = porEsp[g.especie] || []).push({
      hembras: s.pct_hembras,
      temp: s.temp_estimada_pts,
      sombra: g.sombra_solar,
    });
  });

  const filas = Object.entries(porEsp).map(([esp, v]) => {
    const h = v.map((t) => t.hembras);
    const t = v.map((t) => t.temp);
    const media = (a) => a.reduce((x, y) => x + y, 0) / a.length;
    return {
      especie: esp,
      nidos: v.length,
      pivote: pivotePorEsp[esp],
      hMin: Math.min(...h), hMax: Math.max(...h), hMedia: media(h),
      tMin: Math.min(...t), tMax: Math.max(...t), tMedia: media(t),
    };
  });

  // --- Dispersión sombra vs proporción de hembras --------------------------
  const series = Object.entries(porEsp).map(([esp, v]) => ({
    especie: esp,
    datos: v.filter((t) => t.sombra != null)
            .map((t) => ({ x: +(t.sombra * 100).toFixed(1), y: t.hembras, temp: t.temp })),
  })).filter((s) => s.datos.length);

  // --- Histograma de la jornada -------------------------------------------
  const CORTES = [[0, 50], [50, 70], [70, 85], [85, 95], [95, 100.01]];
  const ETIQ = ["<50 %", "50–70 %", "70–85 %", "85–95 %", ">95 %"];
  const histograma = CORTES.map(([a, b], i) => ({
    rango: ETIQ[i],
    nidos: genes.filter((g) => {
      const h = g.proporcion_sexual?.pct_hembras;
      return h != null && h >= a && h < b;
    }).length,
  }));

  // El límite letal NO se compara contra la temperatura del PTS sino contra la
  // del ÚLTIMO TERCIO, que es más alta porque ahí pesa el calor metabólico de
  // los embriones. Se toma el conteo que ya calcula el modelo; deducirlo de las
  // temperaturas del PTS daba siempre cero y contradecía a Rendimiento del AG.
  const enRiesgoTotal = rendimiento?.ag?.nidos_en_riesgo;
  const nidosEvaluados = rendimiento?.nidos_evaluados;
  const pctJornada = rendimiento?.ag?.pct_hembras;
  const tempMedia = rendimiento?.ag?.temp_pts_media_c;

  return (
    <div>
      {/* Cómo se calcula */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">De dónde sale el sexo de cada cría</div>
        <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.8, margin: 0 }}>
          El sexo no viene dado: lo decide la temperatura de la arena durante el
          período termosensible, el segundo tercio de la incubación. Y esa
          temperatura depende de <strong>dónde quedó el nido</strong>. Por eso
          esta pestaña es el resultado del algoritmo, no un dato aparte:
        </p>
        <p style={{
          fontSize: 12, color: "var(--text)", lineHeight: 1.8, margin: "10px 0 0",
          fontFamily: "var(--font-mono)", background: "var(--bg3)",
          padding: "10px 14px", borderRadius: 6,
        }}>
          posición → sombra de la malla → temperatura del PTS → ecuación de Girondot → sexo
        </p>
        <p style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.7, margin: "10px 0 0" }}>
          La sombra de cada nido se calcula siguiendo la trayectoria del sol de
          ese día según la latitud del sitio, la orientación del corral y la
          altura de la malla. El enfriamiento que produce sale de las
          mediciones de Hill et al. (2015): 2.2 °C a 45 cm de profundidad y
          1.3 °C a 75 cm. La proporción sexual usa la ecuación de Girondot con
          la temperatura pivote propia de cada especie. El límite letal de
          {" "}{LIMITE_LETAL} °C corresponde a la tolerancia térmica del embrión.
        </p>
      </div>

      {/* Indicadores de la jornada */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-box">
          <div className="stat-val" style={{ color: "var(--laud)" }}>
            {pctJornada != null ? `${pctJornada} %` : "—"}
          </div>
          <div className="stat-lbl">Hembras en la jornada</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{tempMedia != null ? `${tempMedia} °C` : "—"}</div>
          <div className="stat-lbl">Temp. media del PTS</div>
        </div>
        <div className="stat-box">
          <div className="stat-val" style={{ color: enRiesgoTotal ? "var(--laud)" : "var(--accent)" }}>
            {enRiesgoTotal != null ? enRiesgoTotal : "—"}
          </div>
          <div className="stat-lbl">
            Riesgo letal en el último tercio
            {nidosEvaluados ? ` (de ${nidosEvaluados}, con los previos)` : ""}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{genes.length}</div>
          <div className="stat-lbl">Nidos de la jornada</div>
        </div>
      </div>

      {/* Por especie */}
      <div className="tbl-wrap" style={{ marginBottom: 20 }}>
        <table>
          <thead>
            <tr>
              <th>Especie</th><th>Nidos</th><th>Pivote</th>
              <th>Temp. PTS (mín – media – máx)</th>
              <th>Hembras (mín – media – máx)</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.especie}>
                <td><span className={`badge badge-${f.especie}`}>{NOMBRE[f.especie] || f.especie}</span></td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{f.nidos}</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>
                  {f.pivote != null ? `${f.pivote} °C` : "—"}
                </td>
                <td style={{ fontFamily: "var(--font-mono)" }}>
                  {f.tMin.toFixed(2)} – {f.tMedia.toFixed(2)} – {f.tMax.toFixed(2)}
                </td>
                <td style={{ fontFamily: "var(--font-mono)" }}>
                  {f.hMin.toFixed(1)} – {f.hMedia.toFixed(1)} – {f.hMax.toFixed(1)} %
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sombra contra sexo: la evidencia de que la colocación decide */}
      {conSombra && series.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">La sombra que recibe cada nido decide su sexo</div>
          <p style={{ fontSize: 11, color: "var(--text3)", margin: "0 0 10px", lineHeight: 1.7 }}>
            Cada punto es un nido de esta jornada. El eje horizontal es la
            fracción de la insolación del día que la malla le intercepta; el
            vertical, la proporción de hembras que resultaría. Si los puntos
            forman una pendiente, la colocación está decidiendo el sexo.
          </p>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" dataKey="x" name="Sombra" unit=" %"
                  domain={[0, 100]} tick={{ fontSize: 11 }}
                  label={{ value: "Sombra del día (%)", position: "insideBottom", offset: -18, fontSize: 11 }} />
                <YAxis type="number" dataKey="y" name="Hembras" unit=" %"
                  domain={["auto", "auto"]} tick={{ fontSize: 11 }}
                  label={{ value: "Hembras (%)", angle: -90, position: "insideLeft", fontSize: 11 }} />
                <ZAxis range={[60, 60]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(v, n) => [`${v} %`, n]}
                  contentStyle={{ background: "var(--bg)", border: "1px solid var(--border)", fontSize: 11 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {series.map((s) => (
                  <Scatter key={s.especie} name={NOMBRE[s.especie] || s.especie}
                    data={s.datos} fill={COLOR_ESP[s.especie] || "var(--accent)"} />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Distribución de la jornada */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Cuántos nidos caen en cada proporción</div>
        <div className="chart-wrap-sm">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={histograma} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="rango" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                formatter={(v) => [`${v} nidos`, "Cantidad"]}
                contentStyle={{ background: "var(--bg)", border: "1px solid var(--border)", fontSize: 11 }}
              />
              <Bar dataKey="nidos" radius={[4, 4, 0, 0]}>
                {histograma.map((h, i) => (
                  <Cell key={i} fill={i >= 3 ? "var(--laud)" : "var(--accent)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p style={{ fontSize: 11, color: "var(--text3)", margin: "8px 0 0", lineHeight: 1.7 }}>
          Las poblaciones de tortuga marina son naturalmente sesgadas hacia
          hembras, así que un sesgo moderado no es un problema. Lo que preocupa
          en la literatura es la <strong>pérdida de machos</strong>: cuando casi
          todos los nidos caen por encima del 95 %, la jornada no está
          produciendo machos.
        </p>
      </div>

      {/* Ventanas del PTS por especie */}
      {fechas.length > 0 && (
        <div className="tbl-wrap" style={{ marginBottom: 16 }}>
          <table>
            <thead>
              <tr><th>Especie</th><th>Ventana del PTS</th><th>Días de incubación</th></tr>
            </thead>
            <tbody>
              {fechas.map((f) => (
                <tr key={f.especie}>
                  <td><span className={`badge badge-${f.especie}`}>{NOMBRE[f.especie] || f.especie}</span></td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{f.pts_inicio} → {f.pts_fin}</td>
                  <td style={{ fontSize: 11, color: "var(--text2)" }}>{f.pts_dias}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.7 }}>
        {sitio?.supuestos?.length > 0 && (
          <>
            <strong style={{ color: "var(--warn)" }}>Atención:</strong> la
            cobertura, la altura y la opacidad de la malla son supuestos, no
            mediciones. De ellos depende cuánta sombra recibe cada nido y, por
            tanto, estas proporciones. Confirmarlos en campo es lo que
            convertiría estas cifras en un resultado.{" "}
          </>
        )}
        La temperatura base de la arena también es una estimación: el modelo da
        unos 32 °C para el PTS en septiembre, mientras que de la Torre-Robles
        et al. (2017) midieron 30.1 °C en un corral comparable de Oaxaca. De
        esos dos grados depende que el corral produzca 96 % o 56 % de hembras.
      </p>
    </div>
  );
}
