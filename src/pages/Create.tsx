import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Image, Send, X, Cat, Link as LinkIcon } from 'lucide-react';

export default function Create() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return;
    }

    if (!caption.trim() && !imageUrl.trim()) {
      toast({ title: 'Empty post', description: 'Add a caption or image URL', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        caption: caption.trim() || null,
        image_url: imageUrl.trim() || null,
      });

    if (error) {
      toast({ title: 'Error', description: 'Could not create post', variant: 'destructive' });
    } else {
      toast({ title: 'Posted! 🐱', description: 'Your cat moment has been shared!' });
      navigate('/');
    }

    setIsSubmitting(false);
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="bg-card rounded-2xl shadow-card border border-border p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full gradient-coral flex items-center justify-center">
              <Cat className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">Create Post</h1>
              <p className="text-sm text-muted-foreground">Share your cat's moment</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Image URL Preview */}
            {imageUrl && (
              <div className="relative rounded-xl overflow-hidden bg-secondary aspect-square">
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={() => setImageUrl('')}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  className="absolute top-2 right-2"
                  onClick={() => setImageUrl('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Image URL Input */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-sm font-semibold flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Image URL (optional)
              </Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/cute-cat.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="h-12 rounded-xl bg-secondary/50"
              />
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="caption" className="text-sm font-semibold">Caption</Label>
              <Textarea
                id="caption"
                placeholder="What's your cat up to? 🐱"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="min-h-32 rounded-xl bg-secondary/50 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {caption.length}/500
              </p>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="coral"
              size="lg"
              className="w-full"
              disabled={isSubmitting || (!caption.trim() && !imageUrl.trim())}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Share Post
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
