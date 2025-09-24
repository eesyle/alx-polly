'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

export function Navigation() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-lg">
            ALX Polly
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/polls" className="text-muted-foreground hover:text-foreground transition-colors">
              Polls
            </Link>
            {user && (
              <Link href="/polls/create" className="text-muted-foreground hover:text-foreground transition-colors">
                Create Poll
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Button variant="outline" asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Register</Link>
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/auth/profile" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user.email?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">Profile</span>
                </Link>
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}