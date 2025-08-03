// client/src/components/admin/SendCustomEmail.jsx
import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useAlert } from '@/hooks/useAlert';
import { sendBulkCustomEmail } from '@/api/admin.api';
import { FiMail, FiUpload, FiSend, FiInbox } from 'react-icons/fi';
// --- MODIFICATION: Import our new component ---
import EmailPreview from '../common/EmailPreview'; 

const SendCustomEmail = ({ templates, isLoading, refreshTemplates }) => {
    const { showSuccess, showError, showInfo } = useAlert();
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [csvData, setCsvData] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef(null);

    // Get the From Name and Email from environment variables
    const fromEmail = {
        name: import.meta.env.VITE_FROM_NAME || 'NxtWave Hiring',
        email: import.meta.env.VITE_FROM_EMAIL || 'psm@nxtwave.in',
    };

    const handleTemplateSelect = (e) => {
        const templateId = e.target.value;
        const template = templates.find(t => t._id === templateId);
        setSelectedTemplate(template || null);
        setCsvData([]); 
        if (fileInputRef.current) fileInputRef.current.value = null;
    };

    const handleFileChange = (e) => {
        // ... (your existing handleFileChange logic, no changes needed here)
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const workbook = XLSX.read(event.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(sheet);
                
                if (data.length === 0) {
                    showError("CSV file is empty.");
                    return;
                }
                
                const headers = Object.keys(data[0]);
                const requiredPlaceholders = selectedTemplate.placeholders;
                const missingHeaders = requiredPlaceholders.filter(p => !headers.find(h => h.toLowerCase() === p.toLowerCase()));

                if (!headers.find(h => h.toLowerCase() === 'email')) {
                    showError("CSV must contain an 'Email' column.");
                    return;
                }

                if (missingHeaders.length > 0) {
                    showError(`CSV is missing required columns for this template: ${missingHeaders.join(', ')}`);
                    return;
                }
                
                setCsvData(data);
                showSuccess(`${data.length} records loaded successfully from ${file.name}.`);

            } catch (err) {
                showError("Failed to parse CSV file. Please ensure it's a valid CSV or XLSX file.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const emailPreview = useMemo(() => {
        // ... (your existing emailPreview logic, no changes needed here)
        if (!selectedTemplate || csvData.length === 0) {
            return { subject: selectedTemplate?.subject || '[Your Subject Here]', body: selectedTemplate?.body || '<p>Your email content will appear here once you upload a CSV.</p>' };
        }
        
        let subject = selectedTemplate.subject;
        let body = selectedTemplate.body;
        const firstRow = csvData[0];
        
        for (const key in firstRow) {
            const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
            subject = subject.replace(placeholder, firstRow[key] || '');
            body = body.replace(placeholder, firstRow[key] || '');
        }

        return { subject, body };
    }, [selectedTemplate, csvData]);

    const handleSend = async () => {
        // ... (your existing handleSend logic, no changes needed here)
        setIsSending(true);
        try {
            const response = await sendBulkCustomEmail({
                templateId: selectedTemplate._id,
                recipients: csvData,
            });
            showSuccess(response.data.message);
            // Reset state after sending
            setSelectedTemplate(null);
            setCsvData([]);
            if (fileInputRef.current) fileInputRef.current.value = null;
        } catch (error) {
            showError(error.response?.data?.message || "An error occurred while sending emails.");
        } finally {
            setIsSending(false);
        }
    };
    
    if (isLoading) return <div className="text-center py-10 text-gray-500">Loading templates...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <select 
                    value={selectedTemplate?._id || ''}
                    onChange={handleTemplateSelect}
                    className="w-full sm:w-96 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="" disabled>Select a Template</option> {/* Corrected typo from "an Template" */}
                    {templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
            </div>
            
            {!selectedTemplate ? (
                 <div className="text-center py-16 text-gray-500 border-2 border-dashed rounded-lg">
                    <FiInbox className="mx-auto h-12 w-12 text-gray-300 mb-4"/>
                    <h3 className="font-semibold text-lg text-gray-700">No Template Selected</h3>
                    <p>Please choose a template from the dropdown above to proceed.</p>
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Recipients CSV/XLSX</h3>
                         <div className="flex items-center gap-4">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                             {csvData.length > 0 && <span className="text-sm font-medium text-green-700 whitespace-nowrap">{csvData.length} recipients loaded.</span>}
                         </div>
                         <div className="mt-2 text-xs text-gray-500">Required columns: <strong>Email</strong>, {selectedTemplate.placeholders.filter(p => p.toLowerCase() !== 'email').join(', ')}</div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Live Preview (from first row of data)</h3>
                        
                        {/* --- MODIFICATION START: Replace the old div with the new component --- */}
                        <EmailPreview 
                            from={fromEmail}
                            subject={emailPreview.subject}
                            body={emailPreview.body}
                        />
                        {/* --- MODIFICATION END --- */}
                    </div>
                    <div className="flex justify-end pt-4 border-t">
                        <button 
                            onClick={handleSend}
                            disabled={isSending || csvData.length === 0}
                            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isSending ? (<> <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Sending...</>) : (<><FiSend/>Send to {csvData.length} Recipients</>)}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SendCustomEmail;
