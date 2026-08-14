import { apiRequest, apiRequestFormData } from "@/lib/queryClient";

// Response types
export interface FirebaseUploadResponse {
  success: boolean;
  fileName: string;
  url: string;
}

export interface FirebaseDownloadUrlResponse {
  success: boolean;
  url: string;
}

export interface FirebaseDeleteResponse {
  success: boolean;
  message: string;
}

export async function uploadFile(file: File): Promise<FirebaseUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiRequestFormData("POST", "/data-import/firebase/upload", formData);
  return res.json();
}

export async function getDownloadUrl(filePath: string): Promise<string> {
  const res = await apiRequest("GET", `/data-import/firebase/download-url?filePath=${encodeURIComponent(filePath)}`);
  const data: FirebaseDownloadUrlResponse = await res.json();
  const url = data.url;
  return Array.isArray(url) ? url[0] : url;
}

export async function downloadFile(filePath: string): Promise<Blob> {
  const res = await apiRequest("GET", `/data-import/firebase/download?filePath=${encodeURIComponent(filePath)}`);
  return await res.blob();
}

export async function deleteFile(filePath: string): Promise<FirebaseDeleteResponse> {
  const res = await apiRequest("DELETE", `/data-import/firebase/delete?filePath=${encodeURIComponent(filePath)}`);
  return res.json();
}
