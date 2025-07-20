// client/src/components/admin/SkillCategorization.jsx
import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiCode, FiExternalLink, FiMail, FiPhone, FiSend, FiUser, FiClock, FiStar, FiLinkedin } from 'react-icons/fi';
import Button from '../common/Button';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import Badge from '../common/Badge';
import StatusBadge from '../common/StatusBadge';
import { processSkillCategorization } from '../../api/admin.api';
import { useAlert } from '../../hooks/useAlert';
import { DOMAINS } from '../../utils/constants';

const SkillCategorization = ({ applicant, skillAssessment, onCategorizeComplete }) => {
  const { showSuccess, showError } = useAlert();
  const [selectedDomain, setSelectedDomain] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelectedDomain(skillAssessment?.domain || '');
    setNotes(skillAssessment?.additionalNotes || '');
  }, [skillAssessment]);

  const handleSubmit = async () => {
    if (!selectedDomain) {
      showError('Please select a final domain for this applicant.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await processSkillCategorization(skillAssessment._id, { domain: selectedDomain, notes });
      showSuccess('Skill assessment categorized successfully!');
      if (onCategorizeComplete) {
        onCategorizeComplete();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to categorize assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!applicant || !skillAssessment) {
    return null;
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      {/* --- Profile Header --- */}
      <div className="mb-10">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{applicant.fullName}</h1>
          <StatusBadge status={applicant.status} />
        </div>
        <div className="mt-3 flex items-center flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2 hover:text-primary-600"><FiMail className="text-gray-400"/> {applicant.email}</div>
          <div className="flex items-center gap-2 hover:text-primary-600"><FiPhone className="text-gray-400"/> {applicant.phoneNumber}</div>
          <a href={applicant.linkedinProfileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline">
            <FiLinkedin className="text-gray-400"/> View LinkedIn Profile
          </a>
        </div>
      </div>
      
      {/* --- Key Metrics --- */}
      <div className="mb-10 border-t border-gray-200 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center text-sm font-medium text-gray-500">
              <FiUser className="mr-2" />
              <span>Current Role</span>
            </div>
            <div className="mt-1 text-lg font-semibold text-gray-900">
              {skillAssessment.jobTitle} at {skillAssessment.currentEmployer}
            </div>
          </div>
          
          <div>
            <div className="flex items-center text-sm font-medium text-gray-500">
              <FiClock className="mr-2" />
              <span>Experience</span>
            </div>
            <div className="mt-1 text-lg font-semibold text-gray-900">
              {skillAssessment.yearsOfExperience} years
            </div>
          </div>
          
          <div>
            <div className="flex items-center text-sm font-medium text-gray-500">
              <FiStar className="mr-2" />
              <span>Auto-Suggested Domain</span>
            </div>
            <div className="mt-1 text-lg font-semibold text-indigo-700">
              {skillAssessment.autoCategorizedDomain || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* --- Technical Skills Section --- */}
      <div className="mb-1">
        <h3 className="text-1xl font-semibold text-gray-800 mb-6 flex items-center">
          Technical Skills
        </h3>
        
        {skillAssessment.technicalSkills && skillAssessment.technicalSkills.length > 0 ? (
          <div className="space-y-6">
            {skillAssessment.technicalSkills.map((skill, index) => (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-lg font-semibold text-gray-800">{skill.technology}</h4>
                  <span className="text-xs font-medium text-gray-500">
                    {skill.subSkills.length} skill{skill.subSkills.length !== 1 && 's'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skill.subSkills.map((subSkill, subIndex) => (
                    <Badge key={subIndex} variant="gray" size="md">{subSkill}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No specific skills were listed by the applicant.</p>
        )}

        {skillAssessment.otherSkills && (
          <div className="mt-8">
            <h4 className="text-base font-medium text-gray-600 mb-3">Other Skills Mentioned</h4>
            <div className="text-gray-700 text-sm whitespace-pre-line">
              {skillAssessment.otherSkills}
            </div>
          </div>
        )}
      </div>
      
      {/* --- Admin Action Form --- */}
      <div className="mb-10 border-t border-gray-200 pt-8">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-6">
          <FiCheckCircle className="mr-3 text-primary-600"/>Admin Review & Action
        </h3>
        
        <div className="space-y-6">
          <Select
            label="Assign Final Domain"
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            options={DOMAINS}
            placeholder="Select the most appropriate domain"
            required
          />
          
          <Textarea
            label="Internal Review Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add internal notes about this categorization decision..."
            rows={3}
          />
        </div>
        
        <div className="mt-1 flex justify-end">
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedDomain}
            isLoading={isSubmitting}
            icon={<FiSend />}
            iconPosition="right"
          >
            {isSubmitting ? 'Processing...' : 'Confirm & Send Guidelines'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SkillCategorization;
