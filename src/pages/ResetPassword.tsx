import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await updatePassword(password);
    setIsSubmitting(false);

    if (error) {
      toast({ title: 'Could not update password', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Password updated', description: 'You are now signed in with your new password.' });
    navigate('/');
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 paw-pattern">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-soft p-8 border border-border animate-fade-in">
        <h1 className="text-2xl font-display font-bold mb-4">Set a new password</h1>
        {session ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-semibold">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                maxLength={100}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl bg-secondary/50 border-border focus:bg-background"
              />
            </div>
            <Button type="submit" variant="coral" size="lg" className="w-full" disabled={isSubmitting}>
              Update password
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            This reset link is invalid or has expired.{' '}
            <Link to="/auth" className="text-primary font-semibold hover:underline">Request a new one</Link>
          </p>
        )}
      </div>
    </div>
  );
}
