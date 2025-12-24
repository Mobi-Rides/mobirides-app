import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, Eye, Search, Filter, Calendar, DollarSign, User, Car, TrendingUp, TrendingDown, Activity, RefreshCw, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { InsuranceService } from '../../services/insuranceService';
import { toast } from 'sonner';
import { InsuranceClaim, InsurancePolicy } from '@/types/insurance-schema';

interface Booking {
  id: string;
  user_id: string;
  car_id: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
}

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    phone?: string;
  };
}

interface ClaimsStats {
  totalClaims: number;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  totalValue: number;
  approvedValue: number;
}

export default function AdminClaimsDashboard() {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [stats, setStats] = useState<ClaimsStats>({
    totalClaims: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0,
    totalValue: 0,
    approvedValue: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all claims
      const { data: claimsData, error: claimsError } = await supabase
        .from('insurance_claims' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (claimsError) throw claimsError;

      // Map DB fields to Component Interface if needed
      const mappedClaims = (claimsData || []).map(c => ({
        ...c,
        estimated_repair_cost: c.estimated_damage_cost, // Map DB field
        supporting_documents: c.evidence_urls || [], // Map DB field
        // status is already 'status' in DB
        // admin_notes is already 'admin_notes' in DB
      }));

      // Fetch all policies
      const { data: policiesData, error: policiesError } = await supabase
        .from('insurance_policies')
        .select('*');

      if (policiesError) throw policiesError;

      // Fetch all bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*');

      if (bookingsError) throw bookingsError;

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

      if (usersError) throw usersError;

      setClaims(mappedClaims || []);
      setPolicies(policiesData || []);
      setBookings(bookingsData || []);
      setUsers(usersData?.users || []);

      // Calculate stats
      const stats = calculateStats(mappedClaims || []);
      setStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (claims: Claim[]): ClaimsStats => {
    return {
      totalClaims: claims.length,
      pendingClaims: claims.filter(c => c.status === 'submitted' || c.status === 'pending').length, // Handle 'submitted' as pending
      approvedClaims: claims.filter(c => c.status === 'approved').length,
      rejectedClaims: claims.filter(c => c.status === 'rejected').length,
      totalValue: claims.reduce((sum, c) => sum + (c.estimated_repair_cost || 0), 0),
      approvedValue: claims.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.approved_amount || 0), 0),
    };
  };

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const getBookingById = (bookingId: string) => {
    return bookings.find(b => b.id === bookingId);
  };

  const getPolicyById = (policyId: string) => {
    return policies.find(p => p.id === policyId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'under_review':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'pending':
        return 'Pending';
      case 'under_review':
        return 'Under Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const updateClaimStatus = async (claimId: string, newStatus: string, notes?: string, approvedAmount?: number) => {
    try {
      const { error } = await supabase
        .from('insurance_claims' as any)
        .update({
          status: newStatus,
          admin_notes: notes,
          approved_amount: approvedAmount,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString(),
          resolved_at: newStatus === 'approved' || newStatus === 'rejected' ? new Date().toISOString() : null
        })
        .eq('id', claimId);

      if (error) throw error;

      toast.success(`Claim updated to ${newStatus}`);
      // Refresh data
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating claim status:', error);
      toast.error('Failed to update claim status');
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BWP',
    }).format(amount);
  };

  if (selectedClaim) {
    const policy = getPolicyById(selectedClaim.policy_id);
    const booking = policy ? getBookingById(policy.booking_id) : null;
    const user = booking ? getUserById(booking.user_id) : null;

    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => setSelectedClaim(null)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Claim Review</h2>
              <p className="text-gray-600">Claim #{selectedClaim.claim_number}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedClaim.status)}`}>
              {getStatusText(selectedClaim.status)}
            </div>
          </div>

          {/* Claim Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Incident Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Incident Date</p>
                    <p className="font-medium">{formatDate(selectedClaim.incident_date)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{selectedClaim.incident_location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-700">{selectedClaim.incident_description}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Damage Assessment</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Estimated Repair Cost</p>
                    <p className="font-medium">{formatCurrency(selectedClaim.estimated_repair_cost)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Damage Description</p>
                  <p className="text-gray-700">{selectedClaim.damage_description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Policy and User Info */}
          {user && booking && policy && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Policy Information</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Policy ID</p>
                    <p className="font-medium">{policy.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Premium Amount</p>
                    <p className="font-medium">{formatCurrency(policy.premium_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Booking Period</p>
                    <p className="font-medium">
                      {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{user.user_metadata?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{user.user_metadata?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Supporting Documents */}
          {selectedClaim.supporting_documents && selectedClaim.supporting_documents.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Supporting Documents</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedClaim.supporting_documents.map((doc, index) => (
                  <div key={index} className="border rounded-lg p-3 text-center">
                    <div className="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center">
                      <Activity className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-xs text-gray-600 truncate">{doc.split('/').pop()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Actions */}
          {selectedClaim.status === 'submitted' || selectedClaim.status === 'under_review' || selectedClaim.status === 'more_info_needed' ? (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Actions</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Approved Amount (BWP)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                    placeholder="Enter approved amount..."
                    defaultValue={selectedClaim.estimated_damage_cost || 0}
                    id="approved-amount"
                  />
                  
                  <label className="block text-sm font-medium text-gray-700 mb-2">Review Notes</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add your review notes here..."
                    id="review-notes"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      const notes = (document.getElementById('review-notes') as HTMLTextAreaElement)?.value;
                      const amount = parseFloat((document.getElementById('approved-amount') as HTMLInputElement)?.value) || 0;
                      updateClaimStatus(selectedClaim.id, 'approved', notes, amount);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve Claim
                  </button>
                  <button
                    onClick={() => {
                      const notes = (document.getElementById('review-notes') as HTMLTextAreaElement)?.value;
                      updateClaimStatus(selectedClaim.id, 'rejected', notes);
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reject Claim
                  </button>
                  {selectedClaim.status === 'submitted' && (
                    <button
                      onClick={() => {
                        const notes = (document.getElementById('review-notes') as HTMLTextAreaElement)?.value;
                        updateClaimStatus(selectedClaim.id, 'under_review', notes);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Mark Under Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : selectedClaim.status === 'approved' && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payout Actions</h3>
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <p className="text-green-800 font-medium">Claim Approved for {formatCurrency(selectedClaim.approved_amount || 0)}</p>
                <p className="text-sm text-green-600 mt-1">Ready for payout processing.</p>
              </div>
              <button
                onClick={() => InsuranceService.processClaimPayout(selectedClaim.id, selectedClaim.approved_amount || 0)}
                className="flex items-center justify-center w-full md:w-auto bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Process Payout
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Insurance Claims Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage and review insurance claims</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Claims</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalClaims}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingClaims}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedClaims}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejectedClaims}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Claim Value</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Approved Value</h3>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.approvedValue)}</p>
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
          <p className="mt-4 text-gray-600">Loading claims...</p>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Claims Found</h3>
          <p className="text-gray-600">No claims match your search criteria.</p>
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
                    User
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
                {filteredClaims.map((claim) => {
                  const policy = getPolicyById(claim.policy_id);
                  const booking = policy ? getBookingById(policy.booking_id) : null;
                  const user = booking ? getUserById(booking.user_id) : null;

                  return (
                    <tr key={claim.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{claim.claim_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {user?.user_metadata?.full_name || user?.email || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">{user?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <div className="text-sm text-gray-900">{formatDate(claim.incident_date)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {claim.incident_location}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                          <div className="text-sm text-gray-900">
                            {formatCurrency(claim.estimated_damage_cost || 0)}
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
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}