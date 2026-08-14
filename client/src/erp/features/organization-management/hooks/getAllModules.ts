import { useQuery } from "@tanstack/react-query";
import { getModules } from "../api";

export const useGetModules = () => {
  return useQuery({
    queryKey: ["modules"],
    queryFn: getModules
  });
};
