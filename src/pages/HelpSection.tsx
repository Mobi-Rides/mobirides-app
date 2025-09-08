import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const HelpSection = () => {
  const navigate = useNavigate();
  const { role, section } = useParams<{ role: string; section: string }>();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStep = (stepIndex: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepIndex) 
        ? prev.filter(i => i !== stepIndex)
        : [...prev, stepIndex]
    );
  };

  const renterContent: Record<string, any> = {
    'getting-started': {
      title: 'Getting Started as a Renter',
      description: 'Complete guide to setting up your account and making your first booking',
      readTime: '15 min',
      steps: [
        {
          title: 'Create Your Account',
          content: 'Sign up with your email and create a secure password. You\'ll receive a confirmation email to verify your account.',
          action: 'Go to Sign Up'
        },
        {
          title: 'Complete Your Profile',
          content: 'Add your personal information, profile photo, and contact details. This helps hosts trust you and improves your booking success rate.',
          action: 'Edit Profile'
        },
        {
          title: 'Verify Your Identity',
          content: 'Upload a government-issued ID and take a selfie for verification. This is required before you can make bookings.',
          action: 'Start Verification'
        },
        {
          title: 'Add Your Driver\'s License',
          content: 'Upload photos of your valid driver\'s license. Make sure it\'s not expired and clearly visible.',
          action: 'Upload License'
        },
        {
          title: 'Search for Cars',
          content: 'Use our search filters to find cars by location, dates, price range, and vehicle type. Save your favorites for later.',
          action: 'Browse Cars'
        }
      ]
    },
    'verification': {
      title: 'Account Verification',
      description: 'Step-by-step guide to complete identity and license verification',
      readTime: '10 min',
      steps: [
        {
          title: 'Identity Verification Process',
          content: 'We use secure verification to ensure safety for all users. The process typically takes 2-4 hours to review.',
          action: null
        },
        {
          title: 'Required Documents',
          content: 'You\'ll need: Government-issued photo ID (passport, national ID, or driver\'s license) and a clear selfie photo.',
          action: null
        },
        {
          title: 'Upload Your Documents',
          content: 'Take clear photos of your ID - ensure all text is readable and there\'s no glare. Your selfie should clearly show your face.',
          action: 'Start Upload'
        }
      ]
    },
    'booking': {
      title: 'Finding & Booking Cars',
      description: 'Learn how to search, filter, and successfully book vehicles',
      readTime: '20 min',
      steps: [
        {
          title: 'Using Search Filters',
          content: 'Filter by location, pickup/return dates, price range, transmission type, and special features like GPS or child seats.',
          action: null
        },
        {
          title: 'Reading Car Listings',
          content: 'Check photos, description, host reviews, availability calendar, and included features. Pay attention to pickup location and house rules.',
          action: null
        },
        {
          title: 'Making a Booking Request',
          content: 'Select your dates and times, review the total cost including insurance, and send a booking request with a personal message to the host.',
          action: null
        },
        {
          title: 'Waiting for Approval',
          content: 'Hosts have 24 hours to respond. You\'ll receive notifications via email and in-app when they accept or decline.',
          action: null
        },
        {
          title: 'Payment and Confirmation',
          content: 'Once approved, complete payment securely. You\'ll receive booking confirmation with pickup details and host contact information.',
          action: null
        }
      ]
    }
  };

  const hostContent: Record<string, any> = {
    'getting-started': {
      title: 'Getting Started as a Host',
      description: 'Complete guide to listing your car and earning money',
      readTime: '20 min',
      steps: [
        {
          title: 'Complete Host Profile',
          content: 'Add a professional profile photo, bio, and contact information. This builds trust with potential renters.',
          action: 'Edit Profile'
        },
        {
          title: 'List Your First Car',
          content: 'Upload high-quality photos, write a detailed description, set your pricing, and specify pickup location.',
          action: 'Add Car'
        },
        {
          title: 'Set Availability & Rules',
          content: 'Configure your calendar, set house rules, minimum rental periods, and advance notice requirements.',
          action: null
        },
        {
          title: 'Understand Pricing',
          content: 'Learn about MobiRides\' 15% commission, how to set competitive prices, and when you get paid.',
          action: 'View Earnings'
        }
      ]
    }
  };

  const content = role === 'renter' ? renterContent : hostContent;
  const sectionData = content[section || ''];

  if (!sectionData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Section not found</h1>
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
            <h1 className="text-lg font-semibold">{sectionData.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{sectionData.readTime}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <div className="space-y-2">
          <p className="text-muted-foreground">{sectionData.description}</p>
          {sectionData.steps && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">
                {completedSteps.length} of {sectionData.steps.length} completed
              </Badge>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {sectionData.steps?.map((step: any, index: number) => (
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
                        {step.action}
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