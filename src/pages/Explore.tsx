import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Post {
  id: string;
  image_url: string | null;
  caption: string | null;
}

export default function Explore() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('posts')
      .select('id, image_url, caption')
      .order('created_at', { ascending: false })
      .limit(30);

    if (data) {
      setPosts(data);
    }
    setLoading(false);
  };

  const filteredPosts = posts.filter(post => 
    !searchQuery || post.caption?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search cats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-xl bg-card border-border"
          />
        </div>

        {/* Trending Section */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-coral" />
            <h2 className="font-display font-bold">Trending</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['#CuteKittens', '#CatNap', '#WhiskersWednesday', '#AdoptDontShop', '#CatMom'].map(tag => (
              <button
                key={tag}
                className="px-3 py-1.5 rounded-full bg-peach text-coral-dark text-sm font-medium hover:bg-peach/80 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-coral animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
            {filteredPosts.map((post) => (
              <div key={post.id} className="aspect-square bg-secondary group cursor-pointer overflow-hidden">
                {post.image_url ? (
                  <img 
                    src={post.image_url} 
                    alt="" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
    </Layout>
  );
}
