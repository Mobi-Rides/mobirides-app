import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, Eye, Plus, Filter, Search, Calendar, DollarSign, Car, FileText } from 'lucide-react';
import { InsuranceService } from '../../services/insuranceService';
import { supabase } from '@/integrations/supabase/client';
import ClaimsSubmissionForm from './ClaimsSubmissionForm';
import { useAuth } from '../../hooks/useAuth';
import { InsuranceClaim } from '@/types/insurance-schema';

export default function UserClaimsList() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewClaimForm, setShowNewClaimForm] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user?.id) {
      fetchUserClaims();
    }
  }, [user?.id]);

  const fetchUserClaims = async () => {
    try {
      setLoading(true);

      // Fetch user's bookings to get their policy IDs
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, car_id, start_date, end_date, total_price, status')
        .eq('renter_id', user?.id)
        .eq('status', 'completed');

      if (bookingsError) throw bookingsError;

      if (bookings && bookings.length > 0) {
        const bookingIds = bookings.map(b => b.id);

        // Fetch policies for these bookings
        const { data: policies, error: policiesError } = await supabase
          .from('insurance_policies')
          .select('id, booking_id, package_id, total_premium, status')
          .in('booking_id', bookingIds);

        if (policiesError) throw policiesError;

        if (policies && policies.length > 0) {
          const policyIds = policies.map(p => p.id);

          // Fetch claims for these policies
          const { data: claimsData, error: claimsError } = await supabase
            .from('insurance_claims')
            .select('*')
            .in('policy_id', policyIds)
            .order('created_at', { ascending: false });

          if (claimsError) throw claimsError;

          setClaims(claimsData || []);
        } else {
          setClaims([]);
        }
      } else {
        setClaims([]);
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'submitted':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'under_review':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'more_info_needed':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'paid':
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'closed':
        return <CheckCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-50 text-blue-700';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'more_info_needed':
        return 'bg-orange-100 text-orange-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'submitted':
        return 'Submitted';
      case 'under_review':
        return 'Under Review';
      case 'more_info_needed':
        return 'Info Needed';
      case 'approved':
        return 'Approved';
      case 'paid':
        return 'Paid';
      case 'rejected':
        return 'Rejected';
      case 'closed':
        return 'Closed';
      default:
        return 'Unknown';
    }
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.incident_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.incident_description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BWP',
    }).format(amount);
  };

  const [activePolicies, setActivePolicies] = useState<{ id: string, booking_id: string, policy_number: string, insurance_packages: any }[]>([]);
  const [selectedPolicyForClaim, setSelectedPolicyForClaim] = useState<{ id: string, booking_id: string } | null>(null);

  useEffect(() => {
    if (showNewClaimForm) {
      fetchActivePolicies();
    }
  }, [showNewClaimForm]);

  const fetchActivePolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('insurance_policies')
        .select('id, booking_id, policy_number, status, insurance_packages(display_name)')
        .eq('renter_id', user?.id)
        .in('status', ['active', 'expired']) // Allow claiming on recent expired policies too
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivePolicies(data || []);
    } catch (error) {
      console.error('Error fetching policies:', error);
    }
  };

  if (showNewClaimForm) {
    if (!selectedPolicyForClaim) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <button
              onClick={() => setShowNewClaimForm(false)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Claims List
            </button>
            <h2 className="text-2xl font-bold mt-4">Select Policy for Claim</h2>
            <p className="text-gray-600">Choose the insurance policy related to the incident.</p>
          </div>

          {activePolicies.length === 0 ? (
            <div className="bg-yellow-50 p-6 rounded-lg text-center">
              <p className="text-yellow-800 font-medium mb-2">No eligible insurance policies found.</p>
              <p className="text-sm text-yellow-700 max-w-md mx-auto">
                You can only make a claim if you have an active or recently expired insurance policy associated with a booking.
                Please ensure you have purchased insurance for your rental.
              </p>
              <button
                onClick={() => setShowNewClaimForm(false)}
                className="mt-4 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200"
              >
                Go Back
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {activePolicies.map((policy) => (
                <div
                  key={policy.id}
                  onClick={() => setSelectedPolicyForClaim({ id: policy.id, booking_id: policy.booking_id })}
                  className="bg-white p-4 rounded-lg shadow-sm border hover:border-blue-500 cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{policy.insurance_packages?.display_name || 'Insurance Policy'}</h3>
                      <p className="text-sm text-gray-500">Policy #: {policy.policy_number}</p>
                    </div>
                    <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Select
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => {
              setSelectedPolicyForClaim(null);
            }}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Policy Selection
          </button>
        </div>
        <ClaimsSubmissionForm
          policyId={selectedPolicyForClaim.id}
          bookingId={selectedPolicyForClaim.booking_id}
          onSuccess={() => {
            setShowNewClaimForm(false);
            setSelectedPolicyForClaim(null);
            fetchUserClaims();
          }}
          onCancel={() => {
            setShowNewClaimForm(false);
            setSelectedPolicyForClaim(null);
          }}
        />
      </div>
    );
  }

  if (selectedClaim) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => setSelectedClaim(null)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Claims List
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Claim Details</h2>
              <p className="text-gray-600">Claim #{selectedClaim.claim_number}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedClaim.status)}`}>
              {getStatusText(selectedClaim.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Incident Information</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium">Date:</span>
                  <span className="ml-2">{formatDate(selectedClaim.incident_date)}</span>
                </div>
                <div>
                  <span className="font-medium">Location:</span>
                  <span className="ml-2">{selectedClaim.incident_location}</span>
                </div>
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="mt-1 text-gray-600">{selectedClaim.incident_description}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Damage Assessment</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium">Estimated Cost:</span>
                  <span className="ml-2">{formatCurrency(selectedClaim.estimated_repair_cost)}</span>
                </div>
                <div>
                  <span className="font-medium">Damage Description:</span>
                  <p className="mt-1 text-gray-600">{selectedClaim.damage_description}</p>
                </div>
              </div>
            </div>
          </div>

          {selectedClaim.supporting_documents && selectedClaim.supporting_documents.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Supporting Documents</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedClaim.supporting_documents.map((doc, index) => (
                  <div key={index} className="border rounded-lg p-3 text-center">
                    <div className="w-full h-24 bg-gray-200 rounded mb-2 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-xs text-gray-600 truncate">{doc.split('/').pop()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-2" />
              <span>Submitted on {formatDate(selectedClaim.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Insurance Claims</h1>
            <p className="text-gray-600 mt-1">View and manage your insurance claims</p>
          </div>
          <button
            onClick={() => setShowNewClaimForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Claim
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search claims by number, location, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Claims List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your claims...</p>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {claims.length === 0 ? 'No Claims Found' : 'No Claims Match Your Search'}
          </h3>
          <p className="text-gray-600 mb-4">
            {claims.length === 0
              ? "You haven't submitted any insurance claims yet."
              : "Try adjusting your search or filter criteria."
            }
          </p>
          {claims.length === 0 && (
            <button
              onClick={() => setShowNewClaimForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Your First Claim
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claim #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incident Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estimated Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{claim.claim_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <div className="text-sm text-gray-900">{formatDate(claim.incident_date)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {claim.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                        <div className="text-sm text-gray-900">
                          {claim.estimated_damage_cost ? formatCurrency(claim.estimated_damage_cost) : '-'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(claim.status)}
                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(claim.status)}`}>
                          {getStatusText(claim.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedClaim(claim)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}