import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Settings, CheckCircle, Calendar, FileText, Target } from "lucide-react";
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
    <Card className="p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Avatar Section */}
        <div className="relative">
          <Avatar className="h-24 w-24 md:h-32 md:w-32">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-2xl">
              {profile.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          {profile.verificationStatus === 'completed' && (
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1 space-y-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {profile.full_name || 'User'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary" className="capitalize">
                {profile.role}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Member since {format(new Date(profile.created_at), 'MMM yyyy')}
              </span>
            </div>
            {profile.phone_number && (
              <p className="text-sm text-muted-foreground mt-1">
                {profile.phone_number}
              </p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span className="text-xs">Steps</span>
              </div>
              <p className="text-2xl font-bold">
                {completedSteps}/{totalSteps}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-xs">Documents</span>
              </div>
              <p className="text-2xl font-bold">
                {profile.verificationSteps.documents ? '✓' : '0'}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs">Complete</span>
              </div>
              <p className="text-2xl font-bold">
                {profile.verificationProgress}%
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex md:flex-col gap-2 w-full md:w-auto">
          <Button onClick={onEditClick} className="flex-1 md:flex-none gap-2">
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
          <Button variant="outline" className="flex-1 md:flex-none gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
    </Card>
  );
};
