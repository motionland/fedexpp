import useSWR from 'swr';

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
    }
  };
}
