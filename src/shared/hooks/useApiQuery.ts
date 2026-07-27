import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { axiosClient } from '@/shared/lib/axiosClient';

/**
 * High-performance TanStack Query hook with built-in caching & stale-while-revalidate.
 * @param queryKey Unique query key array (e.g. ['products', category])
 * @param url API endpoint path (e.g. '/catalog/products')
 * @param options Additional TanStack Query options
 */
export function useApiQuery<TData = any>(
  queryKey: (string | number | boolean | object | undefined)[],
  url: string,
  options?: Omit<UseQueryOptions<TData, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, Error>({
    queryKey,
    queryFn: async () => {
      const response = await axiosClient.get<any, TData>(url);
      return response;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
}

/**
 * High-performance TanStack Query mutation hook for POST/PUT/DELETE.
 */
export function useApiMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, Error, TVariables>
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: (data, variables, context) => {
      // Invalidate active queries to refresh cached data seamlessly
      queryClient.invalidateQueries();
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}
