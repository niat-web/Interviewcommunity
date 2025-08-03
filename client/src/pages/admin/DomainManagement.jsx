// client/src/pages/admin/DomainManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Tabs from '@/components/common/Tabs';
import Loader from '@/components/common/Loader';
import DomainsTab from '@/components/admin/DomainsTab';
import DomainFieldsTab from '@/components/admin/DomainFieldsTab';
import { getDomains } from '@/api/admin.api';
import { useAlert } from '@/hooks/useAlert';

const DomainManagement = () => {
    const { showError } = useAlert();
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDomains = useCallback(async () => {
        try {
            const res = await getDomains();
            setDomains(res.data.data);
        } catch (error) {
            showError('Failed to fetch domains list.');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchDomains();
    }, [fetchDomains]);

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader text="Loading Domains..."/></div>
    }
    
    const tabs = [
        { 
            label: 'Domains', 
            content: <DomainsTab domains={domains} onUpdate={fetchDomains} /> 
        },
        { 
            label: 'Domain Fields', 
            content: <DomainFieldsTab domains={domains} />
        },
    ];

    return (
        <div className="h-full w-full flex flex-col bg-white overflow-hidden">
             <div className="p-4 border-b border-gray-200 flex-shrink-0">
                 <h1 className="text-xl font-bold text-gray-800">Evaluation Setup</h1>
             </div>
             <div className="flex-grow p-4 overflow-y-auto">
                 <Tabs tabs={tabs} />
             </div>
        </div>
    );
};

export default DomainManagement;
