import { useQuery } from "@tanstack/react-query";
import { getRoles } from "../api";

export const useRoles = () => {
  return useQuery({
    queryKey: ["roles"],
    queryFn: getRoles
  });
};
