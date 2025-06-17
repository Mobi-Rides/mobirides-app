import { useState } from "react";
import { Plus, Trash2, AlertTriangle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { uploadHandoverPhoto, DamageReport } from "@/services/enhancedHandoverService";
import { toast } from "@/utils/toast-utils";

interface DamageDocumentationStepProps {
  handoverSessionId: string;
  onDamageReportsUpdate: (reports: DamageReport[]) => void;
  onStepComplete: () => void;
  initialReports?: DamageReport[];
}

export const DamageDocumentationStep = ({
  handoverSessionId,
  onDamageReportsUpdate,
  onStepComplete,
  initialReports = []
}: DamageDocumentationStepProps) => {
  const [damageReports, setDamageReports] = useState<DamageReport[]>(initialReports);
  const [isAddingDamage, setIsAddingDamage] = useState(false);
  const [newDamage, setNewDamage] = useState({
    location: "",
    severity: "minor" as "minor" | "moderate" | "major",
    description: "",
    photos: [] as string[]
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleAddDamagePhoto = async (file: File) => {
    setIsUploading(true);
    try {
      const photoUrl = await uploadHandoverPhoto(file, handoverSessionId, 'damage_specific');
      if (photoUrl) {
        setNewDamage(prev => ({
          ...prev,
          photos: [...prev.photos, photoUrl]
        }));
        toast.success("Damage photo uploaded");
      }
    } catch (error) {
      toast.error("Failed to upload damage photo");
    } finally {
      setIsUploading(false);
    }
  };

  const saveDamageReport = () => {
    if (!newDamage.location || !newDamage.description) {
      toast.error("Please fill in location and description");
      return;
    }

    const damageReport: DamageReport = {
      id: `damage-${Date.now()}`,
      location: newDamage.location,
      severity: newDamage.severity,
      description: newDamage.description,
      photos: newDamage.photos,
      timestamp: new Date().toISOString()
    };

    const updatedReports = [...damageReports, damageReport];
    setDamageReports(updatedReports);
    onDamageReportsUpdate(updatedReports);

    // Reset form
    setNewDamage({
      location: "",
      severity: "minor",
      description: "",
      photos: []
    });
    setIsAddingDamage(false);
    toast.success("Damage report added");
  };

  const removeDamageReport = (reportId: string) => {
    const updatedReports = damageReports.filter(report => report.id !== reportId);
    setDamageReports(updatedReports);
    onDamageReportsUpdate(updatedReports);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor': return 'bg-yellow-100 text-yellow-800';
      case 'moderate': return 'bg-orange-100 text-orange-800';
      case 'major': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Damage Documentation
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Document any existing damage to the vehicle. If no damage is present, you can skip this step.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing damage reports */}
        {damageReports.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Documented Damage ({damageReports.length})</h4>
            {damageReports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{report.location}</span>
                    <Badge className={`ml-2 ${getSeverityColor(report.severity)}`}>
                      {report.severity}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeDamageReport(report.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                {report.photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {report.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Damage ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new damage form */}
        {isAddingDamage ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-4">
            <h4 className="font-medium">Add Damage Report</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  placeholder="e.g., Front bumper, Driver door"
                  value={newDamage.location}
                  onChange={(e) => setNewDamage(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Severity</label>
                <Select
                  value={newDamage.severity}
                  onValueChange={(value: "minor" | "moderate" | "major") =>
                    setNewDamage(prev => ({ ...prev, severity: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe the damage in detail..."
                value={newDamage.description}
                onChange={(e) => setNewDamage(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Photos</label>
              <div className="grid grid-cols-4 gap-2">
                {newDamage.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Damage photo ${index + 1}`}
                    className="w-full h-20 object-cover rounded"
                  />
                ))}
                <div className="relative border-2 border-dashed border-gray-300 rounded h-20 flex items-center justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAddDamagePhoto(file);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <Camera className="h-6 w-6 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveDamageReport} className="flex-1">
                Save Damage Report
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddingDamage(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setIsAddingDamage(true)}
            variant="outline"
            className="w-full flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Damage Report
          </Button>
        )}

        {/* Complete step button */}
        <div className="pt-4 border-t">
          <Button onClick={onStepComplete} className="w-full">
            {damageReports.length > 0 
              ? `Complete Documentation (${damageReports.length} damage reports)` 
              : "No Damage - Complete Step"
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
