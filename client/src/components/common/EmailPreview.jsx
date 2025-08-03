// client/src/components/common/EmailPreview.jsx
import React from 'react';
import DOMPurify from 'dompurify';
import { FiUser } from 'react-icons/fi';

const EmailPreview = ({ from, subject, body }) => {
    // Sanitize the HTML body to prevent XSS attacks
    const sanitizedBody = DOMPurify.sanitize(body);

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            {/* Header section to mimic email client */}
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{subject}</h3>
                <div className="flex items-center text-sm">
                    <div className="flex-shrink-0 mr-3">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-500">
                            <FiUser className="h-5 w-5 text-white" />
                        </span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">
                            {/* --- THIS IS THE FIXED LINE --- */}
                            {from.name} <span className="text-gray-500 font-normal">{`<${from.email}>`}</span>
                        </p>
                        <p className="text-gray-500">to me</p>
                    </div>
                </div>
            </div>

            {/* Email Body with Prose styling */}
            <div
                // The 'prose' class from Tailwind Typography is key here.
                // It automatically styles raw HTML (like the output from your editor)
                // to look beautiful and readable, with correct fonts, link colors, and spacing.
                className="p-6 prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: sanitizedBody }}
            />
        </div>
    );
};

export default EmailPreview;
