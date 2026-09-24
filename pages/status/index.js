import useSWR from "swr";
import UpdatedAt from "./components/updated-at";
import DatabaseInfo from "./components/database-info";

export async function fetchApi(key) {
  const response = await fetch(key);
  const responseBody = await response.json();

  return responseBody;
}

export default function StatusPage() {
  const { data, isLoading } = useSWR("api/v1/status", fetchApi);
  return (
    <div>
      <h1>Status</h1>
      <UpdatedAt data={data} isLoading={isLoading} />
      <DatabaseInfo data={data} isLoading={isLoading} />
    </div>
  );
}
