// Lo que rinde la colocación que encontró el AG, contra la colocación que se
// hace hoy en el corral sin ningún algoritmo (llenado secuencial de la rejilla
// a la separación de la norma y profundidad óptima).
//
// Esta pestaña existe para responder la única pregunta que importa de un
// optimizador: ¿cuántas crías más salen por usarlo? Si la respuesta es cero,
// se dice, no se esconde.

const f1 = (v) => (v == null ? "—" : Number(v).toFixed(1));
const f2 = (v) => (v == null ? "—" : Number(v).toFixed(2));
const f4 = (v) => (v == null ? "—" : Number(v).toFixed(4));

const MESES = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const NOMBRE = { golfina: "Golfina", prieta: "Prieta", laud: "Laúd" };

// Qué reparto de franjas eligió el AG y qué parámetros del sitio son supuestos.
function RepartoYSupuestos({ ordenZonas, ordenBase, sitio }) {
  if (!ordenZonas && !sitio) return null;
  const cambio = ordenZonas && ordenBase &&
    ordenZonas.join() !== ordenBase.join();
  const supuestos = sitio?.supuestos || [];
  return (
    <div className="card" style={{ marginTop: 20 }}>
      {ordenZonas && (
        <>
          <div className="card-title">Reparto de franjas elegido por el AG</div>
          <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7, margin: "0 0 12px" }}>
            De izquierda a derecha del corral:{" "}
            <strong>{ordenZonas.map((e) => NOMBRE[e] || e).join(" → ")}</strong>.{" "}
            {cambio
              ? "Es distinto del reparto histórico: el AG movió la sombra a otra especie porque así se pierden menos nidos por calor."
              : `Coincide con el reparto histórico: con esta mezcla de especies, dejar a ${NOMBRE[ordenZonas[0]] || ordenZonas[0]} bajo la malla es lo que menos nidos pierde por calor. Con otra mezcla el AG puede elegir otro reparto.`}
          </p>
        </>
      )}
      {sitio && (
        <p style={{ fontSize: 11, color: "var(--text3)", margin: "0 0 8px", fontFamily: "var(--font-mono)" }}>
          Sitio: {sitio.latitud.toFixed(5)}, {sitio.longitud.toFixed(5)} · orientación {sitio.orientacion}° ·
          malla a {sitio.altura_malla} cm, atenuación {(sitio.atenuacion_malla * 100).toFixed(0)}%
        </p>
      )}
      {supuestos.length > 0 && (
        <details>
          <summary style={{ fontSize: 12, cursor: "pointer", color: "var(--warn)" }}>
            {supuestos.length} parámetros son supuestos, no mediciones
          </summary>
          <ul style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.6, paddingLeft: 18 }}>
            {supuestos.map((s) => (
              <li key={s.campo}><code>{s.campo} = {s.valor}</code>: {s.fuente}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export default function TabRendimiento({ rendimiento, ordenZonas, ordenBase, sitio }) {
  const { ag, secuencial, ganancia_crias, ganancia_fitness } = rendimiento;

  // Umbral de lectura: por debajo de una cría de diferencia las dos
  // colocaciones son equivalentes en la práctica.
  const hayGanancia = ganancia_crias >= 1.0;
  const hayPerdida = ganancia_crias <= -1.0;

  const filas = [
    ["Crías esperadas", f1(ag.crias_esperadas), f1(secuencial.crias_esperadas),
      "Huevos por nido del mes × tasa de eclosión, descontando hacinamiento"],
    ["Índice de eclosión", f4(ag.indice_eclosion), f4(secuencial.indice_eclosion),
      "Fracción de crías que sobrevive al hacinamiento (Honarvar et al. 2008)"],
    ["Densidad máxima", `${f2(ag.densidad_maxima_m2)} nidos/m²`,
      `${f2(secuencial.densidad_maxima_m2)} nidos/m²`,
      "El nido más apretado del corral. La norma son 1.0 nidos/m²"],
    ["Hembras", `${f1(ag.pct_hembras)} %`, `${f1(secuencial.pct_hembras)} %`,
      "Modelo de Girondot sobre la temperatura del período termosensible"],
    ["Temp. media del PTS", `${f2(ag.temp_pts_media_c)} °C`,
      `${f2(secuencial.temp_pts_media_c)} °C`,
      "Pivote propia de cada especie: golfina 29.95, prieta 29.2, laúd 29.4 °C"],
    ["Nidos en riesgo letal", ag.nidos_en_riesgo, secuencial.nidos_en_riesgo,
      "Nidos que rebasarían 36 °C en el último tercio de la incubación"],
    ["Aptitud", f4(ag.fitness), f4(secuencial.fitness),
      "Función de aptitud del AG, con los coeficientes documentados"],
  ];

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">
          {hayGanancia
            ? `El AG suma ${f1(ganancia_crias)} crías a esta jornada`
            : hayPerdida
              ? `Atención: el AG queda ${f1(Math.abs(ganancia_crias))} crías por debajo`
              : "Las dos colocaciones rinden lo mismo en esta jornada"}
        </div>
        <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7, margin: 0 }}>
          {hayGanancia ? (
            <>
              Se comparan dos formas de sembrar los mismos {rendimiento.nidos_nuevos} nidos
              en {MESES[rendimiento.mes]}, sobre el mismo corral y con los mismos nidos ya
              enterrados. La diferencia es únicamente dónde quedó cada nido.
            </>
          ) : hayPerdida ? (
            <>
              El algoritmo debería igualar o superar al llenado secuencial. Si queda por
              debajo, hay un problema en la función de aptitud o en los operadores, y no
              debe presentarse este resultado sin explicarlo.
            </>
          ) : (
            <>
              Con {rendimiento.nidos_nuevos} nidos el corral no se satura: las dos
              colocaciones caben respetando la separación que la norma fija para cada
              especie, así que ninguna pierde crías por hacinamiento. La diferencia en
              crías aparece cuando entran más nidos de los que caben.
              {ag.nidos_en_riesgo > 0 && (
                <> Aun así, {ag.nidos_en_riesgo} de {rendimiento.nidos_evaluados} nidos
                rebasarían el límite letal de 36 °C en el último tercio de la incubación:
                la sombra disponible no alcanza para todos.</>
              )}
            </>
          )}
        </p>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-box">
          <div className="stat-val" style={{ color: "var(--accent)" }}>
            {f1(ag.crias_esperadas)}
          </div>
          <div className="stat-lbl">Crías con el AG</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{f1(secuencial.crias_esperadas)}</div>
          <div className="stat-lbl">Crías sin algoritmo</div>
        </div>
        <div className="stat-box">
          <div
            className="stat-val"
            style={{ color: hayGanancia ? "var(--accent)" : "var(--text2)" }}
          >
            {ganancia_crias > 0 ? "+" : ""}{f1(ganancia_crias)}
          </div>
          <div className="stat-lbl">Diferencia</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{rendimiento.nidos_evaluados}</div>
          <div className="stat-lbl">Nidos evaluados</div>
        </div>
      </div>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Indicador</th>
              <th>Colocación del AG</th>
              <th>Llenado secuencial</th>
              <th>De dónde sale</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(([nombre, valorAG, valorSec, fuente]) => (
              <tr key={nombre}>
                <td>{nombre}</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{valorAG}</td>
                <td style={{ fontFamily: "var(--font-mono)", color: "var(--text2)" }}>
                  {valorSec}
                </td>
                <td style={{ fontSize: 11, color: "var(--text2)" }}>{fuente}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.7, marginTop: 16 }}>
        Referencia de comparación: {rendimiento.referencia} Se eligió esa referencia y no
        una colocación al azar porque nadie siembra al azar: el algoritmo tiene que
        superar lo que ya se hace, no un caso artificialmente malo.
        {ganancia_fitness != null && (
          <> Diferencia de aptitud: {ganancia_fitness > 0 ? "+" : ""}{f4(ganancia_fitness)}.</>
        )}
      </p>

      <RepartoYSupuestos ordenZonas={ordenZonas} ordenBase={ordenBase} sitio={sitio} />
    </div>
  );
}
