import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getEventVolunteerRoles,
  createVolunteerRole,
  getRoleAssignments,
  createVolunteerAssignment,
  getMyVolunteerAssignments,
  cancelVolunteerAssignment,
  approveVolunteerAssignment,
  rejectVolunteerAssignment,
  reassignVolunteerAssignment,
} from "../api/volunteers";
import { useToast } from "@/hooks/use-toast";

export const useEventVolunteerRoles = (eventId?: string) =>
  useQuery({ queryKey: ["volunteer-roles", eventId], queryFn: () => getEventVolunteerRoles(eventId!), enabled: !!eventId });

export const useCreateVolunteerRole = (eventId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: createVolunteerRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-roles", eventId] });
      toast({ title: "Volunteer opportunity created" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useRoleAssignments = (roleId?: string) =>
  useQuery({ queryKey: ["volunteer-role-assignments", roleId], queryFn: () => getRoleAssignments(roleId!), enabled: !!roleId });

export const useCreateVolunteerAssignment = (eventId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: createVolunteerAssignment,
    onSuccess: (_data, volunteerRoleId) => {
      if (eventId) queryClient.invalidateQueries({ queryKey: ["volunteer-roles", eventId] });
      queryClient.invalidateQueries({ queryKey: ["my-volunteer-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-role-assignments", volunteerRoleId] });
      toast({ title: "You're signed up!", description: "Your sign-up is pending admin approval." });
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't sign up", description: error.message, variant: "destructive" });
    },
  });
};

export const useMyVolunteerAssignments = () =>
  useQuery({ queryKey: ["my-volunteer-assignments"], queryFn: getMyVolunteerAssignments });

export const useCancelVolunteerAssignment = (eventId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: cancelVolunteerAssignment,
    onSuccess: () => {
      if (eventId) queryClient.invalidateQueries({ queryKey: ["volunteer-roles", eventId] });
      queryClient.invalidateQueries({ queryKey: ["my-volunteer-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-role-assignments"] });
      toast({ title: "Sign-up cancelled" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useApproveVolunteerAssignment = (roleId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: approveVolunteerAssignment,

    onSuccess: async () => {
      if (roleId) {
        await queryClient.invalidateQueries({
          queryKey: ["volunteer-role-assignments", roleId],
        });
      }

      // ActivityDetail reads the current member assignment from this query.
      await queryClient.invalidateQueries({
        queryKey: ["my-volunteer-assignments"],
      });

      // Refresh role capacity/status.
      await queryClient.invalidateQueries({
        queryKey: ["volunteer-roles"],
      });

      toast({ title: "Volunteer approved" });
    },

    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useRejectVolunteerAssignment = (
  roleId?: string,
  eventId?: string,
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: rejectVolunteerAssignment,

    onSuccess: async () => {
      if (roleId) {
        await queryClient.invalidateQueries({
          queryKey: ["volunteer-role-assignments", roleId],
        });
      }

      if (eventId) {
        await queryClient.invalidateQueries({
          queryKey: ["volunteer-roles", eventId],
        });
      }

      // Keep the member-facing assignment state in sync.
      await queryClient.invalidateQueries({
        queryKey: ["my-volunteer-assignments"],
      });

      toast({
        title: "Volunteer rejected",
        description: "The slot has been freed up.",
      });
    },

    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useReassignVolunteerAssignment = (roleId?: string, eventId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, volunteerRoleId }: { id: string; volunteerRoleId: string }) => reassignVolunteerAssignment(id, volunteerRoleId),
    onSuccess: () => {
      if (roleId) queryClient.invalidateQueries({ queryKey: ["volunteer-role-assignments", roleId] });
      if (eventId) queryClient.invalidateQueries({ queryKey: ["volunteer-roles", eventId] });
      toast({ title: "Volunteer reassigned" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};
