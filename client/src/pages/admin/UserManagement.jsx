// client/src/pages/admin/UserManagement.jsx
import React, { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { FiEdit, FiFilter, FiSearch, FiRefreshCw, FiPlus, FiTrash2, FiToggleLeft, FiToggleRight, FiMoreVertical } from 'react-icons/fi';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import { Menu, Transition } from '@headlessui/react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SearchInput from '../../components/common/SearchInput';
import FilterDropdown from '../../components/common/FilterDropdown';
import { getUsers, deleteUser, updateUser } from '../../api/admin.api';
import { formatDateTime } from '../../utils/formatters';
import { debounce } from '../../utils/helpers';
import { useAlert } from '../../hooks/useAlert';
import UserFormModal from './UserFormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const UserManagement = () => {
    const { showSuccess, showError } = useAlert();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
    const [sortConfig, setSortConfig] = useState({ key: 'lastLogin', direction: 'desc' });
    const [filters, setFilters] = useState({ search: '', role: '' });
    
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, user: null });

    function classNames(...classes) {
        return classes.filter(Boolean).join(' ');
    }

    const roleOptions = useMemo(() => [
        { value: '', label: 'All Roles' }, { value: 'admin', label: 'Admin' }, { value: 'interviewer', label: 'Interviewer' },
    ], []);

    const fetchUsers = useCallback(() => {
        setLoading(true);
        const params = {
            page: pagination.currentPage, limit: 10,
            search: filters.search, role: filters.role,
            sortBy: sortConfig.key, sortOrder: sortConfig.direction,
        };
        getUsers(params)
            .then(response => {
                const { users, ...paginationData } = response.data.data;
                setUsers(users || []);
                // --- FIX STARTS HERE ---
                // Map the API response fields to your state's fields
                setPagination({
                    currentPage: paginationData.page,
                    totalPages: paginationData.totalPages,
                    totalItems: paginationData.totalDocs
                });
                // --- FIX ENDS HERE ---
            })
            .catch(error => {
                showError('Failed to fetch user data.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [pagination.currentPage, filters, sortConfig, showError]);
    
    // This single effect handles all data fetching with debounce
    useEffect(() => {
        const handler = debounce(fetchUsers, 300);
        handler();
        return () => handler.cancel();
    }, [fetchUsers]);
    
    const handleFilterChange = (key, value) => {
        setPagination(p => ({...p, currentPage: 1 }));
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSort = (key) => {
        setPagination(p => ({...p, currentPage: 1 }));
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };
    
    const handleModalSuccess = () => {
        setModalState({ type: null, data: null });
        fetchUsers();
    };

    const handleDelete = async () => {
        if(!deleteDialog.user) return;
        try {
            await deleteUser(deleteDialog.user._id);
            showSuccess(`User ${deleteDialog.user.fullName} has been deactivated.`);
            setDeleteDialog({ isOpen: false, user: null });
            fetchUsers();
        } catch (err) {
            showError('Failed to deactivate user.');
        }
    };

    const toggleActiveStatus = async (user) => {
        try {
            await updateUser(user._id, { isActive: !user.isActive });
            showSuccess(`User status updated successfully.`);
            fetchUsers();
        } catch (err) {
            showError('Failed to update user status.');
        }
    };

    const userColumns = useMemo(() => [
        { key: 'fullName', title: 'Full Name', sortable: true },
        { key: 'email', title: 'Email', sortable: true },
        {
            key: 'role', title: 'Role', sortable: true, render: (row) => (
                <Badge
                    variant={row.role === 'admin' ? 'info' : 'success'}
                    className="capitalize"
                >
                    {row.role}
                </Badge>
            )
        },
        { 
            key: 'isActive', title: 'Status', sortable: true, 
            render: (row) => (
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  row.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                  {row.isActive ? 'Active' : 'Inactive'}
              </span>
            ) 
        },
        { key: 'lastLogin', title: 'Last Login', sortable: true, render: (row) => row.lastLogin ? formatDateTime(row.lastLogin) : 'Never' },
        {
            key: 'actions', title: 'Actions', render: (row) => (
                <Menu as="div" className="relative inline-block text-left">
                    <div>
                        <Menu.Button className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-transparent text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            <span className="sr-only">Open options</span>
                            <FiMoreVertical className="h-5 w-5" aria-hidden="true" />
                        </Menu.Button>
                    </div>
                    <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="py-1">
                                <Menu.Item>
                                    {({ active }) => (<button onClick={() => setModalState({ type: 'edit', data: row })} className={classNames(active ? 'bg-gray-100' : '', 'group flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left')}><FiEdit className="mr-3 h-5 w-5 text-gray-400" />Edit User</button>)}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (
                                        <button onClick={() => toggleActiveStatus(row)} className={classNames(active ? 'bg-gray-100' : '', 'group flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left')}>
                                            {row.isActive ? <FiToggleLeft className="mr-3 h-5 w-5 text-gray-400" /> : <FiToggleRight className="mr-3 h-5 w-5 text-gray-400" />}
                                            {row.isActive ? 'Deactivate User' : 'Activate User'}
                                        </button>
                                    )}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (
                                        <button onClick={() => setDeleteDialog({ isOpen: true, user: row })} className={classNames(active ? 'bg-red-50' : '', 'group flex items-center px-4 py-2 text-sm text-red-700 w-full text-left')}>
                                            <FiTrash2 className="mr-3 h-5 w-5 text-red-400" />
                                            Delete User (Soft)
                                        </button>
                                    )}
                                </Menu.Item>
                            </div>
                        </Menu.Items>
                    </Transition>
                </Menu>
            ),
        },
    ], [toggleActiveStatus, setModalState, setDeleteDialog]);

    return (
        <div className="space-y-6">
            <Card>
                <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <SearchInput value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} onClear={() => handleFilterChange('search', '')} placeholder="Search by name or email..." className="w-full md:w-72" />
                    <div className="flex items-center gap-4 flex-wrap">
                        <FilterDropdown label="Role" options={roleOptions} selectedValue={filters.role} onChange={(val) => handleFilterChange('role', val)} />
                        <Button variant="primary" icon={<FiPlus size={20} />} onClick={() => setModalState({ type: 'add', data: null })}>Add</Button>
                    </div>
                </div>

                <Table columns={userColumns} data={users} isLoading={loading} pagination={pagination} onPageChange={handlePageChange} sortConfig={sortConfig} onSort={handleSort} emptyMessage="No users found." />
            </Card>

            {modalState.type && <UserFormModal isOpen={!!modalState.type} onClose={() => setModalState({ type: null, data: null })} onSuccess={handleModalSuccess} userData={modalState.data} />}
            <ConfirmDialog isOpen={deleteDialog.isOpen} onClose={() => setDeleteDialog({ isOpen: false, user: null })} onConfirm={handleDelete} title="Deactivate User" message={`Are you sure you want to deactivate the user "${deleteDialog.user?.fullName}"?`} />
        </div>
    );
};

export default UserManagement;
