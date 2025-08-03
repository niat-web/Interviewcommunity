// client/src/pages/admin/CustomEmailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Tabs from '@/components/common/Tabs';
import Loader from '@/components/common/Loader';
// --- FIX: Add the .jsx extension to the file paths ---
import CreateEmailTemplate from '@/components/admin/CreateEmailTemplate.jsx';
import SendCustomEmail from '@/components/admin/SendCustomEmail.jsx';
import { getCustomEmailTemplates } from '@/api/admin.api';
import { useAlert } from '@/hooks/useAlert';
import 'react-quill/dist/quill.snow.css';

const CustomEmailPage = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showError } = useAlert();

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getCustomEmailTemplates();
            setTemplates(res.data.data);
        } catch (error) {
            showError("Failed to fetch email templates.");
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const tabs = [
        { 
            label: 'Send Emails', 
            content: (
                <SendCustomEmail 
                    templates={templates} 
                    isLoading={loading}
                    refreshTemplates={fetchTemplates}
                />
            ) 
        },
        { 
            label: 'Create/Edit Templates', 
            content: <CreateEmailTemplate refreshTemplates={fetchTemplates} /> 
        },
    ];

    if (loading && templates.length === 0) {
        return <div className="flex h-full items-center justify-center"><Loader text="Loading Email Module..."/></div>;
    }

    return (
        <div className="h-full w-full flex flex-col bg-white overflow-hidden">
             <div className="p-4 border-b border-gray-200 flex-shrink-0">
                 <h1 className="text-xl font-bold text-gray-800">Custom Email Center</h1>
             </div>
             <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
                 <Tabs tabs={tabs} />
             </div>
        </div>
    );
};

export default CustomEmailPage;
