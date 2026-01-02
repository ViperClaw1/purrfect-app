import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';
import Layout from '@/components/Layout';
import ImageUploader from '@/components/ImageUploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Edit2, Grid, Bookmark, Loader2, Save, Crown, Zap, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_premium: boolean;
}

interface Post {
  id: string;
  image_url: string | null;
}

export default function Profile() {
  const { user } = useAuth();
  const { isPremium, loading: premiumLoading, checkSubscription, openCheckout, openCustomerPortal } = usePremium();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    avatar_url: '',
  });

  // Handle subscription success/cancel from URL params
  useEffect(() => {
    const subscriptionStatus = searchParams.get('subscription');
    if (subscriptionStatus === 'success') {
      toast({ title: '🎉 Welcome to Premium!', description: 'Your subscription is now active.' });
      checkSubscription();
    } else if (subscriptionStatus === 'cancelled') {
      toast({ title: 'Subscription cancelled', description: 'No changes were made to your account.' });
    }
  }, [searchParams, toast, checkSubscription]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setProfile(data as Profile);
      setEditForm({
        display_name: data.display_name || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
      });
    }
    setLoading(false);
  };

  const fetchUserPosts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('posts')
      .select('id, image_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setPosts(data);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    
    setIsSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: editForm.display_name || null,
        bio: editForm.bio || null,
        avatar_url: editForm.avatar_url || null,
      })
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Error', description: 'Could not update profile', variant: 'destructive' });
    } else {
      toast({ title: 'Saved! 🎉', description: 'Profile updated successfully' });
      setIsEditing(false);
      fetchProfile();
    }

    setIsSaving(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-coral animate-spin" />
        </div>
      </Layout>
    );
  }

  const displayName = profile?.display_name || profile?.username || 'Anonymous';

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Profile Header */}
        <div className={cn(
          "bg-card rounded-2xl shadow-card border border-border p-6 transition-all duration-300",
          isPremium && "animate-premium-glow border-[hsl(var(--premium))]"
        )}>
          <div className="flex items-start gap-5">
            {/* Avatar */}
            {isEditing ? (
              <div className="w-20 shrink-0">
                <ImageUploader
                  value={editForm.avatar_url}
                  onChange={(url) => setEditForm(f => ({ ...f, avatar_url: url }))}
                  placeholder="Avatar"
                  className="w-20"
                />
              </div>
            ) : (
              <div className={cn(
                "w-20 h-20 rounded-full bg-gradient-to-br from-coral to-accent flex items-center justify-center overflow-hidden shrink-0",
                isPremium && "ring-4 ring-[hsl(var(--premium))] shadow-premium"
              )}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-primary-foreground" />
                )}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-display font-bold truncate">{displayName}</h1>
                  {isPremium && (
                    <span className="inline-flex items-center gap-1 text-xs bg-gradient-premium text-white px-2 py-0.5 rounded-full font-medium">
                      <Crown className="w-3 h-3" />
                      Premium
                    </span>
                  )}
                </div>
                <Button
                  variant={isEditing ? 'coral' : 'outline'}
                  size="sm"
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isEditing ? (
                    <>
                      <Save className="w-4 h-4" />
                      Save
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </>
                  )}
                </Button>
              </div>

              {isEditing ? (
                <div className="space-y-3 mt-4">
                  <div>
                    <Label className="text-xs">Display Name</Label>
                    <Input
                      value={editForm.display_name}
                      onChange={(e) => setEditForm(f => ({ ...f, display_name: e.target.value }))}
                      className="h-10 mt-1"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Bio</Label>
                    <Textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm(f => ({ ...f, bio: e.target.value }))}
                      className="mt-1 min-h-20 resize-none"
                      placeholder="Tell us about yourself and your cats..."
                      maxLength={200}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-3">
                    {profile?.bio || 'No bio yet. Tell us about your cats! 🐱'}
                  </p>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="font-bold">{posts.length}</span>
                      <span className="text-muted-foreground ml-1">posts</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Premium Section */}
        <div className={cn(
          "rounded-2xl p-6 border",
          isPremium 
            ? "bg-gradient-to-br from-[hsl(var(--premium)/0.1)] to-[hsl(var(--premium-light)/0.05)] border-[hsl(var(--premium)/0.3)]" 
            : "bg-card border-border shadow-card"
        )}>
          {isPremium ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full gradient-premium flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">Purrfect Premium</h3>
                  <p className="text-sm text-muted-foreground">You have access to all premium features!</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={openCustomerPortal}>
                <Settings className="w-4 h-4 mr-1" />
                Manage
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <Crown className="w-6 h-6 text-[hsl(var(--premium))]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">Upgrade to Premium</h3>
                  <p className="text-sm text-muted-foreground">$20/month • Cancel anytime</p>
                </div>
              </div>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[hsl(var(--premium))] flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                  <span>Give posts <strong>Lightning Stickers</strong> ⚡</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[hsl(var(--premium))] flex items-center justify-center">
                    <Crown className="w-3 h-3 text-white" />
                  </div>
                  <span><strong>Purple premium shine</strong> on your profile ✨</span>
                </li>
              </ul>

              <Button 
                onClick={openCheckout} 
                className="w-full gradient-premium text-white font-semibold"
                disabled={premiumLoading}
              >
                {premiumLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Posts Grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 border-b border-border">
            <button className="flex items-center gap-2 py-3 border-b-2 border-coral text-coral font-semibold text-sm">
              <Grid className="w-4 h-4" />
              Posts
            </button>
            <button className="flex items-center gap-2 py-3 text-muted-foreground text-sm hover:text-foreground transition-colors">
              <Bookmark className="w-4 h-4" />
              Saved
            </button>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-secondary mx-auto flex items-center justify-center mb-4">
                <Grid className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
              {posts.map((post) => (
                <div key={post.id} className="aspect-square bg-secondary">
                  {post.image_url ? (
                    <img 
                      src={post.image_url} 
                      alt="" 
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-peach/50">
                      <span className="text-2xl">🐱</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
