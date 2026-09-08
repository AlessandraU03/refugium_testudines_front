import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, ComposedChart, Area, AreaChart
} from "recharts";

export default function TabPTS({ mejor = null, fechas = [] }) {
  // Datos de temperatura simulados para demostración
  // En producción, vendrían de sensores reales
  const generarDatosTemperatura = () => {
    const datos = [];
    const tempBase = 30.5;
    const variacion = 2.5;

    for (let dia = 17; dia <= 33; dia++) {
      // Simulación: temperatura fluctúa durante el día
      const tempMin = tempBase - variacion + Math.sin(dia / 4) * 0.8;
      const tempMaxBase = tempBase + variacion + Math.cos(dia / 5) * 1.2;
      const tempProm = (tempMin + tempMaxBase) / 2;

      // Algunos días más calurosos (riesgo)
      const conRiesgo = dia >= 25 && dia <= 27;
      const tempMax = conRiesgo ? tempMaxBase + 2.5 : tempMaxBase;
      const tempAjustada = conRiesgo ? tempProm + 2.5 : tempProm;

      datos.push({
        dia: dia,
        label: `Día ${dia}`,
        tempMin: parseFloat(tempMin.toFixed(1)),
        tempMax: parseFloat(tempMax.toFixed(1)),
        tempProm: parseFloat(tempAjustada.toFixed(1)),
        sexRatio: calcularSexRatio(tempAjustada),
        // El umbral letal aplica al pico diario, no al promedio:
        // "cualquier hora >35°C → 78.9% emergencia vs 89.1%" (MTN 159)
        alerta: tempMax > 35,
      });
    }
    return datos;
  };

  const calcularSexRatio = (temp) => {
    // Girondot: P(hembra) = 1 / (1 + exp((pivote - T) / s))
    // pivote 29.95°C y s 0.6301 salen de pts_termosensible.csv (Sandoval et al. 2020)
    const pivote = 29.95;
    const s = 0.6301;
    const hembras = 100 / (1 + Math.exp((pivote - temp) / s));
    const machos = 100 - hembras;

    let estado;
    if (hembras >= 95) estado = "Feminización total";
    else if (hembras > 55) estado = "Mayoritariamente Hembras";
    else if (hembras >= 45) estado = "Bisexual (~50-50)";
    else if (hembras > 5) estado = "Mayoritariamente Machos";
    else estado = "Masculinización total";

    return { machos, hembras, estado };
  };

  const datosTemp = generarDatosTemperatura();
  const ptsInicio = 17;
  const ptsFin = 33;
  const tempPromedio = (datosTemp.reduce((sum, d) => sum + d.tempProm, 0) / datosTemp.length).toFixed(2);
  const diasConAlerta = datosTemp.filter(d => d.alerta).length;
  const hembrasPromedio = (datosTemp.reduce((sum, d) => sum + d.sexRatio.hembras, 0) / datosTemp.length).toFixed(1);

  return (
    <div>
      {/* Aviso principal: esta pestaña no muestra mediciones */}
      <div style={{
        background: "rgba(255,190,11,0.10)",
        border: "2px solid rgba(255,190,11,0.45)",
        borderRadius: 10,
        padding: "14px 18px",
        marginBottom: 16,
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
      }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>🧪</span>
        <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.65 }}>
          <strong style={{ color: "var(--warn)", fontSize: 13, display: "block", marginBottom: 4 }}>
            ESCENARIO PROYECTADO — no son mediciones reales
          </strong>
          El Santuario no cuenta todavía con sensores en el corral. La curva de
          temperatura de esta pestaña es <strong>sintética</strong>, generada para
          ilustrar cómo operaría el módulo una vez instalada la instrumentación.
          <strong> Ningún valor de temperatura proviene de una medición.</strong>
          <br />
          Lo que sí está documentado es el <em>modelo</em>: la temperatura pivote
          (29.95 °C) y el parámetro s (−0.6301) de la ecuación de Girondot, y el
          umbral letal de 35 °C. Con datos reales, los cálculos de esta pestaña
          son directamente aplicables.
        </div>
      </div>

      {/* Lectura del escenario simulado */}
      <div style={{
        background: diasConAlerta > 0 ? "rgba(231,76,60,0.08)" : "rgba(46,204,113,0.08)",
        border: `1px solid ${diasConAlerta > 0 ? "rgba(231,76,60,0.25)" : "rgba(46,204,113,0.25)"}`,
        borderRadius: 10,
        padding: "10px 16px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <span style={{ fontSize: 18 }}>
          {diasConAlerta > 0 ? "🔥" : "✅"}
        </span>
        <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
          <strong style={{ color: diasConAlerta > 0 ? "var(--warn)" : "var(--success)" }}>
            Período Termosensible (PTS): días {ptsInicio}–{ptsFin} de incubación
          </strong>
          {diasConAlerta > 0 ? (
            <span>
              {" "}En este escenario simulado, {diasConAlerta} días superan los 35 °C
              en su pico. Con sensores instalados, eso dispararía una alerta de
              riesgo de anomalías embrionarias.
            </span>
          ) : (
            <span> En este escenario simulado la temperatura se mantiene en el rango de 29–32 °C.</span>
          )}
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-box">
          <div className="stat-val" style={{ color: "var(--accent)" }}>
            {tempPromedio}°C
          </div>
          <div className="stat-lbl">Temp. promedio (simulada)</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{hembrasPromedio}%</div>
          <div className="stat-lbl">Hembras (proyectadas)</div>
        </div>
        <div className="stat-box">
          <div className="stat-val" style={{ color: diasConAlerta > 0 ? "var(--warn)" : "var(--success)" }}>
            {diasConAlerta}
          </div>
          <div className="stat-lbl">Días &gt;35°C (simulados)</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">29-32°C</div>
          <div className="stat-lbl">Rango óptimo (documentado)</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          Curva simulada de temperatura durante el PTS
          <span style={{ fontSize: 11, color: "var(--warn)", marginLeft: 10, fontFamily: "var(--font-mono)" }}>
            datos sintéticos · pendiente de instrumentación
          </span>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={datosTemp} margin={{ top: 5, right: 20, left: 8, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                label={{ value: "Día de Incubación", position: "insideBottom", offset: -10, fill: "#8b949e", fontSize: 11 }}
              />
              <YAxis
                domain={[26, 38]}
                label={{ value: "Temperatura (°C)", angle: -90, position: "insideLeft" }}
                width={60}
              />
              <Tooltip
                contentStyle={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 12 }}
                formatter={(v, name) => {
                  if (name === "tempMin") return [v.toFixed(1) + "°C", "Mín."];
                  if (name === "tempMax") return [v.toFixed(1) + "°C", "Máx."];
                  if (name === "tempProm") return [v.toFixed(1) + "°C", "Promedio"];
                  return [v, name];
                }}
              />
              <Legend wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: 12, paddingTop: 8 }} />

              {/* Área de temperatura óptima */}
              <ReferenceLine y={29} stroke="rgba(46,204,113,0.3)" strokeDasharray="4 4" label={{ value: "Mín óptima (29°C)", fill: "#2ecc71", fontSize: 10 }} />
              <ReferenceLine y={32} stroke="rgba(46,204,113,0.3)" strokeDasharray="4 4" label={{ value: "Máx óptima (32°C)", fill: "#2ecc71", fontSize: 10 }} />
              <ReferenceLine y={35} stroke="rgba(231,76,60,0.5)" strokeDasharray="4 4" label={{ value: "Crítica (35°C)", fill: "#e74c3c", fontSize: 10, position: "top" }} />

              {/* Líneas de temperatura */}
              <Line type="monotone" dataKey="tempMin" stroke="rgba(52,152,219,0.4)" strokeWidth={1} dot={false} name="Temperatura Mínima" isAnimationActive={false} />
              <Line type="monotone" dataKey="tempMax" stroke="rgba(230,126,34,0.6)" strokeWidth={1} dot={false} name="Temperatura Máxima" isAnimationActive={false} />
              <Line
                type="monotone"
                dataKey="tempProm"
                stroke="var(--accent)"
                strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.alerta) {
                    return (
                      <circle cx={cx} cy={cy} r={5} fill="var(--warn)" />
                    );
                  }
                  return <circle cx={cx} cy={cy} r={3} fill="var(--accent)" />;
                }}
                name="Temperatura Promedio"
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p style={{ fontSize: 10, color: "var(--text3)", marginTop: 8, fontStyle: "italic", paddingLeft: 8 }}>
          El <span style={{ color: "var(--accent)" }}>promedio de temperatura</span> determina la proporción sexual.
          Los puntos rojos marcan días cuyo <strong>pico</strong> superó los 35°C; 3+ días consecutivos así pueden
          causar anomalías embrionarias. Rango óptimo: 29-32°C.
        </p>
      </div>

      {/* Sex Ratio por Día */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title">
          Proporción sexual que resultaría de esas temperaturas
          <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 10, fontFamily: "var(--font-mono)" }}>
            modelo de Girondot · pivote 29.95°C, s −0.6301
          </span>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}>
          {datosTemp.slice(0, 8).map((d, i) => (
            <div key={i} style={{
              background: "var(--bg2)",
              border: d.alerta ? "2px solid var(--warn)" : "1px solid var(--border)",
              borderRadius: 8,
              padding: 12,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: d.alerta ? "var(--warn)" : "var(--text1)" }}>
                {d.label} {d.alerta && "⚠️"}
              </div>
              <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 4 }}>
                Temp: <strong>{d.tempProm}°C</strong>
              </div>
              <div style={{
                display: "flex",
                gap: 4,
                marginBottom: 8,
                borderRadius: 4,
                overflow: "hidden",
                height: 20,
              }}>
                <div style={{
                  flex: d.sexRatio.machos,
                  background: "rgba(52,152,219,0.7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  color: "white",
                  fontWeight: 600,
                }}>
                  {d.sexRatio.machos > 10 && d.sexRatio.machos.toFixed(0) + "%"}
                </div>
                <div style={{
                  flex: d.sexRatio.hembras,
                  background: "rgba(231,76,60,0.7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  color: "white",
                  fontWeight: 600,
                }}>
                  {d.sexRatio.hembras > 10 && d.sexRatio.hembras.toFixed(0) + "%"}
                </div>
              </div>
              <div style={{ fontSize: 10, color: "var(--text3)", textAlign: "center" }}>
                {d.sexRatio.estado}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Qué haría falta instrumentar */}
      <div className="card" style={{ marginTop: 20, background: "rgba(255,190,11,0.05)", border: "1px solid rgba(255,190,11,0.25)" }}>
        <div className="card-title">Qué haría falta para que esta pestaña use datos reales</div>
        <ul style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.8, paddingLeft: 20 }}>
          <li><strong>Sensores de temperatura en arena</strong>, colocados a la profundidad
            de siembra (45 cm en golfina), no en superficie: es la temperatura de la
            cámara de huevos la que determina el sexo.</li>
          <li><strong>Registro del pico diario</strong>, no sólo del promedio. El umbral
            de 35 °C aplica a la temperatura máxima alcanzada, así que un promedio
            diario puede ocultar un pico letal.</li>
          <li><strong>Frecuencia de al menos 4 lecturas por día</strong> durante los
            días 17–33 de incubación, que es cuando se define el sexo.</li>
          <li><strong>Humedad de arena</strong>, si se quiere extender el modelo: influye
            en la viabilidad del nido, pero el modelo actual sólo usa temperatura.</li>
          <li><strong>Referencia de contraste:</strong> Puerto Arista reporta 78.6 % de
            hembras entre 2013 y 2017. Un sesgo medido muy distinto indicaría que
            los sensores o el modelo necesitan calibración.</li>
        </ul>
      </div>

      {/* Protocolo previsto */}
      <div className="card" style={{ marginTop: 16, background: "rgba(46,204,113,0.05)", border: "1px solid rgba(46,204,113,0.2)" }}>
        <div className="card-title">Protocolo previsto una vez instalados los sensores</div>
        <ul style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.8, paddingLeft: 20 }}>
          <li><strong>Riego o sombreado</strong> si la temperatura supera 32 °C.</li>
          <li><strong>Aireación de emergencia</strong> si supera 35 °C.</li>
          <li><strong>Aviso al responsable</strong> si se mantiene por encima de 35 °C
            durante 3 días consecutivos: ese es el patrón asociado a caídas de
            emergencia de entre 10 % y 50 % en la literatura.</li>
        </ul>
        <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 10, fontStyle: "italic", paddingLeft: 20 }}>
          Estos umbrales provienen de la literatura consultada; las acciones concretas
          las define el personal del Santuario.
        </p>
      </div>
    </div>
  );
}
