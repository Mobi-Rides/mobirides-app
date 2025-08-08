import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, MessageCircle } from 'lucide-react';
import { ChatMigrationService } from '@/services/chatMigrationService';
import { useAuth } from '@/hooks/useAuth';

interface MigrationStatus {
  isMigrated: boolean;
  unmigratedCount: number;
  shouldUseLegacy: boolean;
  recommendation: string;
}

export const MigrationStatusBanner = () => {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkStatus = async () => {
      try {
        const migrationStatus = await ChatMigrationService.getMigrationStatus(user.id);
        setStatus(migrationStatus);
      } catch (error) {
        console.error('Error checking migration status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [user]);

  const handleMigrate = async () => {
    if (!user) return;

    setIsMigrating(true);
    try {
      const success = await ChatMigrationService.triggerUserMigration(user.id);
      if (success) {
        // Refresh status
        const newStatus = await ChatMigrationService.getMigrationStatus(user.id);
        setStatus(newStatus);
      }
    } catch (error) {
      console.error('Error during migration:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  if (isLoading || !status || status.isMigrated) {
    return null;
  }

  if (!status.shouldUseLegacy) {
    return null;
  }

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Message System Update Available</AlertTitle>
      <AlertDescription className="text-amber-700">
        <div className="space-y-2">
          <p>{status.recommendation}</p>
          <div className="flex gap-2 items-center">
            <Button
              onClick={handleMigrate}
              disabled={isMigrating}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isMigrating ? (
                <>
                  <MessageCircle className="mr-2 h-4 w-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Migrate Now
                </>
              )}
            </Button>
            <span className="text-sm text-amber-600">
              This will move your {status.unmigratedCount} messages to the new system.
            </span>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};