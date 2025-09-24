import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Mock data for a single poll
const mockPoll = {
  id: "1",
  title: "Favorite Programming Language",
  description: "What's your favorite programming language?",
  options: [
    { id: "1", text: "JavaScript", votes: 15 },
    { id: "2", text: "Python", votes: 12 },
    { id: "3", text: "TypeScript", votes: 8 },
    { id: "4", text: "Java", votes: 5 },
    { id: "5", text: "C#", votes: 2 },
  ],
  totalVotes: 42,
  createdAt: "2023-05-15",
  createdBy: "John Doe",
};

export default function PollDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  // In a real app, you would fetch the poll data based on the ID
  const poll = mockPoll;

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          <CardDescription>{poll.description}</CardDescription>
          <div className="text-sm text-muted-foreground mt-2">
            Created by {poll.createdBy} on {poll.createdAt}
          </div>
        </CardHeader>
        <CardContent>
          <form>
            <RadioGroup defaultValue="">
              {poll.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2 mb-4 p-3 border rounded-md hover:bg-muted/50">
                  <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                  <Label htmlFor={`option-${option.id}`} className="flex-1">
                    {option.text}
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {option.votes} votes ({Math.round((option.votes / poll.totalVotes) * 100)}%)
                  </span>
                </div>
              ))}
            </RadioGroup>
          </form>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Results</h3>
            {poll.options.map((option) => (
              <div key={`result-${option.id}`} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>{option.text}</span>
                  <span>{Math.round((option.votes / poll.totalVotes) * 100)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${(option.votes / poll.totalVotes) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Share Poll</Button>
          <Button>Vote</Button>
        </CardFooter>
      </Card>
    </div>
  );
}