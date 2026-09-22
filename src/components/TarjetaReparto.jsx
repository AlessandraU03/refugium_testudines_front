// Cómo quedó repartido el corral entre las tres especies, y qué parámetros del
// sitio son supuestos en lugar de mediciones.
//
// Vivía dentro de la pestaña "Rendimiento del AG". Esa pestaña se quitó porque
// la comparación contra el llenado secuencial no se leía —mostraba dos columnas
// donde el AG pierde una fila y gana otra, sin la columna que decide—, pero
// estas dos cosas no se pueden perder con ella:
//
//   - El reparto de franjas es la única explicación de por qué las especies no
//     cambian de zona entre jornadas.
//   - La lista de supuestos es el mecanismo de honestidad del sistema: un
//     parámetro declarado se puede defender, uno escondido no.
//
// Así que se movieron aquí, junto al diagrama del corral, que es donde
// conceptualmente les corresponde: describen la geometría del corral, no el
// rendimiento del algoritmo.

const NOMBRE = { golfina: "Golfina", prieta: "Prieta", laud: "Laúd" };

export default function TarjetaReparto({ ordenZonas, sitio, ordenFijo, ordenMotivo }) {
  if (!ordenZonas && !sitio) return null;
  const supuestos = sitio?.supuestos || [];

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      {ordenZonas && (
        <>
          <div className="card-title">
            {ordenFijo ? "Reparto de franjas del corral (fijo)"
                       : "Reparto de franjas elegido por el AG"}
          </div>
          <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7, margin: "0 0 12px" }}>
            De izquierda a derecha del corral:{" "}
            <strong>{ordenZonas.map((e) => NOMBRE[e] || e).join(" → ")}</strong>.{" "}
            {ordenMotivo}
          </p>
          {ordenFijo && (
            <p style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.7, margin: "0 0 12px" }}>
              El reparto sólo se decide una vez, con el corral vacío. A partir de
              la primera siembra queda fijo toda la temporada: cambiar una especie
              de franja obligaría a desenterrar los nidos que ya están sembrados.
            </p>
          )}
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
