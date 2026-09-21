// Cuántos nidos admitió el corral y, si sobraron, cuáles y por qué.
//
// Existe porque antes esta situación no se reportaba: cuando llegaban más
// nidos de los que caben, el programa apretaba la rejilla sin límite y sembraba
// los sobrantes repitiendo la última casilla, o sea varias nidadas en las
// mismas coordenadas. Decía que sí cabían. Ahora dice que no, con el número.

const NOMBRE = { golfina: "Golfina", prieta: "Prieta", laud: "Laúd" };

const COLOR_BANDA = {
  norma:    "var(--accent)",
  apretado: "var(--warn)",
  excedido: "var(--danger, #ef4444)",
};

export default function TarjetaCupo({ cupo }) {
  if (!cupo) return null;
  const color = COLOR_BANDA[cupo.banda] || "var(--text2)";
  const hayFaltante = cupo.total_sobrantes > 0;

  // Especies ordenadas por prioridad de conservación: primero la que entra
  // primero, que es el orden en que se decidió el cupo.
  const especies = Object.keys(cupo.demanda || {}).sort(
    (a, b) => (cupo.prioridades?.[a] ?? 99) - (cupo.prioridades?.[b] ?? 99));

  return (
    <div className="card" style={{ marginBottom: 20, borderLeft: `3px solid ${color}` }}>
      <div className="card-title" style={{ color }}>
        {cupo.banda_nombre}
      </div>

      <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7, margin: "0 0 14px" }}>
        {cupo.banda === "norma" && (
          <>Los {cupo.total_demanda} nidos de esta jornada caben respetando la
          separación que la NOM-162 fija para cada especie. No hace falta
          apretar nada.</>
        )}
        {cupo.banda === "apretado" && (
          <>Los {cupo.total_demanda} nidos caben, pero la rejilla tuvo que
          apretarse por debajo de la separación de la norma. Entran todos de
          todas formas: apretar cuesta eclosión, y dejar un nido fuera del
          corral lo expone a saqueo y depredación, que es peor.</>
        )}
        {cupo.banda === "excedido" && (
          <>Llegaron {cupo.total_demanda} nidos y el corral admite{" "}
          <strong>{cupo.total_admitidos}</strong> al límite físico de
          separación. <strong>{cupo.total_sobrantes} nidos no caben</strong> y
          necesitan otro destino: un segundo corral, o dejarlos in situ con
          protección. El programa no los siembra encimados.</>
        )}
      </p>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Especie</th>
              <th>Riesgo</th>
              <th>Llegaron</th>
              <th>Entran</th>
              <th>No caben</th>
              <th>Separación</th>
              <th>Piso físico</th>
            </tr>
          </thead>
          <tbody>
            {especies.map((e) => {
              const sobra = cupo.sobrantes?.[e] || 0;
              return (
                <tr key={e}>
                  <td>{NOMBRE[e] || e}</td>
                  <td style={{ fontSize: 11 }}>
                    <span style={{ fontFamily: "var(--font-mono)" }}>
                      {cupo.categorias?.[e]}
                    </span>{" "}
                    <span style={{ color: "var(--text3)" }}>
                      {cupo.categorias_nombre?.[e]}
                    </span>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{cupo.demanda[e]}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                    {cupo.admitidos?.[e] ?? 0}
                  </td>
                  <td style={{
                    fontFamily: "var(--font-mono)",
                    color: sobra ? "var(--danger, #ef4444)" : "var(--text3)",
                    fontWeight: sobra ? 700 : 400,
                  }}>
                    {sobra || "—"}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", color: "var(--text2)" }}>
                    {cupo.separaciones?.[e]} cm
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", color: "var(--text3)" }}>
                    {cupo.piso?.[e]} cm
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hayFaltante && (
        <p style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.7, marginTop: 14 }}>
          <strong>Quién entra primero:</strong> la especie con mayor riesgo de
          extinción, y la menos amenazada absorbe el faltante. No se reparte
          maximizando crías a propósito: el laúd pone nidadas más pequeñas y
          necesita más separación, así que ese criterio dejaría fuera justo a la
          especie En Peligro Crítico para meter más golfinas, que están
          Vulnerables. Es una decisión de conservación y está declarada en{" "}
          <code>csv/riesgo_extincion.csv</code>.
        </p>
      )}

      <p style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.7, marginTop: 10 }}>
        El <strong>piso físico</strong> no es la norma: es la suma de los radios
        de las dos cámaras más la pared de arena entre ellas. Por debajo de esa
        distancia las excavaciones se intersecan, así que no es incumplir una
        regla sino pedir que se entierren dos nidadas en el mismo hoyo.
      </p>
    </div>
  );
}
