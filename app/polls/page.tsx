import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

// Mock data for polls
const mockPolls = [
  {
    id: "1",
    title: "Favorite Programming Language",
    description: "What's your favorite programming language?",
    votes: 42,
    createdAt: "2023-05-15",
  },
  {
    id: "2",
    title: "Best Frontend Framework",
    description: "Which frontend framework do you prefer?",
    votes: 38,
    createdAt: "2023-05-20",
  },
  {
    id: "3",
    title: "Database Preference",
    description: "Which database do you use most often?",
    votes: 27,
    createdAt: "2023-05-25",
  },
];

export default function PollsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Polls</h1>
        <Button asChild>
          <Link href="/polls/create">Create New Poll</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockPolls.map((poll) => (
          <Card key={poll.id} className="overflow-hidden">
            <CardHeader>
              <CardTitle className="truncate">{poll.title}</CardTitle>
              <CardDescription>{poll.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>{poll.votes} votes</p>
                <p>Created on {poll.createdAt}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/polls/${poll.id}`}>View Poll</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}