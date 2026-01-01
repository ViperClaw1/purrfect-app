import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Heart, MessageCircle, UserPlus, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'like' | 'comment';
  created_at: string;
  post_id: string;
  actor: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export default function Activity() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActivity();
    }
  }, [user]);

  const fetchActivity = async () => {
    if (!user) return;
    
    setLoading(true);

    // Fetch likes on user's posts
    const { data: likesData } = await supabase
      .from('likes')
      .select(`
        id,
        created_at,
        post_id,
        user_id,
        posts!inner (user_id),
        profiles:user_id (display_name, username, avatar_url)
      `)
      .eq('posts.user_id', user.id)
      .neq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch comments on user's posts
    const { data: commentsData } = await supabase
      .from('comments')
      .select(`
        id,
        created_at,
        post_id,
        user_id,
        posts!inner (user_id),
        profiles:user_id (display_name, username, avatar_url)
      `)
      .eq('posts.user_id', user.id)
      .neq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const combined: Activity[] = [
      ...(likesData?.map(l => ({
        id: l.id,
        type: 'like' as const,
        created_at: l.created_at,
        post_id: l.post_id,
        actor: l.profiles,
      })) || []),
      ...(commentsData?.map(c => ({
        id: c.id,
        type: 'comment' as const,
        created_at: c.created_at,
        post_id: c.post_id,
        actor: c.profiles,
      })) || []),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setActivities(combined);
    setLoading(false);
  };

  return (
    <Layout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full gradient-coral flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-display font-bold">Activity</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-coral animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-peach mx-auto flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-coral" />
            </div>
            <h2 className="text-lg font-display font-bold mb-2">No activity yet</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              When someone likes or comments on your posts, you'll see it here!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => {
              const actorName = activity.actor?.display_name || activity.actor?.username || 'Someone';
              
              return (
                <div 
                  key={`${activity.type}-${activity.id}`}
                  className="bg-card rounded-xl p-4 border border-border flex items-center gap-4"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-coral to-accent flex items-center justify-center shrink-0 overflow-hidden">
                    {activity.actor?.avatar_url ? (
                      <img src={activity.actor.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary-foreground">
                        {actorName[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{actorName}</span>
                      {activity.type === 'like' ? (
                        <span className="text-muted-foreground"> liked your post</span>
                      ) : (
                        <span className="text-muted-foreground"> commented on your post</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'like' ? 'bg-coral/10 text-coral' : 'bg-accent/20 text-accent-foreground'
                  }`}>
                    {activity.type === 'like' ? (
                      <Heart className="w-4 h-4 fill-current" />
                    ) : (
                      <MessageCircle className="w-4 h-4" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
