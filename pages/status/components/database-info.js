export default function DatabaseInfo({ data, isLoading }) {
  if (isLoading && !data) {
    return <p>Carregando...</p>;
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          color: "green",
          width: "50%",
        }}
      >
        <div>
          <p>database: {"{"}</p>
          <p>Conexões Máximas: {data?.dependencies.database.max_connections}</p>
          <p>
            {" "}
            Conexões Usadas: {data?.dependencies.database.used_connections}
          </p>
          <p>Versão: {data?.dependencies.database.version}</p>
          <p>{"}"}</p>
        </div>
      </div>
    </>
  );
}
