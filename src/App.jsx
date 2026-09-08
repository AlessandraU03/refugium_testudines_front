import { useState, useCallback, useEffect } from "react";
import PanelEntradas from "./components/PanelEntradas";
import TabEvolucion from "./components/TabEvolucion";
import TabTop3 from "./components/TabTop3";
import TabCorral from "./components/TabCorral";
import TabValidacion from "./components/TabValidacion";
import TabFechas from "./components/TabFechas";
import TabVariables from "./components/TabVariables";
import TabClustering from "./components/TabClustering";
import TabTemporada from "./components/TabTemporada";
import TabPTS from "./components/TabPTS";
import TabCapacidad from "./components/TabCapacidad";
import turtleLogo from "./turtle_logo.png";
import "./App.css";

// Detección automática del backend: local si se ejecuta en localhost, o Render si está en producción.
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000"
  : "https://refugium-testudines-back.onrender.com";

const TABS = [
  { id: "temporada",  label: "Estado Corral"       },
  { id: "capacidad",  label: "Capacidad"           },
  { id: "clustering", label: "Análisis IA (Densidad)" },
  { id: "corral",     label: "Diagrama Corral"     },
  { id: "evolucion",  label: "Evolución Aptitud"  },
  { id: "pts",        label: "PTS (proyección)"    },
  { id: "top3",       label: "Top 3 Individuos"   },
  { id: "validacion", label: "Validación"          },
  { id: "fechas",     label: "Fechas Eclosión"     },
  { id: "variables",  label: "Variables V1–V3"     },
];

export default function App() {
  const [resultado,   setResultado]   = useState(null);
  const [ejecutando,  setEjecutando]  = useState(false);
  const [error,       setError]       = useState(null);
  const [tabActiva,   setTabActiva]   = useState("temporada"); // Iniciamos por defecto en el Estado del Corral
  const [guardado,    setGuardado]    = useState(false);
  const [inputsAG,    setInputsAG]    = useState(null);
  const [temporada,   setTemporada]   = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [tema, setTema] = useState("dark"); // tema: 'dark' | 'light'

  // Carga el estado del corral al iniciar y tras guardar
  const cargarTemporada = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/corral-temporada`);
      if (r.ok) {
        const json = await r.json();
        setTemporada(json);
      }
    } catch (_) {}
  }, []);

  useEffect(() => { cargarTemporada(); }, [cargarTemporada]);

  const handleEjecutar = useCallback(async (formData) => {
    setEjecutando(true);
    setError(null);
    setGuardado(false);
    setInputsAG(formData);
    try {
      const res = await fetch(`${API_URL}/api/ejecutar`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error en el servidor");
      setResultado(json);
      setTabActiva("corral"); // Mostrar directamente el corral optimizado al ejecutar
    } catch (e) {
      setError(e.message);
    } finally {
      setEjecutando(false);
    }
  }, []);

  const handleGuardar = useCallback(async () => {
    if (!resultado || !inputsAG) return;
    try {
      const res = await fetch(`${API_URL}/api/guardar-jornada`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha:     inputsAG.fecha,
          n_golfina: inputsAG.n_golfina,
          n_prieta:  0,
          n_laud:    0,
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
    await fetch(`${API_URL}/api/nueva-temporada`, { method: "POST" });
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
                {mejor.orden != null && (
                  <span className="pill pill-v1">Orden {(mejor.orden * 100).toFixed(0)}%</span>
                )}
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

          {/* Alerta biológica de calor por capacidad */}
          {((resultado?.alerta_calor?.activada) || (temporada?.alerta_calor?.activada)) && (
            <div style={{
              background: "rgba(245, 54, 92, 0.08)",
              border: "1px solid rgba(245, 54, 92, 0.3)",
              color: "var(--laud)",
              borderRadius: 10,
              padding: "12px 20px",
              marginBottom: 16,
              fontSize: 12,
              lineHeight: 1.6,
              display: "flex",
              alignItems: "center",
              gap: 12
            }}>
              <span style={{ fontSize: 20 }}>🔥</span>
              <div>
                <strong>Alerta Biológica:</strong> {resultado?.alerta_calor?.mensaje || temporada?.alerta_calor?.mensaje}
              </div>
            </div>
          )}

          {/* Navegación por pestañas: Siempre visible para no obligar a ejecutar el AG */}
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
            {ejecutando ? (
              <div className="loading-state">
                <div className="empty-icon loading-egg">🥚</div>
                <p>Ejecutando Algoritmo Genético…</p>
                <p className="empty-sub">Optimizando distribución de nidos</p>
              </div>
            ) : (
              <>
                {/* Tab: Estado Corral (Muestra la temporada guardada actual sin requerir ejecutar el AG) */}
                {tabActiva === "temporada" && (
                  <TabTemporada temporada={temporada} corral={resultado?.corral || temporada?.corral} />
                )}

                {/* Tab: Análisis IA (Muestra la densidad de calor acumulado del corral sin requerir ejecutar el AG) */}
                {tabActiva === "clustering" && (
                  <TabClustering
                    clustering={resultado?.clustering || temporada?.clustering}
                    nidosPrevios={resultado ? resultado.nidos_previos : (temporada?.nidos || [])}
                    mejor={resultado?.mejor}
                  />
                )}

                {/* Tab: Diagrama Corral (Jornada actual) */}
                {tabActiva === "corral" && (
                  resultado ? (
                    <TabCorral
                      mejor={resultado.mejor}
                      zonas={resultado.zonas}
                      corral={resultado.corral}
                      nidosPrevios={resultado.nidos_previos || []}
                    />
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">🥚</div>
                      <p>No hay una optimización de jornada activa</p>
                      <p className="empty-sub">Ingresa los nidos recolectados en el menú izquierdo y presiona "Ejecutar AG" para simular la jornada de hoy.</p>
                    </div>
                  )
                )}

                {/* Tab: Evolución (Jornada actual) */}
                {tabActiva === "evolucion" && (
                  resultado ? (
                    <TabEvolucion
                      historial={resultado.historial}
                      nPrevios={resultado.n_previos || 0}
                      totalCorral={resultado.total_corral || 0}
                    />
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">📈</div>
                      <p>Optimización inactiva</p>
                      <p className="empty-sub">Ejecuta el AG para ver el progreso generacional.</p>
                    </div>
                  )
                )}

                {/* Tab: Capacidad (no requiere ejecutar el AG) */}
                {tabActiva === "capacidad" && <TabCapacidad />}

                {/* Tab: Monitoreo PTS (Período Termosensible) */}
                {tabActiva === "pts" && (
                  resultado ? (
                    <TabPTS mejor={resultado.mejor} fechas={resultado.fechas} />
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">🔥</div>
                      <p>Optimización inactiva</p>
                      <p className="empty-sub">Ejecuta el AG para ver el escenario proyectado del Período Termosensible.</p>
                    </div>
                  )
                )}

                {/* Tab: Top 3 (Jornada actual) */}
                {tabActiva === "top3" && (
                  resultado ? (
                    <TabTop3 top3={resultado.top3} />
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">🏆</div>
                      <p>Optimización inactiva</p>
                      <p className="empty-sub">Ejecuta el AG para ver las mejores alternativas de distribución.</p>
                    </div>
                  )
                )}

                {/* Tab: Validación */}
                {tabActiva === "validacion" && (
                  resultado ? (
                    <TabValidacion validacion={resultado.validacion} />
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">🔬</div>
                      <p>Optimización inactiva</p>
                      <p className="empty-sub">Ejecuta el AG para ver la validación contra las tasas de eclosión empíricas.</p>
                    </div>
                  )
                )}

                {/* Tab: Fechas */}
                {tabActiva === "fechas" && (
                  resultado ? (
                    <TabFechas fechas={resultado.fechas} />
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">📅</div>
                      <p>Optimización inactiva</p>
                      <p className="empty-sub">Ejecuta el AG para ver los rangos calendarizados de eclosión.</p>
                    </div>
                  )
                )}

                {/* Tab: Variables */}
                {tabActiva === "variables" && (
                  resultado ? (
                    <TabVariables historial={resultado.historial} nPrevios={resultado.n_previos || 0} />
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">📊</div>
                      <p>Optimización inactiva</p>
                      <p className="empty-sub">Ejecuta el AG para ver el comportamiento de las métricas V1 a V3.</p>
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
