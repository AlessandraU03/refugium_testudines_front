import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

export default function TabEvolucion({ historial, nPrevios = 0, totalCorral = 0 }) {
  const data = historial.mejor.map((v, i) => ({
    gen:      i,
    mejor:    parseFloat(v.toFixed(5)),
    promedio: parseFloat(historial.promedio[i].toFixed(5)),
  }));

  const mejorFinal      = Math.max(...historial.mejor);
  const promFinal       = historial.promedio[historial.promedio.length - 1];
  const generaciones    = historial.mejor.length;
  const genConvergencia = historial.mejor.lastIndexOf(mejorFinal);

  // Dominio real con padding para que la curva no sea plana
  const todasVals = [...historial.mejor, ...historial.promedio];
  const minFit = Math.min(...todasVals);
  const maxFit = Math.max(...todasVals);
  const pad    = Math.max((maxFit - minFit) * 0.15, 0.01);
  const dominio = [
    parseFloat((minFit - pad).toFixed(4)),
    parseFloat((maxFit + pad * 0.3).toFixed(4)),
  ];

  const mejora = mejorFinal - historial.mejor[0];

  return (
    <div>
      {nPrevios > 0 && (
        <div style={{
          background:"rgba(255,190,11,0.08)", border:"1px solid rgba(255,190,11,0.25)",
          borderRadius:10, padding:"10px 16px", marginBottom:16,
          display:"flex", alignItems:"center", gap:12,
        }}>
          <span style={{ fontSize:18 }}>📌</span>
          <div style={{ fontSize:12, color:"var(--text2)", lineHeight:1.6 }}>
            <strong style={{ color:"var(--warn)" }}>
              Optimización con {nPrevios} nidos previos activos.
            </strong>{" "}
            V1 y V3 se calculan sobre el corral completo ({totalCorral} nidos totales).
            El AG optimizó colocando los nidos nuevos sin violar la separación mínima
            con los nidos ya sembrados de jornadas anteriores.
          </div>
        </div>
      )}

      <div className="grid-4" style={{ marginBottom:20 }}>
        <div className="stat-box">
          <div className="stat-val" style={{ color:"var(--accent)" }}>{mejorFinal.toFixed(4)}</div>
          <div className="stat-lbl">Mejor Fitness</div>
        </div>
        <div className="stat-box">
          <div className="stat-val" style={{ color:"var(--prieta)" }}>{promFinal.toFixed(4)}</div>
          <div className="stat-lbl">Promedio Final</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{generaciones}</div>
          <div className="stat-lbl">Generaciones</div>
        </div>
        <div className="stat-box">
          <div className="stat-val" style={{ color: mejora > 0.001 ? "var(--accent)" : "var(--warn)" }}>
            {mejora > 0 ? "+" : ""}{mejora.toFixed(4)}
          </div>
          <div className="stat-lbl">Mejora Total</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Evolución de la Aptitud por Generación</div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top:5, right:20, left:8, bottom:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="gen"
                label={{ value:"Generación", position:"insideBottom", offset:-10, fill:"#8b949e", fontSize:11 }}
              />
              <YAxis
                domain={dominio}
                tickFormatter={(v) => v.toFixed(3)}
                width={58}
              />
              <Tooltip
                contentStyle={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:8, fontFamily:"var(--font-mono)", fontSize:12 }}
                labelFormatter={(v) => `Gen ${v}`}
                formatter={(v, name) => [v.toFixed(5), name]}
              />
              <Legend wrapperStyle={{ fontFamily:"var(--font-mono)", fontSize:12, paddingTop:8 }} />
              {genConvergencia < generaciones - 1 && (
                <ReferenceLine
                  x={genConvergencia}
                  stroke="rgba(255,190,11,0.4)" strokeDasharray="4 4"
                  label={{ value:"convergencia", fill:"#ffbe0b", fontSize:10, position:"top" }}
                />
              )}
              <Line type="monotone" dataKey="mejor"   stroke="var(--accent)"
                strokeWidth={2.5} dot={false} name="Mejor individuo" />
              <Line type="monotone" dataKey="promedio" stroke="var(--prieta)"
                strokeWidth={1.5} dot={false} strokeDasharray="5 3" name="Promedio población" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p style={{ fontSize:10, color:"var(--text3)", marginTop:8, fontStyle:"italic", paddingLeft:8 }}>
          La curva del <span style={{ color:"var(--prieta)" }}>promedio de la población</span> muestra
          la mejora colectiva del AG. Cuando el mejor converge rápido, el promedio sigue subiendo
          mientras el resto de la población alcanza la solución óptima.
        </p>
      </div>
    </div>
  );
}
