import { useState } from "react";

const ESPECIES = ["golfina", "prieta", "laud"];

const COLORES = {
  golfina: "var(--golfina)",
  prieta:  "var(--prieta)",
  laud:    "var(--laud)",
};

function PorcentajeBarra({ valor, max = 1, color }) {
  const pct = Math.min((valor / max) * 100, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, minWidth: 44, textAlign: "right" }}>
        {valor.toFixed(4)}
      </span>
    </div>
  );
}

function TablaGenes({ genes }) {
  const porEspecie = {};
  genes.forEach((g) => {
    if (!porEspecie[g.especie]) porEspecie[g.especie] = [];
    porEspecie[g.especie].push(g);
  });

  return (
    <div>
      {ESPECIES.filter((e) => porEspecie[e]).map((esp) => (
        <div key={esp} style={{ marginBottom: 14 }}>
          <div style={{ marginBottom: 6 }}>
            <span className={`badge badge-${esp}`}>{esp.charAt(0).toUpperCase() + esp.slice(1)}</span>
            <span style={{ color: "var(--text2)", fontSize: 11, marginLeft: 8 }}>
              {porEspecie[esp].length} nidos
            </span>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>X (cm)</th>
                  <th>Y (cm)</th>
                  <th>Prof. (cm)</th>
                  <th>Zona</th>
                </tr>
              </thead>
              <tbody>
                {porEspecie[esp].map((g) => (
                  <tr key={g.id}>
                    <td>{g.id}</td>
                    <td>{g.x.toFixed(1)}</td>
                    <td>{g.y.toFixed(1)}</td>
                    <td style={{ color: COLORES[esp] }}>{g.prof.toFixed(1)}</td>
                    <td>
                      <span className={`badge badge-${esp}`} style={{ fontSize: 10 }}>
                        zona_{esp}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TabTop3({ top3 }) {
  const [seleccionado, setSeleccionado] = useState(0);
  const ind = top3[seleccionado];

  return (
    <div>
      {/* Selector de individuo */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {top3.map((ind, i) => (
          <button
            key={i}
            onClick={() => setSeleccionado(i)}
            style={{
              flex: 1,
              padding: "12px 8px",
              background: seleccionado === i ? "rgba(45,206,137,0.12)" : "var(--bg2)",
              border: `1px solid ${seleccionado === i ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "var(--radius)",
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.2s",
            }}
          >
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14, color: seleccionado === i ? "var(--accent)" : "var(--text2)" }}>
              #{i + 1}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text)", marginTop: 4 }}>
              {ind.fitness.toFixed(4)}
            </div>
            <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>fitness</div>
          </button>
        ))}
      </div>

      {/* Variables del individuo seleccionado */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Variables de Optimización — Individuo #{seleccionado + 1}</div>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>
              V1 — Tasa de Eclosión Estimada (MAXIMIZAR)
            </div>
            <PorcentajeBarra valor={ind.v1} max={0.90} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>
              V2 — Mezcla de Especies fuera de Zona (MINIMIZAR)
            </div>
            <PorcentajeBarra valor={ind.v2} max={1} color="var(--laud)" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>
              V3 — Violaciones de Separación Mínima (MINIMIZAR)
            </div>
            <PorcentajeBarra valor={ind.v3} max={1} color="var(--warn)" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>
              V4 — Desviación de Profundidad respecto al Óptimo (MINIMIZAR)
            </div>
            <PorcentajeBarra valor={ind.v4} max={1} color="var(--prieta)" />
          </div>
        </div>
      </div>

      {/* Tabla de nidos por especie */}
      <div className="card">
        <div className="card-title">
          Distribución de Nidos — Individuo #{seleccionado + 1}
          <span style={{ color: "var(--text3)", fontWeight: 400, marginLeft: 8 }}>
            ({ind.genes.length} nidos totales)
          </span>
        </div>
        <TablaGenes genes={ind.genes} />
      </div>
    </div>
  );
}
