import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Search, Star, Clock, Users, Car, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { useGuides, usePopularGuides, useSearchGuides } from "@/hooks/useGuides";

const HelpCenter = () => {
  const navigate = useNavigate();
  const { role } = useParams<{ role: string }>();
  const [searchQuery, setSearchQuery] = useState("");

  const isHost = role === 'host';
  const isRenter = role === 'renter';
  
  // Fetch guides from database
  const { data: guides, isLoading: guidesLoading, error: guidesError } = useGuides(role as 'renter' | 'host');
  const { data: popularGuides, isLoading: popularLoading } = usePopularGuides();
  const { data: searchResults, isLoading: searchLoading } = useSearchGuides(searchQuery, role as 'renter' | 'host');

  // Icon mapping for sections
  const getIconForSection = (section: string) => {
    const iconMap: Record<string, any> = {
      'getting-started': Star,
      'verification': Users,
      'booking': Car,
      'pickup-return': Clock,
      'car-listing': Car,
      'bookings': BookOpen,
      'earnings': Users,
    };
    return iconMap[section] || BookOpen;
  };

  // Transform database guides to match UI expectations
  const sections = useMemo(() => {
    if (!guides) return [];
    
    return guides.map(guide => ({
      id: guide.section,
      title: guide.title,
      description: guide.description,
      icon: getIconForSection(guide.section),
      articles: 1, // Could be enhanced to count actual articles
      readTime: guide.read_time,
      popular: guide.is_popular
    }));
  }, [guides]);

  const title = isRenter ? 'Renter Help Center' : isHost ? 'Host Help Center' : 'Help Center';
  const subtitle = isRenter 
    ? 'Everything you need to know about renting cars on MobiRides'
    : isHost 
    ? 'Complete guide to hosting and managing your car listings'
    : 'Find answers to your questions';

  // Use search results when searching, otherwise use all sections
  const displayedSections = searchQuery.trim() ? (searchResults || []).map(guide => ({
    id: guide.section,
    title: guide.title,
    description: guide.description,
    icon: getIconForSection(guide.section),
    articles: 1,
    readTime: guide.read_time,
    popular: guide.is_popular
  })) : sections;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card p-4 sticky top-0 z-10 shadow-sm border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
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
          <h2 className="text-xl font-semibold">
            {searchQuery.trim() ? 'Search Results' : 'Browse by Category'}
          </h2>
          
          {guidesLoading || searchLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : guidesError ? (
            <div className="text-center py-8 text-muted-foreground">
              Failed to load help content. Please try again.
            </div>
          ) : displayedSections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery.trim() ? 'No results found.' : 'No help sections available.'}
            </div>
          ) : (
            <div className="grid gap-4">
              {displayedSections.map((section) => (
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
          )}
        </div>

        {/* Popular Articles */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Popular Articles</h2>
          
          {popularLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {(popularGuides || []).map((guide) => (
                <Card 
                  key={guide.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/help/${role}/${guide.section}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="font-medium">{guide.title}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!popularGuides || popularGuides.length === 0) && (
                <div className="text-center py-4 text-muted-foreground">
                  No popular articles available.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HelpCenter;