import { useState } from "react";

const ESPECIES = ["golfina"];

const COLORES = {
  golfina: "var(--golfina)",
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
              {porEspecie[esp].length} nidos sembrados en hileras
            </span>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Sector</th>
                  <th>X (m)</th>
                  <th>Y (m)</th>
                  <th>Prof. (cm)</th>
                  <th>Proporción Sexual Estimada</th>
                </tr>
              </thead>
              <tbody>
                {porEspecie[esp].map((g) => {
                  const ps = g.proporcion_sexual || { pct_machos: 1.1, pct_hembras: 98.9, sesgo: "Feminizado" };
                  return (
                    <tr key={g.id}>
                      <td style={{ fontWeight: 700 }}>#{g.id}</td>
                      <td>
                        <strong style={{ color: "var(--warn)" }}>{g.sector || "A-1"}</strong>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{(g.x * 0.01).toFixed(2)}m</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{(g.y * 0.01).toFixed(2)}m</td>
                      <td style={{ color: COLORES[esp], fontFamily: "var(--font-mono)", fontWeight: 600 }}>{g.prof.toFixed(1)} cm</td>
                      <td style={{ fontSize: 11 }}>
                        <span style={{ color: "var(--laud)", fontWeight: 600 }}>{ps.pct_hembras}% ♀</span> · <span style={{ color: "var(--prieta)", fontWeight: 600 }}>{ps.pct_machos}% ♂</span>
                      </td>
                    </tr>
                  );
                })}
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
  const ind = top3 && top3.length > 0 ? top3[seleccionado] : null;

  if (!ind) return null;

  return (
    <div>
      {/* Selector de individuo */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {top3.map((item, i) => (
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
              {item.fitness.toFixed(4)}
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
              V2 — Violaciones de Separación Mínima (MINIMIZAR)
            </div>
            <PorcentajeBarra valor={ind.v2} max={1} color="var(--warn)" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>
              V3 — Desviación de Profundidad respecto al Óptimo (MINIMIZAR)
            </div>
            <PorcentajeBarra valor={ind.v3} max={1} color="var(--prieta)" />
          </div>
        </div>
      </div>

      {/* Tabla de nidos por especie */}
      <div className="card">
        <div className="card-title">
          Distribución de Nidos en Hileras — Individuo #{seleccionado + 1}
          <span style={{ color: "var(--text3)", fontWeight: 400, marginLeft: 8 }}>
            ({ind.genes.length} nidos totales)
          </span>
        </div>
        <TablaGenes genes={ind.genes} />
      </div>
    </div>
  );
}
