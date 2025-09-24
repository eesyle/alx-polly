'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      // In a real app, you would fetch additional profile data from Supabase here
      // For now, we'll use placeholder data
      setName(user.user_metadata?.name || 'User');
      setBio(user.user_metadata?.bio || '');
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // In a real app, you would update the user's profile in Supabase here
      // For example:
      // await supabase.from('profiles').upsert({ id: user.id, name, bio });
      
      setMessage({ text: 'Profile updated successfully', type: 'success' });
    } catch (error: any) {
      setMessage({ text: error.message || 'Failed to update profile', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-10 text-center">
        <Card>
          <CardContent className="pt-6">
            <p>You need to be logged in to view this page.</p>
            <Button onClick={() => router.push('/auth/login')} className="mt-4">Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="grid gap-8 md:grid-cols-[1fr_3fr]">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src="/placeholder-avatar.jpg" alt={name} />
              <AvatarFallback>{name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-lg font-medium">{name}</h3>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
            <Button variant="outline" className="w-full">Change Avatar</Button>
            <Button variant="destructive" className="w-full" onClick={handleSignOut}>Sign Out</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <div className={`p-3 text-sm text-white rounded ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                {message.text}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                disabled 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input 
                id="bio" 
                placeholder="Tell us about yourself" 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveChanges} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}