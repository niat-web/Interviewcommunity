// client/src/pages/interviewer/Availability.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import Loader from '@/components/common/Loader';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import SlotSubmissionModal from '@/components/interviewer/SlotSubmissionModal';
import Modal from '@/components/common/Modal'; // Import the Modal component
import Textarea from '@/components/common/Textarea';
import { getBookingRequests, declineBookingRequest } from '@/api/interviewer.api';
import { useAlert } from '@/hooks/useAlert';
import { FiCalendar, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { formatDate } from '@/utils/formatters';

// --- MODIFICATION START: New Modal Component for Declining ---
const DeclineModal = ({ isOpen, onClose, onSubmit, request }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Decline Request for ${formatDate(request.bookingDate)}`}
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)}>
                <Textarea
                    label="Remarks"
                    placeholder="Please provide a reason for not being available (e.g., personal emergency, prior commitment)."
                    {...register('remarks', { required: 'Remarks are required to decline.' })}
                    error={errors.remarks?.message}
                    rows={3}
                    required
                />
                <div className="mt-6 flex justify-end space-x-3">
                    <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button variant="danger" type="submit" isLoading={isSubmitting}>
                        Confirm Not Interested
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
// --- MODIFICATION END ---


const Availability = () => {
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [slotModalState, setSlotModalState] = useState({ isOpen: false, request: null });
  // --- MODIFICATION START: State for the new decline modal ---
  const [declineModalState, setDeclineModalState] = useState({ isOpen: false, request: null });
  // --- MODIFICATION END ---

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getBookingRequests();
      setRequests(response.data.data);
    } catch (error) {
      console.error('Error fetching booking requests:', error);
      showError('Failed to load booking requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleOpenSlotModal = (request) => {
    setSlotModalState({ isOpen: true, request });
  };
  const handleCloseSlotModal = () => {
    setSlotModalState({ isOpen: false, request: null });
  };
  
  // --- MODIFICATION START: Handlers for decline modal ---
  const handleOpenDeclineModal = (request) => {
    setDeclineModalState({ isOpen: true, request });
  };
  const handleCloseDeclineModal = () => {
    setDeclineModalState({ isOpen: false, request: null });
  };
  const handleDeclineSubmit = async (data) => {
    try {
        await declineBookingRequest(declineModalState.request.bookingId, data);
        showSuccess('Your unavailability has been noted.');
        handleSuccess();
    } catch (error) {
        showError("Failed to submit. Please try again.");
    }
  };
  // --- MODIFICATION END ---
  
  const handleSuccess = () => {
    handleCloseSlotModal();
    handleCloseDeclineModal(); // Also close this modal on success
    fetchRequests(); // Re-fetch to show updated status
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to midnight for accurate date-only comparison

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader size="lg" text="Loading Booking Requests..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((req) => {
            const requestDate = new Date(req.bookingDate);
            const isExpired = requestDate < today && req.status === 'Pending';

            return (
              <div key={req.bookingId} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="mb-4 sm:mb-0">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <FiCalendar className="mr-3 text-primary-600" />
                      Request for: {formatDate(req.bookingDate)}
                    </h3>
                  </div>

                  {isExpired ? (
                    <div className="flex items-center space-x-2 text-gray-500 font-medium">
                      <FiXCircle />
                      <span>Expired</span>
                    </div>
                  ) : req.status === 'Submitted' ? (
                    <div className="flex items-center space-x-2 text-green-600 font-medium">
                      <FiCheckCircle />
                      <span>Slots Submitted</span>
                    </div>
                  ) : req.status === 'Not Available' ? (
                    <div className="flex items-center space-x-2 text-red-600 font-medium">
                      <FiXCircle />
                      <span>Marked as Not Available</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                       <Button
                          variant="outline"
                          onClick={() => handleOpenDeclineModal(req)}
                          icon={<FiXCircle />}
                          className="!text-red-600 !border-red-300 hover:!bg-red-50"
                        >
                          Not Interested
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => handleOpenSlotModal(req)}
                          icon={<FiClock />}
                          iconPosition="left"
                        >
                          Provide Availability
                        </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No Pending Requests"
          description="You have no new availability requests from the admin at this time."
          icon={<FiCheckCircle className="h-12 w-12" />}
        />
      )}

      {slotModalState.isOpen && (
        <SlotSubmissionModal
          isOpen={slotModalState.isOpen}
          onClose={handleCloseSlotModal}
          request={slotModalState.request}
          onSuccess={handleSuccess}
        />
      )}

      {declineModalState.isOpen && (
          <DeclineModal
            isOpen={declineModalState.isOpen}
            onClose={handleCloseDeclineModal}
            onSubmit={handleDeclineSubmit}
            request={declineModalState.request}
          />
      )}
    </div>
  );
};

export default Availability;
