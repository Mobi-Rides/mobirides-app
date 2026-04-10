import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGuideContent } from "@/hooks/useGuideContent";
import { useGuideProgress } from "@/hooks/useGuideProgress";
import { GuideLayout } from "@/components/help/GuideLayout";
import { GuideProgressTracker } from "@/components/help/GuideProgressTracker";
import { toast } from "sonner";

const HelpSection = () => {
  const navigate = useNavigate();
  const { role, section } = useParams<{ role: string; section: string }>();

  const { data: guideContent, isLoading, error } = useGuideContent(
    role as 'renter' | 'host',
    section || ''
  );

  const {
    completedSteps,
    progress,
    isCompleted,
    toggleStep,
    isSaving,
  } = useGuideProgress(guideContent?.id);

  if (!guideContent && !isLoading && !error) {
    return (
      <GuideLayout
        title="Section not found"
        backPath={`/help/${role}`}
        error
        errorMessage="The help section you're looking for doesn't exist."
      >
        <span />
      </GuideLayout>
    );
  }

  return (
    <GuideLayout
      title={guideContent?.title || ''}
      readTime={guideContent?.read_time}
      backPath={`/help/${role}`}
      isLoading={isLoading}
      error={!!error}
      errorMessage="Error loading content"
    >
      <p className="text-muted-foreground">{guideContent?.description}</p>

      <GuideProgressTracker
        steps={guideContent?.steps || []}
        completedSteps={completedSteps}
        progress={progress}
        isCompleted={isCompleted}
        isSaving={isSaving}
        onToggleStep={toggleStep}
      />

      <div className="pt-6">
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center">
            <h3 className="font-medium mb-2">Need more help?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigate('/messages');
                toast.info("Our support team typically responds within 24 hours.");
              }}
            >
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </GuideLayout>
  );
};

export default HelpSection;
