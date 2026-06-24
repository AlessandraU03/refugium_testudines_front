import { useState, useCallback, useEffect } from "react";
import PanelEntradas from "./components/PanelEntradas";
import TabEvolucion from "./components/TabEvolucion";
import TabTop3 from "./components/TabTop3";
import TabCorral from "./components/TabCorral";
import TabValidacion from "./components/TabValidacion";
import TabFechas from "./components/TabFechas";
import TabVariables from "./components/TabVariables";
import TabTemporada from "./components/TabTemporada";
import turtleLogo from "./turtle_logo.png";
import "./App.css";

const TABS = [
  { id: "corral",     label: "Diagrama Corral"     },
  { id: "evolucion",  label: "Evolución Aptitud"  },
  { id: "top3",       label: "Top 3 Individuos"   },
  { id: "validacion", label: "Validación"          },
  { id: "fechas",     label: "Fechas Eclosión"     },
  { id: "variables",  label: "Variables V1–V4"     },
  { id: "temporada",  label: "Estado Corral"       },
];

export default function App() {
  const [resultado,   setResultado]   = useState(null);
  const [ejecutando,  setEjecutando]  = useState(false);
  const [error,       setError]       = useState(null);
  const [tabActiva,   setTabActiva]   = useState("corral");
  const [guardado,    setGuardado]    = useState(false);
  const [inputsAG,    setInputsAG]    = useState(null);
  const [temporada,   setTemporada]   = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [tema, setTema] = useState("dark"); // tema: 'dark' | 'light'

  // Carga el estado del corral al iniciar y tras guardar
  const cargarTemporada = useCallback(async () => {
    try {
      const r = await fetch("https://refugium-testudines-back.onrender.com/api/corral-temporada");
      if (r.ok) setTemporada(await r.json());
    } catch (_) {}
  }, []);

  useEffect(() => { cargarTemporada(); }, [cargarTemporada]);

  const handleEjecutar = useCallback(async (formData) => {
    setEjecutando(true);
    setError(null);
    setGuardado(false);
    setInputsAG(formData);
    try {
      const res = await fetch("https://refugium-testudines-back.onrender.com/api/ejecutar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error en el servidor");
      setResultado(json);
      setTabActiva("corral"); // Mostrar directamente el corral al ejecutar
    } catch (e) {
      setError(e.message);
    } finally {
      setEjecutando(false);
    }
  }, []);

  const handleGuardar = useCallback(async () => {
    if (!resultado || !inputsAG) return;
    try {
      const res = await fetch("https://refugium-testudines-back.onrender.com/api/guardar-jornada", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha:     inputsAG.fecha,
          n_golfina: inputsAG.n_golfina,
          n_prieta:  inputsAG.n_prieta,
          n_laud:    inputsAG.n_laud,
          mejor:     resultado.mejor,
        }),
      });
      if (res.ok) {
        setGuardado(true);
        cargarTemporada();
      }
    } catch (_) {
      setError("No se pudo guardar la jornada.");
    }
  }, [resultado, inputsAG, cargarTemporada]);

  const handleNuevaTemporada = useCallback(async () => {
    await fetch("https://refugium-testudines-back.onrender.com/api/nueva-temporada", { method: "POST" });
    setResultado(null);
    setGuardado(false);
    cargarTemporada();
  }, [cargarTemporada]);

  const mejor = resultado?.mejor;

  return (
    <div className={`app theme-${tema}`}>
      <header className="header">
        <div className="header-inner">
          <img src={turtleLogo} alt="Refugium Logo" className="logo-img" />
          <div>
            <h1 className="header-title">Refugium Testudinis</h1>
          </div>
          
          <button 
            className="btn btn-secondary btn-header-toggle" 
            style={{ width: "auto", margin: "0 0 0 24px", padding: "8px 14px", fontSize: "12px", border: "1px solid var(--border)" }}
            onClick={() => setSidebarVisible(!sidebarVisible)}
          >
            {sidebarVisible ? "◀ Ocultar Menú" : "▶ Mostrar Menú"}
          </button>

          <button 
            className="btn btn-secondary btn-header-theme" 
            style={{ width: "auto", margin: "0 0 0 10px", padding: "8px 14px", fontSize: "12px", border: "1px solid var(--border)" }}
            onClick={() => setTema(tema === "dark" ? "light" : "dark")}
          >
            {tema === "dark" ? "☀️ Modo Claro" : "🌙 Modo Oscuro"}
          </button>

          {mejor && (
            <div className="header-fitness">
              <span className="fitness-label">Fitness</span>
              <span className="fitness-val">{mejor.fitness.toFixed(4)}</span>
              <div className="fitness-pills">
                <span className="pill pill-v1">V1 {mejor.v1.toFixed(3)}</span>
                <span className="pill pill-v2">V2 {mejor.v2.toFixed(3)}</span>
                <span className="pill pill-v3">V3 {mejor.v3.toFixed(3)}</span>
                <span className="pill pill-v4">V4 {mejor.v4.toFixed(3)}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="layout">
        {sidebarVisible && (
          <aside className="sidebar">
            <PanelEntradas
              onEjecutar={handleEjecutar}
              onGuardar={handleGuardar}
              onNuevaTemporada={handleNuevaTemporada}
              ejecutando={ejecutando}
              tieneResultado={!!resultado}
              guardado={guardado}
              temporada={temporada}
            />
          </aside>
        )}

        <main className="main">
          {error && <div className="error-banner">⚠ {error}</div>}

          {!resultado && !ejecutando && (
            <div className="empty-state">
              <div className="empty-icon">🥚</div>
              <p>Ingresa los nidos recolectados y ejecuta el AG</p>
              <p className="empty-sub">
                El sistema calculará la distribución óptima en el corral de incubación
              </p>
            </div>
          )}

          {ejecutando && (
            <div className="loading-state">
              <div className="empty-icon loading-egg">🥚</div>
              <p>Ejecutando Algoritmo Genético…</p>
              <p className="empty-sub">Optimizando distribución de nidos</p>
            </div>
          )}

          {resultado && !ejecutando && (
            <>
              <div className="tabs">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    className={`tab-btn ${tabActiva === t.id ? "tab-active" : ""}`}
                    onClick={() => setTabActiva(t.id)}
                  >
                    {t.label}
                    {t.id === "temporada" && temporada?.resumen?.jornadas > 0 && (
                      <span className="tab-badge">{temporada.resumen.jornadas}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="tab-content">
                {tabActiva === "evolucion"  && <TabEvolucion  historial={resultado.historial} nPrevios={resultado.n_previos||0} totalCorral={resultado.total_corral||0} />}
                {tabActiva === "top3"       && <TabTop3       top3={resultado.top3} />}
                {tabActiva === "corral"     && (
                  <TabCorral
                    mejor={resultado.mejor}
                    zonas={resultado.zonas}
                    corral={resultado.corral}
                    nidosPrevios={resultado.nidos_previos || []}
                  />
                )}
                {tabActiva === "validacion" && <TabValidacion validacion={resultado.validacion} />}
                {tabActiva === "fechas"     && <TabFechas     fechas={resultado.fechas} />}
                {tabActiva === "variables"  && <TabVariables  historial={resultado.historial} nPrevios={resultado.n_previos||0} />}
                {tabActiva === "temporada"  && (
                  <TabTemporada temporada={temporada} corral={resultado.corral} />
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
