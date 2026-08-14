import React, { useState, useCallback, useEffect, useRef } from "react";
import { Upload, X, Loader2, ImageIcon, Play } from "lucide-react";
import { useFirebaseUpload } from "@/hooks/useFirebaseUpload";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ImageLightbox, { isVideoUrl } from "./ImageLightbox";

interface UploadedFile {
  filePath: string;
  displayUrl: string;
  isUploading: boolean;
  error?: string;
  isVideo?: boolean;
}

export interface ImageUploadProps {
  mode: "single" | "multi";
  accept?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  existingFiles?: string[];
  onChange: (filePaths: string[]) => void;
  onRemove?: (filePath: string) => void;
  /** When true, files are NOT uploaded on select. Parent must call uploadFile() on submit. */
  deferUpload?: boolean;
  /** Called with pending File objects when deferUpload is true */
  onPendingFiles?: (files: File[]) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  mode,
  accept = "image/*",
  maxFiles = 10,
  maxSizeMB = 5,
  existingFiles,
  onChange,
  onRemove,
  deferUpload = false,
  onPendingFiles,
  disabled = false,
  label,
  hint,
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadMutation, deleteMutation, getDownloadUrl } = useFirebaseUpload();
  const { toast } = useToast();
  const initializedRef = useRef(false);
  // Track pending File objects when deferUpload is true
  const pendingFilesRef = useRef<Map<string, File>>(new Map());

  // Resolve existing file paths to signed URLs on mount
  useEffect(() => {
    if (!existingFiles || existingFiles.length === 0 || initializedRef.current) return;
    initializedRef.current = true;

    const resolveExisting = async () => {
      const resolved: UploadedFile[] = [];
      for (const filePath of existingFiles) {
        const isVideo = isVideoUrl(filePath);
        // base64 data URL — use directly
        if (filePath.startsWith('data:')) {
          resolved.push({ filePath, displayUrl: filePath, isUploading: false, isVideo });
          continue;
        }
        // HTTP URL
        if (filePath.startsWith('http')) {
          if (filePath.includes('storage.googleapis.com')) {
            // Firebase storage URL (not directly accessible) — extract path and get signed URL
            try {
              const storagePath = filePath.replace(/^https?:\/\/storage\.googleapis\.com\/[^/]+\//, '');
              const url = await getDownloadUrl(storagePath);
              resolved.push({ filePath, displayUrl: url, isUploading: false, isVideo });
            } catch {
              resolved.push({ filePath, displayUrl: "", isUploading: false, error: "Failed to load", isVideo });
            }
          } else {
            // PMS URL (e.g. Guesty) — use directly
            resolved.push({ filePath, displayUrl: filePath, isUploading: false, isVideo });
          }
          continue;
        }
        // Firebase storage path — resolve via signed URL
        try {
          const url = await getDownloadUrl(filePath);
          resolved.push({ filePath, displayUrl: url, isUploading: false, isVideo });
        } catch {
          resolved.push({ filePath, displayUrl: "", isUploading: false, error: "Failed to load", isVideo });
        }
      }
      setFiles(resolved);
    };

    resolveExisting();
  }, [existingFiles, getDownloadUrl]);

  // Notify parent whenever the completed file list changes
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    // Skip notifying parent during initial mount before files are resolved
    if (!initializedRef.current && files.length === 0) return;
    const paths = files.filter((f) => !f.isUploading && !f.error).map((f) => f.filePath);
    onChangeRef.current(paths);
  }, [files]);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Validate file type
      if (accept) {
        const acceptedTypes = accept.split(",").map((t) => t.trim());
        const isValid = acceptedTypes.some((type) => {
          if (type.endsWith("/*")) {
            const category = type.split("/")[0];
            return file.type.startsWith(category + "/");
          }
          return file.type === type;
        });
        if (!isValid) {
          return `File type not allowed. Accepted: ${accept}`;
        }
      }

      // Validate file size
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        return `File exceeds ${maxSizeMB} MB limit`;
      }

      return null;
    },
    [accept, maxSizeMB]
  );

  const uploadFile = useCallback(
    (file: File) => {
      const previewUrl = URL.createObjectURL(file);
      const isVideo = file.type.startsWith("video/");

      if (deferUpload) {
        // Deferred mode: store File, show blob preview, no upload
        const tempId = `pending-${Date.now()}-${Math.random()}`;
        pendingFilesRef.current.set(tempId, file);

        setFiles((prev) => [
          ...prev,
          { filePath: tempId, displayUrl: previewUrl, isUploading: false, isVideo },
        ]);

        // Notify parent of pending files
        onPendingFiles?.(Array.from(pendingFilesRef.current.values()));
        return;
      }

      // Immediate upload mode (original behavior)
      const tempId = `temp-${Date.now()}-${Math.random()}`;

      // Add placeholder entry with loading state
      setFiles((prev) => [
        ...prev,
        { filePath: tempId, displayUrl: previewUrl, isUploading: true, isVideo },
      ]);

      uploadMutation.mutateAsync(file).then((data) => {
        setFiles((prev) =>
          prev.map((f) =>
            f.filePath === tempId
              ? { filePath: data.fileName, displayUrl: previewUrl, isUploading: false, isVideo }
              : f
          )
        );
      }).catch((error) => {
        setFiles((prev) => prev.filter((f) => f.filePath !== tempId));
        URL.revokeObjectURL(previewUrl);
        toast({
          title: "Upload Error",
          description: error.message || "Failed to upload file",
          variant: "destructive",
        });
      });
    },
    [uploadMutation, toast, deferUpload, onPendingFiles]
  );

  const handleFiles = useCallback(
    (selectedFiles: FileList | File[]) => {
      const fileArray = Array.from(selectedFiles);
      const currentCount = files.filter((f) => !f.error).length;

      // In single mode, we replace the existing file
      if (mode === "single") {
        if (fileArray.length === 0) return;

        const file = fileArray[0];
        const validationError = validateFile(file);
        if (validationError) {
          toast({
            title: "Validation Error",
            description: validationError,
            variant: "destructive",
          });
          return;
        }

        // Remove existing file reference (Firebase cleanup deferred to form submit)
        const existing = files.find((f) => !f.isUploading && !f.error);
        if (existing) {
          onRemove?.(existing.filePath);
          setFiles([]);
        }

        uploadFile(file);
        return;
      }

      // Multi mode — validate count
      const availableSlots = maxFiles - currentCount;
      if (availableSlots <= 0) {
        toast({
          title: "Limit Reached",
          description: `Maximum of ${maxFiles} files allowed`,
          variant: "destructive",
        });
        return;
      }

      const filesToUpload = fileArray.slice(0, availableSlots);
      if (filesToUpload.length < fileArray.length) {
        toast({
          title: "File Limit",
          description: `Only ${availableSlots} more file(s) can be added. Maximum is ${maxFiles}.`,
          variant: "destructive",
        });
      }

      for (const file of filesToUpload) {
        const validationError = validateFile(file);
        if (validationError) {
          toast({
            title: "Validation Error",
            description: `${file.name}: ${validationError}`,
            variant: "destructive",
          });
          continue;
        }
        uploadFile(file);
      }
    },
    [files, mode, maxFiles, validateFile, uploadFile, deleteMutation, toast]
  );

  const handleRemove = useCallback(
    (filePath: string) => {
      // Remove from local state only — Firebase deletion is deferred to form submit
      setFiles((prev) => prev.filter((f) => f.filePath !== filePath));
      // Clean up pending file if in deferred mode
      if (deferUpload && pendingFilesRef.current.has(filePath)) {
        pendingFilesRef.current.delete(filePath);
        onPendingFiles?.(Array.from(pendingFilesRef.current.values()));
      }
      // Notify parent so it can track removed paths for later Firebase cleanup
      onRemove?.(filePath);
    },
    [onRemove, deferUpload, onPendingFiles]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
      // Reset input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [handleFiles]
  );

  const handleClick = useCallback(() => {
    if (!disabled) fileInputRef.current?.click();
  }, [disabled]);

  const currentCount = files.filter((f) => !f.error).length;
  const showDropZone = mode === "multi" ? currentCount < maxFiles : files.length === 0;
  const previewableFiles = files.filter((f) => f.displayUrl && !f.isUploading && !f.error);

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}

      {/* Thumbnails */}
      {files.length > 0 && (
        <div className={cn("flex flex-wrap gap-3", mode === "single" && "mb-2")}>
          {files.map((file) => (
            <div
              key={file.filePath}
              className="relative group w-24 h-24 rounded-lg border border-border overflow-hidden bg-muted"
            >
              {file.displayUrl ? (
                <div
                  className={cn("w-full h-full", !file.isUploading && !file.error && "cursor-pointer")}
                  onClick={() => {
                    if (file.isUploading || file.error) return;
                    const idx = previewableFiles.findIndex((f) => f.filePath === file.filePath);
                    if (idx >= 0) setPreviewIndex(idx);
                  }}
                >
                  {file.isVideo ? (
                    <video
                      src={file.displayUrl}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={file.displayUrl}
                      alt="Upload preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  {file.isVideo && !file.isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}

              {/* Loading overlay */}
              {file.isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}

              {/* Error overlay */}
              {file.error && (
                <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center border-2 border-destructive rounded-lg">
                  <p className="text-xs text-destructive font-medium px-1 text-center">{file.error}</p>
                </div>
              )}

              {/* Remove button */}
              {!file.isUploading && !disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(file.filePath)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {showDropZone && (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-border/60 hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Upload className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {mode === "single"
              ? files.length > 0
                ? "Change file"
                : "Drop file here or click to upload"
              : "Drop files here or click to upload"}
          </p>
          {mode === "multi" && (
            <p className="text-xs text-muted-foreground">
              {currentCount}/{maxFiles}
            </p>
          )}
        </div>
      )}

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={mode === "multi"}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      <ImageLightbox
        open={previewIndex !== null}
        onClose={() => setPreviewIndex(null)}
        images={previewableFiles.map((f) => f.displayUrl)}
        initialIndex={previewIndex ?? 0}
      />
    </div>
  );
};

export default ImageUpload;
