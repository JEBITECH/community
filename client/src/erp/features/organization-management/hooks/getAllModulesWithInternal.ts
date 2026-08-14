import { useQuery } from "@tanstack/react-query";
import { getModulesWithInternal } from "../api";

export const useGetModulesWithInternal = () => {
  return useQuery({
    queryKey: ["modules-with-internal"],
    queryFn: getModulesWithInternal
  });
};
