// client/src/components/admin/OptionsEditorModal.jsx
import React from 'react';
import { useFieldArray } from 'react-hook-form';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const OptionsEditorModal = ({ isOpen, onClose, path, control, register }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: path
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Dropdown Options" size="lg">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-600 px-2">
                    <div className="col-span-6">Label (What the user sees)</div>
                    <div className="col-span-5">Value (For scoring, e.g., 1-5)</div>
                </div>

                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6">
                            <input
                                {...register(`${path}.${index}.label`)}
                                placeholder="e.g., Confident & Fluent"
                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            />
                        </div>
                        <div className="col-span-5">
                             <input
                                {...register(`${path}.${index}.value`)}
                                placeholder="e.g., 5"
                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            />
                        </div>
                        <div className="col-span-1">
                             <Button type="button" variant="outline" className="!p-2" onClick={() => remove(index)}>
                                <FiTrash2 className="text-red-500" />
                            </Button>
                        </div>
                    </div>
                ))}
                 <Button type="button" variant="outline" icon={<FiPlus/>} className="mt-4" onClick={() => append({ label: '', value: '' })}>
                    Add Option
                 </Button>
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t">
                 <Button onClick={onClose}>Done</Button>
            </div>
        </Modal>
    );
};

export default OptionsEditorModal;
