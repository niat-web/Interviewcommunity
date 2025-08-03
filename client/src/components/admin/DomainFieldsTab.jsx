// client/src/components/admin/DomainFieldsTab.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
    FiPlus, 
    FiTrash2, 
    FiSave, 
    FiEdit, 
    FiEye,
    FiAlertCircle,
    FiChevronDown,
    FiChevronUp,
    FiClipboard // *** NEW *** Icon for the paste button
} from 'react-icons/fi';
import { getEvaluationSheet, updateEvaluationSheet } from '@/api/admin.api';
import { useAlert } from '@/hooks/useAlert';
import Select from 'react-select';

// *** NEW ***: Modal component for pasting spreadsheet data
const BulkAddOptionsModal = ({ isOpen, onClose, onAdd }) => {
    const [pastedText, setPastedText] = useState('');

    const handleProcessPaste = () => {
        if (!pastedText.trim()) {
            onClose();
            return;
        }

        const newOptions = pastedText
            .trim()
            .split('\n') // Split by new line for each row
            .map(row => {
                const parts = row.split('\t'); // Split by tab for columns
                const label = (parts[0] || '').trim();
                // If a second column for value exists, use it. Otherwise, use the label as the value.
                const value = (parts[1] || label).trim();
                return { label, value };
            })
            .filter(opt => opt.label); // Filter out any completely empty rows

        onAdd(newOptions);
        onClose();
    };

    return (
        // Using a basic modal structure for simplicity
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
            <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Paste Options from Spreadsheet</h3>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-2">
                        Copy cells from your spreadsheet (e.g., Excel, Google Sheets) and paste them here.
                    </p>
                    <ul className="text-xs text-gray-500 list-disc list-inside mb-4 space-y-1">
                        <li>The first column will be the <strong>Label</strong> (what the user sees).</li>
                        <li>The second column will be the <strong>Value</strong> (for scoring).</li>
                        <li>If only one column is pasted, the Label will be used as the Value.</li>
                    </ul>
                    <textarea
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="Paste your data here...
Confident & Fluent	5
Mostly Fluent	4"
                        className="w-full h-40 p-2 border border-gray-300 rounded-md font-mono text-sm"
                        autoFocus
                    />
                </div>
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                    <button type="button" className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50" onClick={onClose}>Cancel</button>
                    <button type="button" className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700" onClick={handleProcessPaste}>Add Options</button>
                </div>
            </div>
        </div>
    );
};


const Button = ({ 
    children, 
    onClick, 
    icon: Icon, 
    isLoading, 
    type = 'button', 
    variant = 'primary', 
    size = 'md', 
    className = '',
    disabled = false,
}) => {
    const baseClasses = "inline-flex items-center justify-center font-medium rounded-md border focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200";
    
    const sizeClasses = { 
        sm: 'px-2.5 py-1.5 text-xs gap-1.5',
        md: 'px-4 py-2 text-sm gap-2',
        lg: 'px-5 py-2.5 text-base gap-2'
    };
    
    const variantClasses = {
        primary: 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700 shadow-sm',
        secondary: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 shadow-sm',
        outline: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 shadow-sm',
        ghost: 'bg-transparent text-gray-500 border-transparent hover:bg-gray-100',
        success: 'bg-green-600 text-white border-transparent hover:bg-green-700 shadow-sm',
        danger: 'bg-red-500 text-white border-transparent hover:bg-red-600 shadow-sm',
    };
    
    const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
    
    return (
        <button 
            type={type} 
            onClick={onClick} 
            disabled={isLoading || disabled} 
            className={combinedClasses}
        >
            {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
                Icon && <Icon className="h-4 w-4 flex-shrink-0" />
            )}
            {children}
        </button>
    );
};


const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
        {children}
    </div>
);

const Badge = ({ children, variant = 'default' }) => {
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-indigo-100 text-indigo-800',
    };
    
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
            {children}
        </span>
    );
};

const PreviewComponent = ({ sheetData }) => {
    const { columnGroups = [] } = sheetData;
    
    const categoryColors = [
        'bg-purple-100 text-purple-800', 'bg-blue-100 text-blue-800', 'bg-teal-100 text-teal-800',
        'bg-amber-100 text-amber-800', 'bg-emerald-100 text-emerald-800',
    ];

    // *** MODIFIED: This function now only returns text color and font weight classes ***
    const getOptionStyle = (value) => {
        const stringValue = String(value).trim();
        switch (stringValue) {
            case '5': return 'text-green-700 font-bold';
            case '4': return 'text-green-600 font-medium';
            case '3': return 'text-yellow-600 font-medium';
            case '2': return 'text-red-500 font-medium';
            case '1': return 'text-red-700 font-bold';
            default: return 'text-gray-800';
        }
    };
    
    if (columnGroups.length === 0) {
        return (
            <Card className="p-6 text-center">
                <FiAlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Evaluation Parameters</h3>
                <p className="text-gray-500">Add categories to see the preview</p>
            </Card>
        );
    }

    return (
        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-96">
                <table className="min-w-full text-sm border-collapse">
                    <thead className="sticky top-0 z-10">
                        <tr>
                            {columnGroups.map((group, groupIndex) => (
                                <th 
                                    key={groupIndex} 
                                    colSpan={group.columns?.length || 1} 
                                    className={`p-2 border-r border-gray-200 text-center font-semibold ${categoryColors[groupIndex % categoryColors.length]}`}
                                >
                                    {group.title || `Category ${groupIndex + 1}`}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            {columnGroups.map((group, groupIndex) =>
                                (group.columns?.length > 0) ? (
                                    group.columns.map((column, colIndex) => (
                                        <th key={`${groupIndex}-${colIndex}`} className="p-2.5 border border-gray-200 text-center font-semibold bg-gray-50 whitespace-nowrap">
                                            {column.header || ``}
                                        </th>
                                    ))
                                ) : null
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 5 }).map((_, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-50">
                                {columnGroups.map((group, groupIndex) =>
                                    (group.columns?.length > 0) ? (
                                        group.columns.map((column, colIndex) => (
                                            <td key={`${rowIndex}-${groupIndex}-${colIndex}`} className="p-0 border border-gray-200">
                                                <select className="w-full h-full p-2 border-0 focus:ring-1 focus:outline-none bg-transparent" defaultValue="">
                                                    <option value="" className="text-gray-400">Select...</option>
                                                    {column.options?.map((opt, optIndex) => (
                                                        <option key={optIndex} value={opt.value} className={getOptionStyle(opt.value)}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                        ))
                                    ) : null
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const OptionsArray = ({ groupIndex, colIndex, control, register, onBulkAddClick }) => { // *** NEW ***: Add onBulkAddClick prop
    const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({ 
        control, 
        name: `columnGroups.${groupIndex}.columns.${colIndex}.options` 
    });
    
    return (
        <div className="space-y-1.5">
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2">
                {optionFields.map((opt, optIndex) => (
                    <div key={opt.id} className="flex items-center gap-1.5 p-1.5 bg-gray-50/70 rounded">
                        <input {...register(`columnGroups.${groupIndex}.columns.${colIndex}.options.${optIndex}.label`)} placeholder="Label" className="w-full p-1.5 text-xs border border-gray-200 rounded" />
                        <input {...register(`columnGroups.${groupIndex}.columns.${colIndex}.options.${optIndex}.value`)} placeholder="Value" className="w-1/2 p-1.5 text-xs border border-gray-200 rounded" />
                        <button type="button" className="text-red-400 hover:text-red-600 p-1" onClick={() => removeOption(optIndex)}>
                            <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
            </div>
            <div className="flex gap-2"> {/* *** NEW ***: Flex container for buttons */}
                <Button type="button" variant="outline" size="sm" icon={FiPlus} onClick={() => appendOption({label: '', value: ''})} className="flex-grow !py-1">
                    Add Option
                </Button>
                {/* *** NEW ***: Button to trigger bulk add modal */}
                <Button type="button" variant="outline" size="sm" icon={FiClipboard} onClick={onBulkAddClick} className="!py-1" title="Paste from Spreadsheet"></Button>
            </div>
        </div>
    );
};

const ColumnGroup = ({ groupIndex, control, register, removeGroup, onBulkAddClick }) => { // *** NEW ***: Add onBulkAddClick prop
    const { fields: columnFields, append: appendColumn, remove: removeColumn } = useFieldArray({ 
        control, 
        name: `columnGroups.${groupIndex}.columns` 
    });
    
    const [collapsed, setCollapsed] = useState(false);
    
    return (
        <Card>
            <div className=" bg-gray-50 border-b">
                <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2 flex-1">
                        <button type="button" className="text-gray-500 hover:bg-gray-200 p-1 rounded-sm" onClick={() => setCollapsed(!collapsed)}>
                            {collapsed ? <FiChevronDown className="h-4 w-4" /> : <FiChevronUp className="h-4 w-4" />}
                        </button>
                        <input {...register(`columnGroups.${groupIndex}.title`)} className="text-base font-bold border-none p-1 bg-transparent flex-1 focus:ring-1 focus:ring-indigo-300 rounded-sm" placeholder="Enter category title" />
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={FiPlus}
                            onClick={() => {
                                appendColumn({ header: '', options: [] });
                                if (collapsed) setCollapsed(false);
                            }}
                        >
                          Add Parameter
                        </Button>
                        <Badge variant="primary">{columnFields.length} parameters</Badge>
                        <button type="button" className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-full" onClick={() => removeGroup(groupIndex)}>
                            <FiTrash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
            
            {!collapsed && (
                <div className="p-3">
                    <div className="flex items-start overflow-x-auto gap-3 pb-3">
                        {columnFields.map((col, colIndex) => (
                            <div key={col.id} className="p-3 border rounded-md bg-white shadow-sm space-y-2 w-72 flex-shrink-0">
                                <div className="flex justify-between items-start">
                                    <input {...register(`columnGroups.${groupIndex}.columns.${colIndex}.header`)} className="font-semibold text-sm border-none p-1 bg-transparent flex-1 -ml-1 focus:ring-1 focus:ring-indigo-300 rounded-sm" placeholder="Parameter name"/>
                                    <button type="button" className="text-red-400 hover:text-red-600 p-1" onClick={() => removeColumn(colIndex)}>
                                        <FiTrash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                {/* *** NEW ***: Pass onBulkAddClick with column index */}
                                <OptionsArray groupIndex={groupIndex} colIndex={colIndex} control={control} register={register} onBulkAddClick={() => onBulkAddClick(groupIndex, colIndex)}/>
                            </div>
                        ))}
                         {columnFields.length === 0 && (
                             <div className="text-center w-full py-4 text-gray-500">
                                <p>No parameters added yet. Click "Add Parameter" in the header to get started.</p>
                             </div>
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
};


const EditorComponent = ({ control, register, groupFields, removeGroup, appendGroup, onBulkAddClick }) => { // *** NEW ***: Add onBulkAddClick prop
    return (
        <div className="space-y-3">
            {groupFields.length === 0 ? (
                <Card className="p-6 text-center">
                    <FiAlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Categories Yet</h3>
                    <p className="text-gray-500 mb-4 text-sm">Start by adding your first evaluation category.</p>
                    <Button type="button" icon={FiPlus} onClick={() => appendGroup({ title: '', columns: [] })}>
                        Create First Category
                    </Button>
                </Card>
            ) : (
                <>
                    {groupFields.map((group, groupIndex) => (
                        <ColumnGroup key={group.id} control={control} register={register} groupIndex={groupIndex} removeGroup={removeGroup} onBulkAddClick={onBulkAddClick} />
                    ))}
                </>
            )}
        </div>
    );
};

const DomainFieldsTab = ({ domains }) => {
    const { showSuccess, showError } = useAlert();
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('edit');
    // *** NEW ***: State to control the bulk add modal
    const [bulkAddModal, setBulkAddModal] = useState({ isOpen: false, groupIndex: null, colIndex: null });

    const { register, control, handleSubmit, reset, formState: { isSubmitting }, getValues, setValue } = useForm({ 
        defaultValues: { columnGroups: [] } 
    });
    
    const { fields: groupFields, append: appendGroup, remove: removeGroup } = useFieldArray({
        control,
        name: "columnGroups"
    });
    
    const domainOptions = domains?.map(d => ({ value: d._id, label: d.name })) || [];

    const fetchSheet = useCallback(async (domainId) => {
        setLoading(true);
        try {
            const res = await getEvaluationSheet(domainId);
            reset(res.data.data || { columnGroups: [] });
        } catch (error) { 
            showError("Failed to load evaluation sheet for this domain."); 
        } finally { 
            setLoading(false); 
        }
    }, [reset, showError]);

    useEffect(() => {
        if (selectedDomain) {
            fetchSheet(selectedDomain.value);
        } else {
            reset({ columnGroups: [] });
        }
    }, [selectedDomain, fetchSheet, reset]);

    const onSubmit = async (data) => {
        try {
            await updateEvaluationSheet(selectedDomain.value, data);
            showSuccess(`Evaluation sheet for "${selectedDomain.label}" saved successfully.`);
        } catch (error) {
            showError("Failed to save evaluation sheet.");
        }
    };

    // *** NEW ***: Function to handle adding the pasted options to the form state
    const handleBulkAddOptions = (newOptions) => {
        const { groupIndex, colIndex } = bulkAddModal;
        if (groupIndex === null || colIndex === null) return;
        
        const path = `columnGroups.${groupIndex}.columns.${colIndex}.options`;
        const currentOptions = getValues(path) || [];
        const updatedOptions = [...currentOptions, ...newOptions];
        
        setValue(path, updatedOptions);
        showSuccess(`${newOptions.length} options added successfully.`);
    };
    
    // *** NEW ***: Function to open the modal and set the target indexes
    const openBulkAddModal = (groupIndex, colIndex) => {
        setBulkAddModal({ isOpen: true, groupIndex, colIndex });
    };

    const customSelectStyles = {
        control: (base) => ({ 
            ...base, 
            borderColor: '#d1d5db', 
            borderRadius: '0.375rem', 
            minHeight: '38px',
            boxShadow: 'none',
             '&:hover': { borderColor: '#a5b4fc' },
        }),
        valueContainer: (base) => ({
            ...base,
            padding: '0px 8px'
        }),
        indicatorsContainer: (base) => ({
            ...base,
            height: '38px',
        })
    };
    
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div>
                        {selectedDomain && (
                            <div className="bg-gray-100 inline-flex rounded-lg p-1">
                                <button type="button" onClick={() => setMode('edit')} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center ${mode === 'edit' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}> 
                                    <FiEdit className="h-4 w-4 mr-1.5" /> Edit
                                </button>
                                <button type="button" onClick={() => setMode('preview')} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center ${mode === 'preview' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}> 
                                    <FiEye className="h-4 w-4 mr-1.5" /> Preview
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
                        <div className="w-full md:w-64">
                            <Select options={domainOptions} value={selectedDomain} onChange={setSelectedDomain} isClearable placeholder="Choose a domain..." styles={customSelectStyles} isSearchable />
                        </div>
                         {selectedDomain && mode === 'edit' && (
                            <>
                               <Button type="button" icon={FiPlus} variant="outline" onClick={() => appendGroup({ title: '', columns: [] })}>
                                    Add Category
                               </Button>
                               <Button
                                    type="submit"
                                    icon={isSubmitting ? null : FiSave}
                                    isLoading={isSubmitting}
                                    variant="success"
                                    disabled={groupFields.length === 0}
                               >
                                    {isSubmitting ? 'Saving...' : 'Save Sheet'}
                               </Button>
                            </>
                        )}
                    </div>
                </div>

                {selectedDomain ? (
                    loading ? (
                        <Card className="p-6 text-center"><div className="flex flex-col items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mb-3"></div><span className="text-gray-500">Loading evaluation sheet...</span></div></Card>
                    ) : (
                        <div>
                            {mode === 'edit' 
                                ? <EditorComponent control={control} register={register} groupFields={groupFields} removeGroup={removeGroup} appendGroup={appendGroup} onBulkAddClick={openBulkAddModal} /> // *** NEW ***: Pass prop
                                : <PreviewComponent sheetData={getValues()} />}
                        </div>
                    )
                ) : (
                    <Card className="p-6 text-center">
                        <FiAlertCircle className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Select a Domain</h3>
                        <p className="text-gray-500 max-w-md mx-auto text-sm">Choose a domain from the dropdown above to start configuring its evaluation sheet.</p>
                    </Card>
                )}
            </div>
            {/* *** NEW ***: Render the modal */}
            <BulkAddOptionsModal
                isOpen={bulkAddModal.isOpen}
                onClose={() => setBulkAddModal({ isOpen: false, groupIndex: null, colIndex: null })}
                onAdd={handleBulkAddOptions}
            />
        </form>
    );
};

export default DomainFieldsTab;
