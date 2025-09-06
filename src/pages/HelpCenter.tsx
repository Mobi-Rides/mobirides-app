import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Search, Star, Clock, Users, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const HelpCenter = () => {
  const navigate = useNavigate();
  const { role } = useParams<{ role: string }>();
  const [searchQuery, setSearchQuery] = useState("");

  const isHost = role === 'host';
  const isRenter = role === 'renter';

  const renterSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Set up your account and start renting cars',
      icon: Star,
      articles: 5,
      readTime: '15 min',
      popular: true
    },
    {
      id: 'verification',
      title: 'Account Verification',
      description: 'Complete identity and license verification',
      icon: Users,
      articles: 3,
      readTime: '10 min',
      popular: false
    },
    {
      id: 'booking',
      title: 'Finding & Booking Cars',
      description: 'Search, filter, and book the perfect car',
      icon: Car,
      articles: 7,
      readTime: '20 min',
      popular: true
    },
    {
      id: 'pickup-return',
      title: 'Pickup & Return',
      description: 'Handover process and vehicle inspection',
      icon: Clock,
      articles: 4,
      readTime: '12 min',
      popular: false
    }
  ];

  const hostSections = [
    {
      id: 'getting-started',
      title: 'Getting Started as Host',
      description: 'List your first car and start earning',
      icon: Star,
      articles: 6,
      readTime: '20 min',
      popular: true
    },
    {
      id: 'car-listing',
      title: 'Car Listing & Management',
      description: 'Create compelling listings and manage availability',
      icon: Car,
      articles: 8,
      readTime: '25 min',
      popular: true
    },
    {
      id: 'bookings',
      title: 'Managing Bookings',
      description: 'Handle requests, confirmations, and communications',
      icon: BookOpen,
      articles: 5,
      readTime: '15 min',
      popular: false
    },
    {
      id: 'earnings',
      title: 'Earnings & Wallet',
      description: 'Understand pricing, commissions, and payouts',
      icon: Users,
      articles: 4,
      readTime: '10 min',
      popular: false
    }
  ];

  const sections = isRenter ? renterSections : isHost ? hostSections : [];
  const title = isRenter ? 'Renter Help Center' : isHost ? 'Host Help Center' : 'Help Center';
  const subtitle = isRenter 
    ? 'Everything you need to know about renting cars on MobiRides'
    : isHost 
    ? 'Complete guide to hosting and managing your car listings'
    : 'Find answers to your questions';

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card p-4 sticky top-0 z-10 shadow-sm border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col items-center gap-2"
            onClick={() => navigate(`/help/${role}/getting-started`)}
          >
            <Star className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Quick Start</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col items-center gap-2"
            onClick={() => navigate('/profile')}
          >
            <Users className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Contact Support</span>
          </Button>
        </div>

        {/* Help Sections */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Browse by Category</h2>
          <div className="grid gap-4">
            {sections.map((section) => (
              <Card 
                key={section.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/help/${role}/${section.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <section.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{section.title}</CardTitle>
                          {section.popular && (
                            <Badge variant="secondary" className="text-xs">
                              Popular
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm">
                          {section.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{section.articles} articles</span>
                    <span>•</span>
                    <span>{section.readTime} read</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Popular Articles */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Popular Articles</h2>
          <div className="space-y-3">
            {[
              "How to book your first car",
              "Understanding insurance options",
              "Pickup and return process",
              "Safety and security guidelines"
            ].map((article, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-medium">{article}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HelpCenter;