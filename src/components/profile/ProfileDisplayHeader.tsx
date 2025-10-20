import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Upload, Shield } from "lucide-react";
import { FullProfileData } from "@/hooks/useFullProfile";
import { format } from "date-fns";

interface ProfileDisplayHeaderProps {
  profile: FullProfileData;
  onEditClick: () => void;
}

export const ProfileDisplayHeader = ({ profile, onEditClick }: ProfileDisplayHeaderProps) => {
  const completedSteps = Object.values(profile.verificationSteps).filter(Boolean).length;
  const totalSteps = Object.keys(profile.verificationSteps).length;

  return (
    <div className="space-y-4">
      {/* Trust & Safety Badge - Desktop Only */}
      <div className="hidden md:flex justify-end">
        <Badge variant="outline" className="gap-2 px-4 py-2">
          <Shield className="h-4 w-4" />
          Trust & Safety Profile
        </Badge>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback>{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{profile.full_name}</h2>
            <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
          </div>
        </div>
        {profile.verificationStatus === 'completed' && (
          <Badge className="bg-green-500 gap-1">
            <CheckCircle className="h-3 w-3" />
            Verified
          </Badge>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-xl">
                {profile.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {profile.verificationStatus === 'completed' && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.full_name || 'User'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground capitalize">{profile.role}</span>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                Member since {format(new Date(profile.created_at), 'MMM yyyy')}
              </span>
              {profile.phone_number && (
                <>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">
                    Phone: {profile.phone_number}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {profile.verificationStatus === 'completed' && (
            <Badge className="bg-green-500 gap-1 px-3 py-1">
              <CheckCircle className="h-4 w-4" />
              Verified
            </Badge>
          )}
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Avatar
          </Button>
        </div>
      </div>

      {/* Stats Cards - Desktop */}
      <div className="hidden md:grid grid-cols-3 gap-4">
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Verification Steps</p>
          <p className="text-3xl font-bold">{completedSteps}/{totalSteps}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Documents</p>
          <p className="text-3xl font-bold">
            {Object.values(profile.verificationSteps).filter(Boolean).length}
          </p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Completion</p>
          <p className="text-3xl font-bold">{profile.verificationProgress}%</p>
        </div>
      </div>

      {/* Stats Row - Mobile */}
      <div className="md:hidden bg-muted/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">{profile.full_name || 'User'}</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span>Member since {format(new Date(profile.created_at), 'MMM yyyy')}</span>
          {profile.phone_number && (
            <>
              <span>•</span>
              <span>Phone: {profile.phone_number}</span>
            </>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Verification Steps</p>
            <p className="text-xl font-bold">{completedSteps}/{totalSteps}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Documents</p>
            <p className="text-xl font-bold">
              {Object.values(profile.verificationSteps).filter(Boolean).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Completion</p>
            <p className="text-xl font-bold">{profile.verificationProgress}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};
