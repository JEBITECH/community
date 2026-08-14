import { useQuery } from "@tanstack/react-query";
import { getFranchisesByFranchisorId } from "../api";

interface FranchiseParams {
  search?: string;
  page?: number;
  limit?: number;
}

export const useFranchisesByFranchisor = (
  franchisorId: number | null,
  params: FranchiseParams = {},
) => {
  return useQuery({
    queryKey: ["franchises", franchisorId, params.search, params.page, params.limit],
    queryFn: () => getFranchisesByFranchisorId(franchisorId!, params),
    enabled: !!franchisorId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
};
