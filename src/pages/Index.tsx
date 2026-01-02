import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import PostCard from '@/components/PostCard';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Cat, Sparkles } from 'lucide-react';

interface Post {
  id: string;
  image_url: string | null;
  caption: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_premium?: boolean;
  } | null;
  likes: { user_id: string }[];
  comments: { id: string }[];
  lightning_stickers: { user_id: string }[];
}

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    setLoading(true);
    
    // Fetch posts first
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*, likes(user_id), comments(id)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (postsError || !postsData) {
      setLoading(false);
      return;
    }

    // Get unique user IDs and post IDs
    const userIds = [...new Set(postsData.map(p => p.user_id))];
    const postIds = postsData.map(p => p.id);
    
    // Fetch profiles for those users
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url, is_premium')
      .in('user_id', userIds);

    // Fetch lightning stickers for posts
    const { data: lightningData } = await supabase
      .from('lightning_stickers')
      .select('post_id, user_id')
      .in('post_id', postIds);

    // Create a map of profiles by user_id
    const profilesMap = new Map(
      profilesData?.map(p => [p.user_id, p]) || []
    );

    // Create a map of lightning stickers by post_id
    const lightningMap = new Map<string, { user_id: string }[]>();
    lightningData?.forEach(l => {
      if (!lightningMap.has(l.post_id)) {
        lightningMap.set(l.post_id, []);
      }
      lightningMap.get(l.post_id)!.push({ user_id: l.user_id });
    });

    // Combine posts with profiles and lightning stickers
    const enrichedPosts = postsData.map(post => ({
      ...post,
      profiles: profilesMap.get(post.user_id) || null,
      lightning_stickers: lightningMap.get(post.id) || [],
    }));

    setPosts(enrichedPosts);
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-coral animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="rounded-2xl gradient-coral p-6 shadow-button">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-foreground/20 flex items-center justify-center animate-float">
              <Cat className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-primary-foreground mb-1">
                Welcome to Purrfect! 🐾
              </h1>
              <p className="text-primary-foreground/80 text-sm">
                Share your adorable cat moments with the world
              </p>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-coral animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-peach mx-auto flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-coral" />
            </div>
            <h2 className="text-xl font-display font-bold mb-2">No posts yet!</h2>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Be the first to share your cat's adorable moments. Tap the + button to create a post!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={{
                  ...post,
                  profiles: post.profiles ?? undefined,
                  lightning_stickers: post.lightning_stickers
                }} 
                onLikeChange={fetchPosts} 
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
