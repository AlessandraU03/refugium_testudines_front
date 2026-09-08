import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const VARS = [
  {
    key: "v1_mejor", promKey: "v1_promedio",
    label: "V1 — Tasa de Eclosión del Corral Completo",
    color: "#2dce89", objetivo: "MAXIMIZAR",
    desc: "Tasa media estimada sobre TODOS los nidos del corral (nuevos + previos activos). " +
          "Cada nido aporta en función de la profundidad y de la separación óptima. " +
          "El AG maximiza esta tasa colocando los nuevos nidos en la profundidad de 45 cm y respetando la separación.",
    alcanceCorralCompleto: true,
  },
  {
    key: "v2_mejor", promKey: "v2_promedio",
    label: "V2 — Violaciones de Separación Mínima (100 cm)",
    color: "#ffbe0b", objetivo: "MINIMIZAR",
    desc: "Proporción de pares de nidos de Golfina (nuevo-nuevo y nuevo-previo) que violan la separación mínima de 100 cm. " +
          "V2 = pares_violadores / total_pares ∈ [0, 1].",
    alcanceCorralCompleto: true,
  },
  {
    key: "v3_mejor", promKey: "v3_promedio",
    label: "V3 — Desviación de Profundidad",
    color: "#4b9cf5", objetivo: "MINIMIZAR",
    desc: "Desviación normalizada de la profundidad de los nidos NUEVOS respecto a la profundidad óptima de 45 cm. " +
          "V3 = media(|prof_i − 45|) / (70 − 30) ∈ [0, 1].",
    alcanceCorralCompleto: false,
  },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg2)", border: "1px solid var(--border)",
      borderRadius: 8, padding: "8px 12px",
      fontFamily: "var(--font-mono)", fontSize: 11,
    }}>
      <p style={{ marginBottom: 4, color: "var(--text2)" }}>Gen {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color, margin: "2px 0" }}>
          {p.name}: {p.value.toFixed(5)}
        </p>
      ))}
    </div>
  );
};

function VarCard({ v, historial, nPrevios }) {
  const datos  = historial[v.key]    || [];
  const proms  = v.promKey ? (historial[v.promKey] || []) : null;
  const inicial = datos[0]           ?? 0;
  const final_  = datos[datos.length - 1] ?? 0;
  const mejora  = v.objetivo === "MAXIMIZAR" ? final_ - inicial : inicial - final_;
  const positivo = mejora >= 0;

  const chartData = datos.map((val, i) => ({
    gen:    i,
    mejor:  parseFloat(val.toFixed(5)),
    ...(proms ? { promedio: parseFloat((proms[i] ?? 0).toFixed(5)) } : {}),
  }));

  const allVals = [...datos, ...(proms || [])].filter((x) => x != null);
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const pad  = (maxV - minV) * 0.1 || 0.001;
  const dominio = [
    parseFloat((minV - pad).toFixed(5)),
    parseFloat((maxV + pad).toFixed(5)),
  ];

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, marginRight: 12 }}>
          <div className="card-title" style={{ margin: 0 }}>{v.label}</div>
          <div style={{ marginTop: 4, marginBottom: 6, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 8px", borderRadius: 20,
              background: v.objetivo === "MAXIMIZAR" ? "rgba(45,206,137,0.12)" : "rgba(245,54,92,0.12)",
              color:      v.objetivo === "MAXIMIZAR" ? "var(--golfina)"        : "var(--laud)",
              border: `1px solid ${v.objetivo === "MAXIMIZAR" ? "rgba(45,206,137,0.3)" : "rgba(245,54,92,0.3)"}`,
            }}>
              {v.objetivo}
            </span>
            {v.alcanceCorralCompleto && nPrevios > 0 && (
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 8px", borderRadius: 20,
                background: "rgba(255,190,11,0.12)", color: "var(--warn)",
                border: "1px solid rgba(255,190,11,0.3)",
              }}>
                ✦ incluye {nPrevios} nidos previos/descanso
              </span>
            )}
          </div>
          <p style={{ fontSize: 10, color: "var(--text3)", lineHeight: 1.5 }}>{v.desc}</p>
        </div>
        <div style={{ textAlign: "right", minWidth: 70 }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 22,
            color: v.color, fontWeight: 500,
          }}>
            {final_.toFixed(3)}
          </div>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 10,
            color: positivo ? "var(--accent)" : "var(--laud)", marginTop: 2,
          }}>
            {positivo ? "▲" : "▼"} {Math.abs(mejora).toFixed(4)}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 8, fontSize: 11, fontFamily: "var(--font-mono)" }}>
        <span style={{ color: "var(--text3)" }}>
          Gen 0: <span style={{ color: "var(--text2)" }}>{inicial.toFixed(4)}</span>
        </span>
        <span style={{ color: "var(--text3)" }}>
          Final: <span style={{ color: v.color }}>{final_.toFixed(4)}</span>
        </span>
        {proms && (
          <span style={{ color: "var(--text3)" }}>
            Prom final:{" "}
            <span style={{ color: v.color, opacity: 0.6 }}>
              {(proms[proms.length - 1] ?? 0).toFixed(4)}
            </span>
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="gen" tick={{ fontSize: 9 }} />
          <YAxis
            domain={dominio}
            tick={{ fontSize: 9 }}
            tickFormatter={(v) => v.toFixed(3)}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          {proms && (
            <Line
              type="monotone" dataKey="promedio" stroke={v.color}
              strokeWidth={1.2} dot={false} strokeDasharray="4 3"
              opacity={0.5} name="Prom. población"
            />
          )}
          <Line
            type="monotone" dataKey="mejor" stroke={v.color}
            strokeWidth={2} dot={false} name="Mejor individuo"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function TabVariables({ historial, nPrevios = 0 }) {
  return (
    <div>
      {/* Nota sobre alcance de las gráficas */}
      <div style={{
        background: "rgba(45,206,137,0.06)", border: "1px solid rgba(45,206,137,0.2)",
        borderRadius: 10, padding: "10px 16px", marginBottom: 16,
        fontSize: 12, color: "var(--text2)", lineHeight: 1.7,
      }}>
        <strong style={{ color: "var(--text)" }}>Alcance de las gráficas:</strong>{" "}
        Cada punto representa una generación del AG de <strong>esta jornada</strong>.{" "}
        {nPrevios > 0 ? (
          <>
            <strong style={{ color: "var(--warn)" }}>
              V1 y V2 evalúan el corral completo ({nPrevios} nidos previos o en descanso ya estaban en el corral al inicio).
            </strong>{" "}
            La línea de Gen 0 ya incluye el efecto de los nidos previos sobre la tasa de eclosión
            y las violaciones de separación. El AG mejora V1 y V2 colocando los nidos nuevos
            sin agravar la situación de los ya sembrados.
          </>
        ) : (
          "V3 evalúa solo los nidos nuevos de esta jornada. V1 y V2 evalúan todos los nidos del corral."
        )}
      </div>

      <div className="grid-2">
        {VARS.map((v) => (
          <VarCard key={v.key} v={v} historial={historial} nPrevios={nPrevios} />
        ))}
      </div>
    </div>
  );
}
