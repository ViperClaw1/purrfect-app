import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';
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
      is_premium?: boolean;
    };
    likes: {
      user_id: string;
    }[];
    comments: {
      id: string;
    }[];
    lightning_stickers?: {
      user_id: string;
    }[];
  };
  onLikeChange?: () => void;
}
export default function PostCard({
  post,
  onLikeChange
}: PostCardProps) {
  const {
    user
  } = useAuth();
  const {
    isPremium
  } = usePremium();
  const {
    toast
  } = useToast();
  const [isLiked, setIsLiked] = useState(post.likes?.some(like => like.user_id === user?.id) ?? false);
  const [likeCount, setLikeCount] = useState(post.likes?.length ?? 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasLightning, setHasLightning] = useState(post.lightning_stickers?.some(sticker => sticker.user_id === user?.id) ?? false);
  const [lightningCount, setLightningCount] = useState(post.lightning_stickers?.length ?? 0);
  const [isLightningAnimating, setIsLightningAnimating] = useState(false);
  const handleLike = async () => {
    if (!user) return;
    setIsAnimating(true);
    if (isLiked) {
      setIsLiked(false);
      setLikeCount(prev => prev - 1);
      const {
        error
      } = await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      if (error) {
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        toast({
          title: 'Error',
          description: 'Could not unlike post',
          variant: 'destructive'
        });
      }
    } else {
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
      const {
        error
      } = await supabase.from('likes').insert({
        post_id: post.id,
        user_id: user.id
      });
      if (error) {
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
        toast({
          title: 'Error',
          description: 'Could not like post',
          variant: 'destructive'
        });
      }
    }
    setTimeout(() => setIsAnimating(false), 300);
    onLikeChange?.();
  };
  const handleLightning = async () => {
    if (!user) return;
    if (!isPremium) {
      toast({
        title: '⚡ Premium Feature',
        description: 'Lightning stickers are exclusive to Purrfect Premium members!'
      });
      return;
    }
    setIsLightningAnimating(true);
    if (hasLightning) {
      setHasLightning(false);
      setLightningCount(prev => prev - 1);
      const {
        error
      } = await supabase.from('lightning_stickers').delete().eq('post_id', post.id).eq('user_id', user.id);
      if (error) {
        setHasLightning(true);
        setLightningCount(prev => prev + 1);
        toast({
          title: 'Error',
          description: 'Could not remove lightning',
          variant: 'destructive'
        });
      }
    } else {
      setHasLightning(true);
      setLightningCount(prev => prev + 1);
      const {
        error
      } = await supabase.from('lightning_stickers').insert({
        post_id: post.id,
        user_id: user.id
      });
      if (error) {
        setHasLightning(false);
        setLightningCount(prev => prev - 1);
        toast({
          title: 'Error',
          description: 'Could not add lightning',
          variant: 'destructive'
        });
      }
    }
    setTimeout(() => setIsLightningAnimating(false), 300);
    onLikeChange?.();
  };
  const profile = post.profiles;
  const displayName = profile?.display_name || profile?.username || 'Anonymous';
  const avatarUrl = profile?.avatar_url;
  const isProfilePremium = profile?.is_premium ?? false;
  return <article className="bg-card rounded-2xl shadow-card border border-border overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-full bg-gradient-to-br from-coral to-accent flex items-center justify-center overflow-hidden", isProfilePremium && "animate-premium-glow ring-2 ring-[hsl(var(--premium))]")}>
            {avatarUrl ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-primary-foreground">
                {displayName[0]?.toUpperCase()}
              </span>}
          </div>
          <div className="flex items-center gap-2">
            <div>
              <p className="font-semibold text-sm">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true
              })}
              </p>
            </div>
            {isProfilePremium && <span className="text-xs bg-[hsl(var(--premium))] text-white px-2 rounded-full font-medium py-[4px]">
                ✨ Premium
              </span>}
          </div>
        </div>
        <Button variant="ghost" size="icon-sm">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Image */}
      {post.image_url && <div className="aspect-square bg-secondary relative overflow-hidden">
          <img src={post.image_url} alt="Post" className="w-full h-full object-cover" loading="lazy" />
          {/* Lightning stickers overlay */}
          {lightningCount > 0 && <div className="absolute top-3 right-3 bg-yellow-400/90 backdrop-blur-sm text-black px-2 py-1 rounded-full flex items-center gap-1 text-sm font-bold">
              <Zap className="w-4 h-4 fill-current" />
              {lightningCount}
            </div>}
        </div>}

      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="icon" size="icon" onClick={handleLike} className={cn('hover:scale-110 transition-transform', isAnimating && 'animate-heart-pop')}>
              <Heart className={cn('w-6 h-6 transition-colors', isLiked ? 'fill-coral text-coral' : 'text-foreground')} />
            </Button>
            <Button variant="icon" size="icon">
              <MessageCircle className="w-6 h-6" />
            </Button>
            <Button variant="icon" size="icon">
              <Share2 className="w-6 h-6" />
            </Button>
            {/* Lightning sticker button - premium feature */}
            <Button variant="icon" size="icon" onClick={handleLightning} className={cn('hover:scale-110 transition-transform', isLightningAnimating && 'animate-lightning')}>
              <Zap className={cn('w-6 h-6 transition-colors', hasLightning ? 'fill-yellow-400 text-yellow-400' : isPremium ? 'text-foreground' : 'text-muted-foreground')} />
            </Button>
          </div>
          <Button variant="icon" size="icon">
            <Bookmark className="w-6 h-6" />
          </Button>
        </div>

        {/* Likes count */}
        {likeCount > 0 && <p className="font-semibold text-sm">
            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
          </p>}

        {/* Caption */}
        {post.caption && <p className="text-sm">
            <span className="font-semibold mr-2">{displayName}</span>
            {post.caption}
          </p>}

        {/* Comments count */}
        {post.comments?.length > 0 && <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            View all {post.comments.length} comments
          </button>}
      </div>
    </article>;
}