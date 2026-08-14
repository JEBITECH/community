import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import {
  uploadFile,
  deleteFile,
  getDownloadUrl,
  type FirebaseUploadResponse,
  type FirebaseDeleteResponse,
} from "@/lib/firebase-upload";

export interface UseFirebaseUploadReturn {
  uploadMutation: UseMutationResult<FirebaseUploadResponse, Error, File>;
  deleteMutation: UseMutationResult<FirebaseDeleteResponse, Error, string>;
  getDownloadUrl: (filePath: string) => Promise<string>;
}

export function useFirebaseUpload(): UseFirebaseUploadReturn {
  const uploadMutation = useMutation({
    mutationFn: uploadFile,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFile,
  });

  return {
    uploadMutation,
    deleteMutation,
    getDownloadUrl,
  };
}
