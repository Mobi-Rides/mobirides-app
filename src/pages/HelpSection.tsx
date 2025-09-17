import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useGuideContent } from "@/hooks/useGuideContent";

const HelpSection = () => {
  const navigate = useNavigate();
  const { role, section } = useParams<{ role: string; section: string }>();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const { data: guideContent, isLoading, error } = useGuideContent(
    role as 'renter' | 'host', 
    section || ''
  );

  const toggleStep = (stepIndex: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepIndex) 
        ? prev.filter(i => i !== stepIndex)
        : [...prev, stepIndex]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading help content...</p>
        </div>
      </div>
    );
  }

  if (error || !guideContent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">
            {error ? 'Error loading content' : 'Section not found'}
          </h1>
          <p className="text-muted-foreground">
            {error 
              ? 'Failed to load help content. Please try again.' 
              : 'The help section you\'re looking for doesn\'t exist.'
            }
          </p>
          <Button onClick={() => navigate(`/help/${role}`)}>
            Back to Help Center
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card p-4 sticky top-0 z-10 shadow-sm border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/help/${role}`)}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{guideContent.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{guideContent.read_time}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <div className="space-y-2">
          <p className="text-muted-foreground">{guideContent.description}</p>
          {guideContent.steps && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">
                {completedSteps.length} of {guideContent.steps.length} completed
              </Badge>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {guideContent.steps?.map((step, index: number) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-start gap-3 p-4">
                  <button
                    onClick={() => toggleStep(index)}
                    className="mt-1 text-primary hover:text-primary/80 transition-colors"
                  >
                    <CheckCircle2 
                      className={`h-5 w-5 ${
                        completedSteps.includes(index) 
                          ? 'fill-current' 
                          : 'fill-none'
                      }`} 
                    />
                  </button>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.content}
                    </p>
                    {step.action && (
                      <Button size="sm" variant="outline" className="mt-3">
                        {typeof step.action === 'object' ? step.action.label : step.action}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="pt-6">
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <h3 className="font-medium mb-2">Need more help?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default HelpSection;