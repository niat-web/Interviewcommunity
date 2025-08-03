import React, { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FiArrowLeft, FiDollarSign, FiSearch, FiBarChart2, FiDownload, FiMail, FiLoader, FiChevronDown, FiX, FiInbox } from 'react-icons/fi';
import { getPaymentRequests, sendPaymentEmail, sendInvoiceEmail, sendPaymentReceivedEmail, getPayoutSheet, updateInterviewer } from '@/api/admin.api';
import { useAlert } from '@/hooks/useAlert';
import { format as formatDateFns } from 'date-fns';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { debounce } from '@/utils/helpers';
import Table from '@/components/common/Table';
import SearchInput from '@/components/common/SearchInput';
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import Badge from '@/components/common/Badge';


const LocalButton = ({ children, onClick, isLoading = false, variant = 'primary', icon: Icon, className = '', disabled = false, type = 'button' }) => {
    const baseClasses = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm";
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    };
    return (
        <button type={type} onClick={onClick} disabled={isLoading || disabled} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
            {isLoading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>

            ) : (
                <>
                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                    {children}
                </>
            )}
        </button>
    );
};
const RemarksModal = ({ isOpen, onClose, content }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-lg bg-white rounded-lg shadow-xl" 
                onClick={e => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Remarks</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200">
                        <FiX className="h-5 w-5"/>
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end rounded-b-lg">
                    <LocalButton variant="outline" onClick={onClose}>Close</LocalButton>
                </div>
            </div>
        </div>
    );
};
const LocalPaymentTable = ({ columns, data, isLoading, emptyMessage }) => {
    const EmptyState = () => (
         <div className="text-center py-16 text-gray-500">
            <FiInbox className="mx-auto h-10 w-10 text-gray-400 mb-2" />
            <h3 className="font-semibold text-gray-700">No Data Found</h3>
            <p className="text-sm">{emptyMessage}</p>
        </div>
    );
    const Loader = () => (
         <div className="flex justify-center items-center py-20 text-center text-gray-500">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="ml-4">Loading data...</span>
        </div>
    );

    return (
        <div className="w-full overflow-x-auto">
            <table className="min-w-full bg-white divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map(col => (
                            <th key={col.key} scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                {col.title}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {isLoading ? (
                        <tr><td colSpan={columns.length}><Loader /></td></tr>
                    ) : data.length === 0 ? (
                        <tr><td colSpan={columns.length}><EmptyState /></td></tr>
                    ) : (
                        data.map((row, rowIndex) => (
                            <tr key={row._id || rowIndex} className="hover:bg-gray-50 transition-colors">
                                {columns.map(col => (
                                    <td key={col.key} className="px-2 py-2 whitespace-nowrap text-xs text-gray-700 align-middle">
                                        {col.render ? col.render(row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};


const EditableInterviewerIDCell = ({ row, onSave }) => {
    const [value, setValue] = useState(row.interviewer?.interviewerId || '');
    const [isLoading, setIsLoading] = useState(false);
    const { showError } = useAlert();

    useEffect(() => {
        setValue(row.interviewer?.interviewerId || '');
    }, [row.interviewer?.interviewerId]);

    const handleSave = async () => {
        const originalValue = row.interviewer?.interviewerId || '';
        if (value.trim() === originalValue.trim()) {
            return; // No changes to save
        }

        setIsLoading(true);
        try {
            await onSave(row.interviewer._id, value.trim());
        } catch (error) {
            setValue(originalValue); // Revert value on error
            showError('Failed to update Interviewer ID.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative">
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleSave}
                disabled={isLoading}
                className="w-full text-xs p-2 border border-transparent rounded-md bg-transparent focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
            {isLoading && <FiLoader className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
        </div>
    );
};

const CompactTable = ({ columns, data, isLoading, emptyMessage }) => {
    const EmptyState = () => (
         <div className="text-center py-16 text-gray-500">
            <FiInbox className="mx-auto h-10 w-10 text-gray-400 mb-2" />
            <h3 className="font-semibold text-gray-700">No Data Found</h3>
            <p className="text-sm">{emptyMessage}</p>
        </div>
    );
    const Loader = () => (
         <div className="flex justify-center items-center py-20 text-center text-gray-500">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="ml-4">Loading data...</span>
        </div>
    );

    return (
        <div className="w-full overflow-x-auto">
            <table className="min-w-full bg-white divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map(col => (
                            <th key={col.key} scope="col" className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                {col.title}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {isLoading ? (
                        <tr><td colSpan={columns.length}><Loader /></td></tr>
                    ) : data.length === 0 ? (
                        <tr><td colSpan={columns.length}><EmptyState /></td></tr>
                    ) : (
                        data.map((row, rowIndex) => (
                            <tr key={row._id || rowIndex} className="hover:bg-gray-50 transition-colors">
                                {columns.map(col => (
                                    // --- MODIFICATION: Conditionally apply wrapping class ---
                                    <td key={col.key} className={`px-3 py-1.5 text-xs align-middle text-gray-700 ${col.allowWrap ? 'whitespace-normal break-words' : 'whitespace-nowrap'}`}>
                                        {col.render ? col.render(row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};


const PayoutSheetView = () => {
    const { showError, showSuccess } = useAlert();
    const [loading, setLoading] = useState(true);
    const [payoutData, setPayoutData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState(new Date());

    const fetchPayoutSheet = useCallback(async (selectedDate) => {
        setLoading(true);
        try {
            const startDate = startOfMonth(selectedDate);
            const endDate = endOfMonth(selectedDate);
            const params = {
                search: searchTerm,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            };
            const response = await getPayoutSheet(params);
            setPayoutData(response.data.data.payoutSheet || []);
        } catch (err) {
            showError('Failed to fetch Payout Sheet.');
            setPayoutData([]);
        } finally {
            setLoading(false);
        }
    }, [showError, searchTerm]);
    
    useEffect(() => {
        const handler = debounce(() => fetchPayoutSheet(date), 300);
        handler();
        return () => handler.cancel();
    }, [date, searchTerm, fetchPayoutSheet]);

    const handleExport = () => {
        if (!payoutData || payoutData.length === 0) {
            return showError("No data available to export.");
        }
        
        const dataToExport = payoutData.map(row => ({
            "user_id": row.interviewer.interviewerId,
            "association_name_enum": row.associationName,
            "activity_name_enum": row.activityName,
            "activity_reference_id": row.activityReferenceId,
            "activity_datetime": formatDateTime(row.activityDatetime),
            "points": row.points,
            "points_vesting_datetime": formatDateTime(row.pointsVestingDatetime)
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Payout Sheet');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(blob, `PayoutSheet_${formatDateFns(date, 'MMM-yyyy')}.xlsx`);
        showSuccess("Export successful!");
    };

    const handleInterviewerIdSave = useCallback(async (interviewerMongoId, newInterviewerId) => {
        await updateInterviewer(interviewerMongoId, { interviewerId: newInterviewerId });
        setPayoutData(prevData =>
            prevData.map(row => {
                if (row.interviewer && row.interviewer._id === interviewerMongoId) {
                    return {
                        ...row,
                        interviewer: {
                            ...row.interviewer,
                            interviewerId: newInterviewerId
                        }
                    };
                }
                return row;
            })
        );
        showSuccess('Interviewer ID updated!');
    }, [showSuccess]);
    
    const formatCustomDateTime = (isoDate) => {
        if (!isoDate) return '';
        return formatDateFns(new Date(isoDate), 'yyyy-MM-dd HH:mm:ss');
    };

    // --- MODIFICATION: Adjusted minWidth and added allowWrap to condense columns ---
    const columns = useMemo(() => [
        { key: 'interviewer_id', title: 'Interviewer ID', minWidth: '280px', render: (row) => <EditableInterviewerIDCell row={row} onSave={handleInterviewerIdSave} /> },
        { key: 'association_name_enum', title: 'Association Name' , allowWrap: true, render: (row) => row.associationName},
        { key: 'activity_name_enum', title: 'Activity Name', allowWrap: true, render: (row) => row.activityName },
        { key: 'activity_reference_id', title: 'Activity Reference ID', minWidth: '150px', render: (row) => row.activityReferenceId },
        { key: 'activity_datetime', title: 'Activity DateTime', minWidth: '150px', render: (row) => formatCustomDateTime(row.activityDatetime) },
        { key: 'points', title: 'Points', render: (row) => row.points },
        { key: 'points_vesting_datetime', title: 'Points Vesting DateTime', minWidth: '150px', render: (row) => formatCustomDateTime(row.pointsVestingDatetime) }
    ], [handleInterviewerIdSave]);

    const filterOptions = ["This Month", "Last Month"];
    
    const handleFilterClick = (filter) => {
        if (filter === 'This Month') setDate(new Date());
        if (filter === 'Last Month') setDate(subMonths(new Date(), 1));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b">
                <SearchInput
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search records by Interviewer ID..."
                    className="w-full sm:w-64"
                />
                <div className="flex items-center gap-2">
                     {filterOptions.map(opt => (
                        <button key={opt} onClick={() => handleFilterClick(opt)} className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50">{opt}</button>
                    ))}
                    <div className="w-full sm:w-40">
                        <DatePicker
                            selected={date}
                            onChange={(d) => setDate(d)}
                            dateFormat="MMM yyyy"
                            showMonthYearPicker
                            className="w-full form-input py-1 text-center"
                            popperClassName="z-50"
                            popperPlacement="bottom-end"
                        />
                    </div>
                    <button onClick={handleExport} disabled={loading || payoutData.length === 0} className="p-2 border border-gray-300 rounded-md bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50" title="Export to Excel">
                        <FiDownload className="h-5 w-5" />
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <CompactTable columns={columns} data={payoutData} isLoading={loading} emptyMessage="No payout data for the selected month." />
            </div>
        </div>
    );
};


const PaymentRequestsView = () => {
    const { showError, showSuccess } = useAlert();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [sendingInvoiceId, setSendingInvoiceId] = useState(null); 
    const [sendingPaymentReceivedId, setSendingPaymentReceivedId] = useState(null);
    const [sendingEmailId, setSendingEmailId] = useState(null);
    const [dateRange, setDateRange] = useState([startOfMonth(new Date()), endOfMonth(new Date())]);
    const [startDate, endDate] = dateRange;
    const [activeFilter, setActiveFilter] = useState("This Month");
    const [remarksModal, setRemarksModal] = useState({ isOpen: false, content: '' });

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                startDate: startDate ? startDate.toISOString() : null,
                endDate: endDate ? endDate.toISOString() : null,
            };
            const response = await getPaymentRequests(params);
            setRequests(response.data.data);
        } catch (err) {
            showError('Failed to fetch payment requests.');
        } finally {
            setLoading(false);
        }
    }, [showError, startDate, endDate]);
    
    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const handleFilterClick = (filter) => {
        setActiveFilter(filter);
        const now = new Date();
        let newStartDate, newEndDate;
        switch (filter) {
            case "This Month": [newStartDate, newEndDate] = [startOfMonth(now), endOfMonth(now)]; break;
            case "Last Month": const last = subMonths(now, 1); [newStartDate, newEndDate] = [startOfMonth(last), endOfMonth(last)]; break;
            case "Last 6 Months": [newStartDate, newEndDate] = [startOfMonth(subMonths(now, 5)), endOfMonth(now)]; break;
            case "This Year": [newStartDate, newEndDate] = [startOfYear(now), endOfYear(now)]; break;
            default: [newStartDate, newEndDate] = [startOfMonth(now), endOfMonth(now)];
        }
        setDateRange([newStartDate, newEndDate]);
    };
    
    const handleDateChange = (update) => {
        setDateRange(update);
        setActiveFilter('Custom');
    };

    const handleSendEmail = async (rowData) => {
        setSendingEmailId(rowData._id);
        try {
            await sendPaymentEmail({
                interviewerId: rowData._id,
                email: rowData.email,
                name: rowData.fullName,
                monthYear: new Date(startDate).toLocaleString('default', { month: 'long', year: 'numeric' }),
                payPerInterview: rowData.paymentAmount,
                interviewCount: rowData.interviewsCompleted,
                totalAmount: rowData.totalAmount,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            });
            showSuccess(`Payment confirmation sent to ${rowData.fullName}.`);
            setRequests(prevRequests =>
                prevRequests.map(req =>
                    req._id === rowData._id
                        ? { ...req, emailSentStatus: 'Sent', confirmationStatus: 'Pending' }
                        : req
                )
            );
        } catch(err) {
            showError("Failed to send email.");
        } finally {
            setSendingEmailId(null);
        }
    };
    
    const handleSendInvoiceEmail = async (rowData) => {
        setSendingInvoiceId(rowData._id);
        try {
            const emailPayload = {
                interviewerId: rowData._id,
                email: rowData.email,
                name: rowData.fullName,
                interviewCount: rowData.interviewsCompleted,
                totalAmount: rowData.totalAmount,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            };
            await sendInvoiceEmail(emailPayload);
            showSuccess(`Invoice redeem email sent to ${rowData.fullName}.`);
            setRequests(prevRequests =>
                prevRequests.map(req =>
                    req._id === rowData._id
                        ? { ...req, invoiceEmailSentStatus: 'Sent' }
                        : req
                )
            );
        } catch(err) {
            showError("Failed to send invoice email.");
        } finally {
            setSendingInvoiceId(null);
        }
    };
    
    const handleSendPaymentReceivedEmail = async (rowData) => {
        setSendingPaymentReceivedId(rowData._id);
        try {
            await sendPaymentReceivedEmail({
                 interviewerId: rowData._id,
                 email: rowData.email,
                 name: rowData.fullName,
                 startDate: startDate.toISOString(),
                 endDate: endDate.toISOString(),
                 totalAmount: rowData.totalAmount,
                 interviewCount: rowData.interviewsCompleted,
            });
            showSuccess(`"Payment Received" confirmation sent to ${rowData.fullName}.`);
            setRequests(prev => prev.map(r => r._id === rowData._id ? {...r, paymentReceivedEmailSentAt: new Date()} : r));
        } catch(err) {
            showError("Failed to send email.");
        } finally {
            setSendingPaymentReceivedId(null);
        }
    };

    const columns = useMemo(() => [
        { key: 'month', title: 'Month', render: () => startDate ? startDate.toLocaleString('default', { month: 'long', year: 'numeric' }) : '' },
        { key: 'interviewerId', title: 'Interviewer ID' },
        { key: 'fullName', title: 'Interviewer Name' },
        { key: 'email', title: 'Interviewer Email' },
        { key: 'mobileNumber', title: 'Mobile Number' },
        { key: 'paymentAmount', title: 'Amount', render: (row) => row.paymentAmount },
        { key: 'companyType', title: 'Type of Company' },
        { key: 'interviewsCompleted', title: 'Count', render: (row) => (<div className="text-center font-semibold">{row.interviewsCompleted}</div>) },
        { key: 'totalAmount', title: 'Total Amount', render: (row) => <span className="font-bold">{formatCurrency(row.totalAmount)}</span> },
        { key: 'actions', title: 'Actions', render: (row) => (
            <LocalButton onClick={() => handleSendEmail(row)} isLoading={sendingEmailId === row._id} variant="primary" className="!text-xs !py-1 !px-3" title="Send Payment Confirmation" disabled={row.emailSentStatus === 'Sent'}>
                {row.emailSentStatus === 'Sent' ? 'Sent' : 'Send'}
            </LocalButton>
        )},
        { key: 'emailSentStatus', title: 'Status', render: (row) => <Badge variant={row.emailSentStatus === 'Sent' ? 'success' : 'gray'}>{row.emailSentStatus}</Badge>},
        { key: 'confirmationStatus', title: 'Confirmation', render: (row) => <Badge variant={row.confirmationStatus === 'Confirmed' ? 'success' : row.confirmationStatus === 'Disputed' ? 'danger' : 'warning'}>{row.confirmationStatus}</Badge>},
        { key: 'confirmationRemarks', title: 'Confirmation Remarks',  render: (row) => { const remarks = row.confirmationRemarks; const charLimit = 30; if (!remarks) return <span className="text-gray-400">--</span>; if (remarks.length <= charLimit) return <span title={remarks}>{remarks}</span>; return (<div className="flex items-center"><span className="truncate" title={remarks}>{remarks.substring(0, charLimit)}...</span><button onClick={() => setRemarksModal({ isOpen: true, content: remarks })} className="ml-1 text-blue-600 hover:underline text-xs font-semibold flex-shrink-0">more</button></div>); } },
        { key: 'invoiceMail', title: 'Invoice Mail', render: (row) => ( <LocalButton onClick={() => handleSendInvoiceEmail(row)} isLoading={sendingInvoiceId === row._id} variant="primary" className="!text-xs !py-1 !px-3" disabled={row.invoiceEmailSentStatus === 'Sent'}> {row.invoiceEmailSentStatus === 'Sent' ? 'Sent' : 'Send'} </LocalButton>) },
        { key: 'invoiceMailStatus', title: 'Status', render: (row) => <Badge variant={row.invoiceEmailSentStatus === 'Sent' ? 'success' : 'gray'}>{row.invoiceEmailSentStatus}</Badge> },
        
        // ** FOUR NEW COLUMNS **
        {
            key: 'paymentReceivedMail',
            title: 'Payment Received',
            render: (row) => (
                <LocalButton
                    onClick={() => handleSendPaymentReceivedEmail(row)}
                    isLoading={sendingPaymentReceivedId === row._id}
                    variant="primary"
                    className="!text-xs !py-1 !px-3"
                    disabled={!!row.paymentReceivedEmailSentAt}
                >
                    {row.paymentReceivedEmailSentAt ? 'Sent' : 'Send'}
                </LocalButton>
            )
        },
        {
            key: 'paymentReceivedMailStatus',
            title: 'Status',
            render: (row) => <Badge variant={row.paymentReceivedEmailSentAt ? 'success' : 'gray'}>{row.paymentReceivedEmailSentAt ? 'Sent' : 'Not Sent'}</Badge>
        },
        {
            key: 'paymentReceivedStatus',
            title: 'Payment Received',
            render: (row) => <Badge variant={row.paymentReceivedStatus === 'Received' ? 'success' : row.paymentReceivedStatus === 'Not Received' ? 'danger' : 'warning'}>{row.paymentReceivedStatus}</Badge>
        },
        {
            key: 'paymentReceivedRemarks',
            title: 'Payment Remarks',
            render: (row) => {
                const remarks = row.paymentReceivedRemarks;
                const charLimit = 30;
                if (!remarks) {
                    return <span className="text-gray-400">--</span>;
                }
                if (remarks.length <= charLimit) {
                    return <span title={remarks}>{remarks}</span>;
                }
                return (
                    <div className="flex items-center">
                        <span className="truncate" title={remarks}>
                            {remarks.substring(0, charLimit)}...
                        </span>
                        <button 
                            onClick={() => setRemarksModal({ isOpen: true, content: remarks })} 
                            className="ml-1 text-blue-600 hover:underline text-xs font-semibold flex-shrink-0">
                            more
                        </button>
                    </div>
                );
            }
        },
    ], [startDate, endDate, sendingEmailId, sendingInvoiceId, sendingPaymentReceivedId, fetchRequests, setRemarksModal]);


    const filterOptions = ["This Month", "Last Month", "Last 6 Months", "This Year"];

    return (
        <div className="bg-white shadow-sm border border-gray-200">
            <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Payment Requests</h3>
                <div className="flex items-center gap-2">
                     <div className="w-full sm:w-72">
                        <DatePicker
                            selectsRange={true}
                            startDate={startDate}
                            endDate={endDate}
                            onChange={handleDateChange}
                            isClearable={true}
                            className="w-full form-input py-2"
                            popperPlacement="bottom-end"
                            popperClassName="z-30"
                        />
                    </div>
                    <Menu as="div" className="relative inline-block text-left">
                         <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                             {activeFilter !== 'Custom' ? activeFilter : "Presets"}
                             <FiChevronDown className="-mr-1 ml-2 h-5 w-5" />
                         </Menu.Button>
                         <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                             <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-30 focus:outline-none">
                                 <div className="py-1">
                                     {filterOptions.map(opt => (
                                         <Menu.Item key={opt}>
                                             {({ active }) => (
                                                 <button onClick={() => handleFilterClick(opt)} className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block w-full text-left px-4 py-2 text-sm`}>
                                                     {opt}
                                                 </button>
                                             )}
                                         </Menu.Item>
                                     ))}
                                 </div>
                             </Menu.Items>
                         </Transition>
                     </Menu>
                </div>
            </div>
            <div className="overflow-x-auto">
                <LocalPaymentTable columns={columns} data={requests} isLoading={loading} emptyMessage="No payment requests for this period." />
            </div>

            <RemarksModal
                isOpen={remarksModal.isOpen}
                onClose={() => setRemarksModal({ isOpen: false, content: '' })}
                content={remarksModal.content}
            />
        </div>
    );
};


const EarningsReportPage = () => {
    const [activeView, setActiveView] = useState('payments');

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
            <div className="w-full">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Link to="/admin/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium mb-2 group">
                            <FiArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Back to Dashboard
                        </Link>
                    </div>
                     <div className="bg-gray-200 p-1 rounded-full flex self-end sm:self-center">
                        <button
                            onClick={() => setActiveView('payments')}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-300 ${activeView === 'payments' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-600'}`}
                        >
                            Payment Requests
                        </button>
                        <button
                            onClick={() => setActiveView('payout')}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-300 ${activeView === 'payout' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-600'}`}
                        >
                            PayOut Sheet
                        </button>
                    </div>
                </div>

                {activeView === 'payments' && <PaymentRequestsView />}
                {activeView === 'payout' && <PayoutSheetView />}

            </div>
        </div>
    );
};

export default EarningsReportPage;
