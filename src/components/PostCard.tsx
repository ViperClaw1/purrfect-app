import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PostCardProps {
  post: {
    id: string;
    image_url: string | null;
    caption: string | null;
    created_at: string;
    user_id: string;
    profiles?: {
      display_name: string | null;
      username: string | null;
      avatar_url: string | null;
    };
    likes: { user_id: string }[];
    comments: { id: string }[];
  };
  onLikeChange?: () => void;
}

export default function PostCard({ post, onLikeChange }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(
    post.likes?.some(like => like.user_id === user?.id) ?? false
  );
  const [likeCount, setLikeCount] = useState(post.likes?.length ?? 0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLike = async () => {
    if (!user) return;

    setIsAnimating(true);
    
    if (isLiked) {
      setIsLiked(false);
      setLikeCount(prev => prev - 1);
      
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id);

      if (error) {
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        toast({ title: 'Error', description: 'Could not unlike post', variant: 'destructive' });
      }
    } else {
      setIsLiked(true);
      setLikeCount(prev => prev + 1);

      const { error } = await supabase
        .from('likes')
        .insert({ post_id: post.id, user_id: user.id });

      if (error) {
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
        toast({ title: 'Error', description: 'Could not like post', variant: 'destructive' });
      }
    }

    setTimeout(() => setIsAnimating(false), 300);
    onLikeChange?.();
  };

  const profile = post.profiles;
  const displayName = profile?.display_name || profile?.username || 'Anonymous';
  const avatarUrl = profile?.avatar_url;

  return (
    <article className="bg-card rounded-2xl shadow-card border border-border overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-accent flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-primary-foreground">
                {displayName[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="aspect-square bg-secondary relative overflow-hidden">
          <img
            src={post.image_url}
            alt="Post"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button 
              variant="icon" 
              size="icon" 
              onClick={handleLike}
              className={cn(
                'hover:scale-110 transition-transform',
                isAnimating && 'animate-heart-pop'
              )}
            >
              <Heart 
                className={cn(
                  'w-6 h-6 transition-colors',
                  isLiked ? 'fill-coral text-coral' : 'text-foreground'
                )} 
              />
            </Button>
            <Button variant="icon" size="icon">
              <MessageCircle className="w-6 h-6" />
            </Button>
            <Button variant="icon" size="icon">
              <Share2 className="w-6 h-6" />
            </Button>
          </div>
          <Button variant="icon" size="icon">
            <Bookmark className="w-6 h-6" />
          </Button>
        </div>

        {/* Likes count */}
        {likeCount > 0 && (
          <p className="font-semibold text-sm">
            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
          </p>
        )}

        {/* Caption */}
        {post.caption && (
          <p className="text-sm">
            <span className="font-semibold mr-2">{displayName}</span>
            {post.caption}
          </p>
        )}

        {/* Comments count */}
        {post.comments?.length > 0 && (
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            View all {post.comments.length} comments
          </button>
        )}
      </div>
    </article>
  );
}
