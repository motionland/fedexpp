import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Gagal mengambil data");
  return res.json();
};

export function useFetch<T>(endpoint: string) {
  const { data, error, isLoading, mutate } = useSWR<T>(endpoint, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: true,
  });

  return {
    data,
    error,
    isLoading,
    refetch: async () => {
      await mutate(async () => await fetcher(endpoint), {
        revalidate: true,
      });
    },
  };
}

export function usePaginatedFetch<T>(
  baseEndpoint: string,
  page: number,
  limit: number = 20,
  status?: string
) {
  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", limit.toString());
    if (status) params.set("status", status);
    return `${baseEndpoint}?${params.toString()}`;
  };

  const { data, error, isLoading, mutate } = useSWR<T>(
    [baseEndpoint, page, limit, status],
    () => fetcher(buildUrl(page)),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: true,
    }
  );

  return {
    data,
    error,
    isLoading,
    refetch: async () => {
      await mutate(async () => await fetcher(buildUrl(page)), {
        revalidate: true,
      });
    },
  };
}
