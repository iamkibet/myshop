import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useRef, useState } from 'react';

interface ImageUploadProps {
    value?: string;
    onChange: (value: string) => void;
    onFileChange?: (file: File) => void;
    label?: string;
    placeholder?: string;
    accept?: string;
    className?: string;
    error?: string;
}

export function ImageUpload({
    value,
    onChange,
    onFileChange,
    label = 'Image',
    placeholder = 'Enter image URL or upload file',
    accept = 'image/*',
    className = '',
    error,
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(value || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            setIsUploading(true);
            
            // Create preview immediately
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);

            // Call onFileChange if provided
            if (onFileChange) {
                onFileChange(file);
            }
            
            // Reset uploading state after a delay to show processing
            setTimeout(() => {
                setIsUploading(false);
            }, 1000);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleUrlChange = (url: string) => {
        onChange(url);
        setPreview(url);
    };

    const clearImage = () => {
        onChange('');
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (cameraInputRef.current) {
            cameraInputRef.current.value = '';
        }
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    const openCamera = () => {
        cameraInputRef.current?.click();
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <Label>{label}</Label>
            
            {/* Hidden file inputs */}
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileInputChange}
                className="hidden"
            />
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
            />

            {/* URL Input */}
            <div className="space-y-2">
                <Input
                    value={value || ''}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder={placeholder}
                    className="mb-2"
                />
                
                {/* Upload Buttons */}
                <div className="flex space-x-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={openFileDialog}
                        disabled={isUploading}
                        className="flex-1"
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={openCamera}
                        disabled={isUploading}
                        className="flex-1"
                    >
                        <Camera className="mr-2 h-4 w-4" />
                        Camera
                    </Button>
                </div>
            </div>

            {/* Preview */}
            {preview && (
                <div className="relative inline-block">
                    <img
                        src={preview}
                        alt="Preview"
                        className="h-32 w-32 rounded-lg object-cover border"
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={clearImage}
                        className="absolute -top-2 -right-2 h-6 w-6 p-0"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* Loading State */}
            {isUploading && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Processing image...</span>
                </div>
            )}

            {/* Error */}
            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}
        </div>
    );
} 