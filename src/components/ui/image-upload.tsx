
import { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string | null>;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (value) {
      setPreview(value);
    }
  }, [value]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    const fileType = file.type;

    // Check if file is an image
    if (!fileType.startsWith("image/")) {
      return;
    }

    setIsUploading(true);

    try {
      // Create a temporary preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);

      // Upload the image
      const uploadedUrl = await onUpload(file);
      if (uploadedUrl) {
        onChange(uploadedUrl);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    setPreview(null);
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {preview ? (
        <div className="relative mb-4">
          <img
            src={preview}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-full"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 rounded-full w-6 h-6"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center mb-4">
          <label
            htmlFor="image-upload"
            className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            <Upload className="h-6 w-6 text-gray-400" />
            <span className="text-xs text-gray-500 mt-2">Upload Logo</span>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={isUploading}
            />
          </label>
          {isUploading && (
            <span className="text-xs text-gray-500 mt-2">Uploading...</span>
          )}
        </div>
      )}
    </div>
  );
}
