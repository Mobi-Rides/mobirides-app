
import { useState } from "react";
import { Key, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/utils/toast-utils";

interface KeyTransferStepProps {
  handoverSessionId: string;
  otherUserName: string;
  isHost: boolean;
  onStepComplete: () => void;
}

export const KeyTransferStep = ({
  handoverSessionId,
  otherUserName,
  isHost,
  onStepComplete
}: KeyTransferStepProps) => {
  const [keyTransferred, setKeyTransferred] = useState(false);
  const [keyReceived, setKeyReceived] = useState(false);
  const [sparesConfirmed, setSparesConfirmed] = useState(false);

  const canComplete = keyTransferred && keyReceived && sparesConfirmed;

  const handleComplete = () => {
    if (canComplete) {
      onStepComplete();
      toast.success("Key transfer completed successfully");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Key Transfer
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isHost 
            ? `Transfer vehicle keys to ${otherUserName}` 
            : `Receive vehicle keys from ${otherUserName}`
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Transfer Checklist */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="key-transferred"
              checked={keyTransferred}
              onCheckedChange={(checked) => setKeyTransferred(checked as boolean)}
            />
            <label htmlFor="key-transferred" className="text-sm font-medium">
              {isHost 
                ? `I have handed over the main vehicle key to ${otherUserName}`
                : `I have received the main vehicle key from ${otherUserName}`
              }
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="key-received"
              checked={keyReceived}
              onCheckedChange={(checked) => setKeyReceived(checked as boolean)}
            />
            <label htmlFor="key-received" className="text-sm font-medium">
              {isHost 
                ? `${otherUserName} has confirmed receipt of the vehicle key`
                : `I confirm that the vehicle key is working properly`
              }
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="spares-confirmed"
              checked={sparesConfirmed}
              onCheckedChange={(checked) => setSparesConfirmed(checked as boolean)}
            />
            <label htmlFor="spares-confirmed" className="text-sm font-medium">
              All spare keys and remote controls have been accounted for
            </label>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Key Transfer Instructions</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ensure all keys and remotes are functioning properly</li>
            <li>• Test remote locking/unlocking if applicable</li>
            <li>• Verify spare key locations if any</li>
            <li>• Check if any keys have special instructions</li>
          </ul>
        </div>

        {/* Key Status Display */}
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="text-sm font-medium">Main Vehicle Key</span>
            <div className="flex items-center gap-2">
              {keyTransferred && keyReceived ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">Transferred</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Pending</span>
              )}
            </div>
          </div>
        </div>

        {/* Complete Button */}
        <Button 
          onClick={handleComplete} 
          disabled={!canComplete}
          className="w-full"
        >
          Complete Key Transfer
        </Button>

        {!canComplete && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              Please complete all key transfer confirmations to proceed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
