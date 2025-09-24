import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto py-16 px-4 md:py-24">
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="space-y-6 md:w-1/2">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Create and share polls <span className="text-primary">effortlessly</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            ALX Polly makes it easy to create, share, and analyze polls. Get instant feedback from your audience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" asChild>
              <Link href="/polls/create">Create a Poll</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/polls">Browse Polls</Link>
            </Button>
           </div>
         </div>
         <div className="md:w-1/2">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="p-6 border rounded-lg bg-card">
               <h3 className="text-xl font-semibold mb-2">Easy Creation</h3>
               <p className="text-muted-foreground">Create polls in seconds with our intuitive interface.</p>
             </div>
             <div className="p-6 border rounded-lg bg-card">
               <h3 className="text-xl font-semibold mb-2">Real-time Results</h3>
               <p className="text-muted-foreground">Watch votes come in and update in real-time.</p>
             </div>
             <div className="p-6 border rounded-lg bg-card">
               <h3 className="text-xl font-semibold mb-2">Share Anywhere</h3>
               <p className="text-muted-foreground">Share your polls on social media or via direct link.</p>
             </div>
             <div className="p-6 border rounded-lg bg-card">
               <h3 className="text-xl font-semibold mb-2">Detailed Analytics</h3>
               <p className="text-muted-foreground">Get insights into your poll results with detailed analytics.</p>
             </div>
            </div>
          </div>
        </div>
      </div>
    );
}



   