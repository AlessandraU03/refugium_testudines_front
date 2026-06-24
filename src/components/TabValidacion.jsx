import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";

const COLORES_ESP = { golfina: "#00f2fe", prieta: "#4facfe", laud: "#e2b0ff" };

export default function TabValidacion({ validacion }) {
  // Formato para recharts: una fila por especie
  const data = validacion.map((v) => ({
    especie:   v.especie.charAt(0).toUpperCase() + v.especie.slice(1),
    Histórico: parseFloat(v.historico.toFixed(4)),
    EstimadoAG: parseFloat(v.estimado.toFixed(4)),
    Máximo:    parseFloat(v.maximo.toFixed(4)),
    _esp:      v.especie,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: 12 }}>
        <p style={{ marginBottom: 6, color: "var(--text)", fontWeight: 600 }}>{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color, margin: "2px 0" }}>
            {p.name}: {p.value.toFixed(4)} ({(p.value * 100).toFixed(1)}%)
          </p>
        ))}
        {payload.length === 2 && (
          <p style={{ color: "var(--warn)", marginTop: 6, borderTop: "1px solid var(--border)", paddingTop: 4 }}>
            Mejora: +{((payload[1].value - payload[0].value) * 100).toFixed(1)} pp
          </p>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Descripción */}
      <div className="card" style={{ background: "rgba(32, 227, 178, 0.03)", borderColor: "rgba(32, 227, 178, 0.18)", marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>
          Comparación entre la <strong style={{ color: "var(--text)" }}>tasa de eclosión histórica empírica</strong> del
          Santuario de Puerto Arista (sin optimización) y la <strong style={{ color: "var(--accent)" }}>tasa estimada por el AG</strong> con
          la distribución óptima calculada. El máximo representa el techo documentado por especie.
        </p>
      </div>

      {/* Gráfica */}
      <div className="card">
        <div className="card-title">
          Validación: Tasa de Eclosión Estimada AG vs Histórica Empírica
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }} barGap={8} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="especie" />
              <YAxis domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: 12 }} />
              <ReferenceLine y={1} stroke="rgba(255,255,255,0.1)" />

              <Bar dataKey="Histórico" name="Histórico (empírico)" radius={[4, 4, 0, 0]}>
                {data.map((d) => (
                  <Cell key={d._esp} fill={COLORES_ESP[d._esp]} opacity={0.4} />
                ))}
              </Bar>
              <Bar dataKey="EstimadoAG" name="Estimado AG (óptimo)" radius={[4, 4, 0, 0]}>
                {data.map((d) => (
                  <Cell key={d._esp} fill={COLORES_ESP[d._esp]} opacity={1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de valores exactos */}
      <div className="card">
        <div className="card-title">Valores Exactos por Especie</div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Especie</th>
                <th>Tasa Histórica</th>
                <th>Tasa Estimada AG</th>
                <th>Máximo Documentado</th>
                <th>Mejora (pp)</th>
              </tr>
            </thead>
            <tbody>
              {validacion.map((v) => {
                const mejora = ((v.estimado - v.historico) * 100).toFixed(2);
                const positivo = v.estimado >= v.historico;
                return (
                  <tr key={v.especie}>
                    <td><span className={`badge badge-${v.especie}`}>{v.especie}</span></td>
                    <td>{(v.historico * 100).toFixed(1)}%</td>
                    <td style={{ color: "var(--accent)", fontWeight: 600 }}>{(v.estimado * 100).toFixed(1)}%</td>
                    <td style={{ color: "var(--text2)" }}>{(v.maximo * 100).toFixed(1)}%</td>
                    <td style={{ color: positivo ? "var(--accent)" : "var(--laud)" }}>
                      {positivo ? "+" : ""}{mejora} pp
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
