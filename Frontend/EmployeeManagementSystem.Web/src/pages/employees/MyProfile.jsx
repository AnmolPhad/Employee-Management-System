import React, { useState, useEffect } from 'react';
import {
  FiUser,
  FiBriefcase,
  FiMail,
  FiPhone,
  FiCalendar,
  FiMapPin,
  FiInfo,
} from 'react-icons/fi';
import employeeApi from '../../api/employeeApi';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { formatDate, formatEmploymentStatus } from '../../utils/formatters';

const getInitials = (firstName, lastName, fullName) => {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  return 'ME';
};

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await employeeApi.getMyProfile();
        if (res && res.data) {
          setProfile(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12">
        <LoadingSpinner message="Loading your personnel profile..." />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-4">
        <ErrorMessage
          message={error || 'Could not load your profile.'}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const initials = getInitials(profile.firstName, profile.lastName, profile.fullName);
  const displayName =
    profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your personal and organizational records registered in the system
        </p>
      </div>

      {/* Profile Overview Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
            {initials}
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight truncate">
                {displayName}
              </h2>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                {profile.employeeCode}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge status={profile.roleName} text={profile.roleName || 'Employee'} />
              <Badge
                status={profile.employmentStatus}
                text={formatEmploymentStatus(profile.employmentStatus)}
              />
              <span className="text-xs text-slate-400 font-medium">
                Department: <strong className="text-slate-700 font-semibold">{profile.departmentName || 'None'}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs sm:text-sm">
        <FiInfo className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold">Notice:</span> Official personnel data is managed directly by Human Resources. If any details are inaccurate or need updating, please reach out to your HR specialist.
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employment Information */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FiBriefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Employment Details</h3>
              <p className="text-xs text-slate-500">Corporate placement and organizational reporting</p>
            </div>
          </div>

          <div className="space-y-3.5 text-sm divide-y divide-slate-50">
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Employee Code</span>
              <span className="font-mono font-semibold text-slate-800">{profile.employeeCode}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Department</span>
              <span className="font-semibold text-slate-800">{profile.departmentName || '-'}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Designation / Role</span>
              <span className="font-semibold text-slate-800">{profile.roleName || '-'}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Reporting Manager</span>
              <span className="font-semibold text-slate-800">
                {profile.managerName || 'None (Top-Level)'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Employment Status</span>
              <Badge
                status={profile.employmentStatus}
                text={formatEmploymentStatus(profile.employmentStatus)}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Date of Joining</span>
              <span className="font-semibold text-slate-800">{formatDate(profile.dateOfJoining)}</span>
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FiUser className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Personal Information</h3>
              <p className="text-xs text-slate-500">Contact details and identity information</p>
            </div>
          </div>

          <div className="space-y-3.5 text-sm divide-y divide-slate-50">
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Full Legal Name</span>
              <span className="font-semibold text-slate-800">{displayName}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Email Address</span>
              <span className="font-medium text-slate-800 flex items-center gap-1.5">
                <FiMail className="w-3.5 h-3.5 text-slate-400" />
                <span>{profile.email}</span>
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Phone Number</span>
              <span className="font-medium text-slate-800 flex items-center gap-1.5">
                <FiPhone className="w-3.5 h-3.5 text-slate-400" />
                <span>{profile.phone || '-'}</span>
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Gender</span>
              <span className="font-semibold text-slate-800">{profile.gender || '-'}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 font-medium">Date of Birth</span>
              <span className="font-semibold text-slate-800">{formatDate(profile.dateOfBirth)}</span>
            </div>

            <div className="pt-2">
              <span className="text-slate-500 font-medium block mb-1">Residential Address</span>
              <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs leading-relaxed">
                {profile.address || 'No address registered on file.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
