import { useState } from "react";

const today = new Date().toISOString().split("T")[0];

export default function PanelEntradas({
  onEjecutar, onGuardar, onNuevaTemporada,
  ejecutando, tieneResultado, guardado, temporada,
}) {
  const [form, setForm] = useState({
    n_golfina: "70",
    n_prieta:  "25",
    n_laud:    "5",
    fecha:     today,
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    onEjecutar({
      n_golfina: Math.max(0, parseInt(form.n_golfina) || 0),
      n_prieta:  Math.max(0, parseInt(form.n_prieta)  || 0),
      n_laud:    Math.max(0, parseInt(form.n_laud)    || 0),
      fecha:     form.fecha,
    });
  };

  const res = temporada?.resumen || {};

  return (
    <div>
      {/* ENTRADAS DE LA JORNADA */}
      <div className="panel-section">
        <div className="panel-label">Entradas de la Jornada</div>
        <div className="field">
          <label><span className="dot-golfina">●</span> Nidos Golfina</label>
          <input type="number" min="0" value={form.n_golfina} onChange={set("n_golfina")} />
        </div>
        <div className="field">
          <label><span className="dot-prieta">●</span> Nidos Prieta</label>
          <input type="number" min="0" value={form.n_prieta} onChange={set("n_prieta")} />
        </div>
        <div className="field">
          <label><span className="dot-laud">●</span> Nidos Laúd</label>
          <input type="number" min="0" value={form.n_laud} onChange={set("n_laud")} />
        </div>
        <div className="field">
          <label>Fecha de la Jornada</label>
          <input type="date" value={form.fecha} onChange={set("fecha")} />
        </div>
      </div>

      {/* BOTONES */}
      <button className="btn btn-primary" onClick={handleSubmit} disabled={ejecutando}>
        {ejecutando
          ? <><span className="spinner-sm" />Ejecutando…</>
          : "▶  Ejecutar AG"}
      </button>

      {tieneResultado && (
        <button
          className={`btn ${guardado ? "btn-saved" : "btn-secondary"}`}
          onClick={onGuardar}
          disabled={guardado}
        >
          {guardado ? "✓ Jornada Guardada" : "💾  Guardar Jornada"}
        </button>
      )}

      {/* BASE DE CONOCIMIENTO */}
      <div className="panel-section" style={{ marginTop: 18 }}>
        <div className="panel-label">Base de Conocimiento</div>
        <table style={{ fontSize: 11, width: "100%" }}>
          <thead>
            <tr><th>Especie</th><th>P.Opt</th><th>Sep.Min</th></tr>
          </thead>
          <tbody>
            {[["golfina","45cm","100cm"],["prieta","60cm","120cm"],["laud","70cm","150cm"]].map(([e,p,s]) => (
              <tr key={e}>
                <td><span className={`badge badge-${e}`}>{e}</span></td>
                <td style={{ fontFamily:"var(--font-mono)" }}>{p}</td>
                <td style={{ fontFamily:"var(--font-mono)" }}>{s}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RESUMEN TEMPORADA */}
      {res.jornadas > 0 && (
        <div className="panel-section" style={{ marginTop: 12 }}>
          <div className="panel-label">Temporada Actual</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              ["Jornadas",    res.jornadas],
              ["Total nidos", res.total_nidos],
              ["Golfina",     res.golfina],
              ["Prieta",      res.prieta],
              ["Laúd",        res.laud],
            ].map(([l, v]) => (
              <div key={l} className="stat-box" style={{ padding: "8px 10px" }}>
                <div className="stat-val" style={{ fontSize: 16 }}>{v}</div>
                <div className="stat-lbl">{l}</div>
              </div>
            ))}
          </div>
          <button
            className="btn btn-secondary"
            style={{ marginTop: 10, fontSize: 11 }}
            onClick={onNuevaTemporada}
          >
            🗑 Nueva Temporada
          </button>
        </div>
      )}
    </div>
  );
}
