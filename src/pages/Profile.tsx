import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import ImageUploader from '@/components/ImageUploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Edit2, Grid, Bookmark, Loader2, Save } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface Post {
  id: string;
  image_url: string | null;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
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
      setProfile(data);
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
        <div className="bg-card rounded-2xl shadow-card border border-border p-6">
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
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-coral to-accent flex items-center justify-center overflow-hidden shrink-0">
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
                <h1 className="text-xl font-display font-bold truncate">{displayName}</h1>
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
