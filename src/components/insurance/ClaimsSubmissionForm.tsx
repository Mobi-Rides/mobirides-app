import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Upload, FileText, Camera, Calendar, MapPin, Phone, User, Car } from 'lucide-react';
import { InsuranceService } from '../../services/insuranceService';
import { supabase } from '@/integrations/supabase/client';

const claimSchema = z.object({
  incident_date: z.string().min(1, 'Incident date is required'),
  incident_time: z.string().min(1, 'Incident time is required'),
  incident_location: z.string().min(10, 'Please provide detailed incident location'),
  incident_description: z.string().min(50, 'Please provide detailed incident description (minimum 50 characters)'),
  damage_description: z.string().min(30, 'Please describe the damage (minimum 30 characters)'),
  estimated_repair_cost: z.number().min(0, 'Estimated repair cost must be positive'),
  police_report_filed: z.boolean(),
  police_report_number: z.string().optional(),
  police_station: z.string().optional(),
  other_vehicle_involved: z.boolean(),
  other_driver_name: z.string().optional(),
  other_driver_contact: z.string().optional(),
  other_vehicle_registration: z.string().optional(),
  witness_name: z.string().optional(),
  witness_contact: z.string().optional(),
  additional_notes: z.string().optional(),
});

type ClaimFormData = z.infer<typeof claimSchema>;

interface ClaimsSubmissionFormProps {
  policyId: string;
  bookingId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ClaimsSubmissionForm({ policyId, bookingId, onSuccess, onCancel }: ClaimsSubmissionFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<ClaimFormData>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      police_report_filed: false,
      other_vehicle_involved: false,
    },
  });

  const watchPoliceReport = watch('police_report_filed');
  const watchOtherVehicle = watch('other_vehicle_involved');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
      for (const file of Array.from(files)) {
        const fileName = `claims/${policyId}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('insurance-documents')
          .upload(fileName, file);

        if (error) {
          console.error('File upload error:', error);
          continue;
        }

        if (data) {
          setUploadedFiles(prev => [...prev, data.path]);
        }
      }
    } catch (error) {
      console.error('File upload failed:', error);
    }
  };

  const onSubmit = async (data: ClaimFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await insuranceService.submitClaim({
        policy_id: policyId,
        booking_id: bookingId,
        incident_date: data.incident_date,
        incident_time: data.incident_time,
        incident_location: data.incident_location,
        incident_description: data.incident_description,
        damage_description: data.damage_description,
        estimated_repair_cost: data.estimated_repair_cost,
        police_report_filed: data.police_report_filed,
        police_report_number: data.police_report_number,
        police_station: data.police_station,
        other_vehicle_involved: data.other_vehicle_involved,
        other_driver_name: data.other_driver_name,
        other_driver_contact: data.other_driver_contact,
        other_vehicle_registration: data.other_vehicle_registration,
        witness_name: data.witness_name,
        witness_contact: data.witness_contact,
        additional_notes: data.additional_notes,
        supporting_documents: uploadedFiles,
      });

      if (result.success) {
        onSuccess?.();
      } else {
        setSubmitError(result.error || 'Failed to submit claim');
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    let isValid = false;
    
    if (currentStep === 1) {
      isValid = await trigger(['incident_date', 'incident_time', 'incident_location', 'incident_description']);
    } else if (currentStep === 2) {
      isValid = await trigger(['damage_description', 'estimated_repair_cost']);
    }

    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit Insurance Claim</h2>
        <p className="text-gray-600">Please provide detailed information about the incident to process your claim.</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="ml-2 font-medium">Incident Details</span>
          </div>
          <div className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="ml-2 font-medium">Damage Assessment</span>
          </div>
          <div className={`flex-1 h-1 mx-4 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="ml-2 font-medium">Documents & Submit</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{submitError}</p>
          </div>
        )}

        {/* Step 1: Incident Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Incident Date
                </label>
                <input
                  type="date"
                  {...register('incident_date')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.incident_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.incident_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Incident Time
                </label>
                <input
                  type="time"
                  {...register('incident_time')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.incident_time && (
                  <p className="text-red-500 text-sm mt-1">{errors.incident_time.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Incident Location
              </label>
              <textarea
                {...register('incident_location')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Provide detailed address or location description"
              />
              {errors.incident_location && (
                <p className="text-red-500 text-sm mt-1">{errors.incident_location.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Incident Description
              </label>
              <textarea
                {...register('incident_description')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe what happened in detail (minimum 50 characters)"
              />
              {errors.incident_description && (
                <p className="text-red-500 text-sm mt-1">{errors.incident_description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('police_report_filed')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Police report was filed</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('other_vehicle_involved')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Other vehicle(s) involved</span>
                </label>
              </div>
            </div>

            {watchPoliceReport && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Police Report Number
                  </label>
                  <input
                    type="text"
                    {...register('police_report_number')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Police Station
                  </label>
                  <input
                    type="text"
                    {...register('police_station')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {watchOtherVehicle && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Other Driver Name
                    </label>
                    <input
                      type="text"
                      {...register('other_driver_name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Other Driver Contact
                    </label>
                    <input
                      type="text"
                      {...register('other_driver_contact')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Car className="w-4 h-4 inline mr-1" />
                    Other Vehicle Registration
                  </label>
                  <input
                    type="text"
                    {...register('other_vehicle_registration')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Damage Assessment */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Damage Description
              </label>
              <textarea
                {...register('damage_description')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the damage to the vehicle (minimum 30 characters)"
              />
              {errors.damage_description && (
                <p className="text-red-500 text-sm mt-1">{errors.damage_description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Repair Cost (BWP)
              </label>
              <input
                type="number"
                {...register('estimated_repair_cost', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              {errors.estimated_repair_cost && (
                <p className="text-red-500 text-sm mt-1">{errors.estimated_repair_cost.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Witness Name (Optional)
                </label>
                <input
                  type="text"
                  {...register('witness_name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Witness Contact (Optional)
                </label>
                <input
                  type="text"
                  {...register('witness_contact')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                {...register('additional_notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional information that might be helpful"
              />
            </div>
          </div>
        )}

        {/* Step 3: Documents & Submit */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                <Upload className="w-4 h-4 inline mr-1" />
                Supporting Documents
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Upload photos of the damage, police report, and other relevant documents</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Choose Files
                </button>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</p>
                  <ul className="space-y-1">
                    {uploadedFiles.map((file, index) => (
                      <li key={index} className="text-sm text-green-600 flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        {file.split('/').pop()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Please ensure all information provided is accurate and complete. 
                False information may result in claim denial.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
            )}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="ml-4 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          <div>
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Claim'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}