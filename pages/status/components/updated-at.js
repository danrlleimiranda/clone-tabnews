export default function UpdatedAt({ isLoading, data }) {
  if (isLoading && !data) {
    return <p>Carregando...</p>;
  }

  return (
    <div>
      <p
        style={{
          color: "green",
        }}
      >
        {" "}
        Última atualização: {new Date(data?.updated_at).toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
