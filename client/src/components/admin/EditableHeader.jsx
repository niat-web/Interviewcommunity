// client/src/components/admin/EditableHeader.jsx
import React, { useState } from 'react';
import { useController } from 'react-hook-form';
import { FiXCircle } from 'react-icons/fi';

const EditableHeader = ({ name, register, control, remove }) => {
    const { field } = useController({ name, control });
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <input
                {...field}
                className="w-full p-1 text-sm font-medium border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                onBlur={() => {
                    field.onBlur();
                    setIsEditing(false);
                }}
                autoFocus
            />
        );
    }

    return (
        <div 
            onClick={() => setIsEditing(true)} 
            className="w-full p-1 text-sm font-medium text-center cursor-pointer group relative min-h-[28px]"
        >
            {field.value || <span className="text-gray-400">Click to edit</span>}
             <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    remove();
                }}
                className="absolute top-0 right-0 p-0.5 rounded-full bg-red-100 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-200 transition-opacity"
                title="Remove"
            >
                <FiXCircle size={14} />
            </button>
        </div>
    );
};

export default EditableHeader;
