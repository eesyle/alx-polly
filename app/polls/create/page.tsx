import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

export default function CreatePollPage() {
  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Create a New Poll</CardTitle>
          <CardDescription>
            Fill out the form below to create your poll
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Poll Title</Label>
            <Input id="title" placeholder="Enter a question for your poll" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" placeholder="Provide more context about your poll" />
          </div>
          
          <div className="space-y-3">
            <Label>Poll Options</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input placeholder="Option 1" />
                <Button variant="outline" size="icon" className="shrink-0">
                  ×
                </Button>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Option 2" />
                <Button variant="outline" size="icon" className="shrink-0">
                  ×
                </Button>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Option 3" />
                <Button variant="outline" size="icon" className="shrink-0">
                  ×
                </Button>
              </div>
            </div>
            <Button variant="outline" type="button" className="mt-2">
              + Add Option
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date (Optional)</Label>
            <Input id="endDate" type="date" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/polls">Cancel</Link>
          </Button>
          <Button>Create Poll</Button>
        </CardFooter>
      </Card>
    </div>
  );
}