import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  aspectRatio?: 'square' | 'wide';
  placeholder?: string;
}

export default function ImageUploader({
  value,
  onChange,
  onRemove,
  className,
  aspectRatio = 'square',
  placeholder = 'Upload a photo',
}: ImageUploaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = async (file: File) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('cat-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cat-images')
        .getPublicUrl(fileName);

      onChange(publicUrl);
      toast({ title: 'Uploaded! 📸', description: 'Your photo is ready' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleRemove = () => {
    onChange('');
    onRemove?.();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <div className={cn(
          'relative rounded-xl overflow-hidden bg-secondary',
          aspectRatio === 'square' ? 'aspect-square' : 'aspect-video'
        )}>
          <img
            src={value}
            alt="Upload preview"
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
            aspectRatio === 'square' ? 'aspect-square' : 'aspect-video',
            dragOver
              ? 'border-coral bg-peach/50 scale-[1.02]'
              : 'border-border hover:border-coral/50 hover:bg-secondary/50',
            'flex flex-col items-center justify-center gap-3'
          )}
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-coral animate-spin" />
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-peach flex items-center justify-center">
                <ImageIcon className="w-7 h-7 text-coral" />
              </div>
              <div className="text-center px-4">
                <p className="font-semibold text-sm">{placeholder}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Drag & drop or click to browse
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
