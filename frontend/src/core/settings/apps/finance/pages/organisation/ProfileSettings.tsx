import React, { useState } from 'react'
import { Plus, MoreHorizontal, Building2, MapPin, Phone, Mail } from 'lucide-react'
import { AllSettingsHeader } from '../../../../shared/components/AllSettingsHeader'
import { Button } from '@/shared/components/buttons/Button'


export const ProfileSettings: React.FC = () => {
  const [profile] = useState<any>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  const breadcrumbs = [
    { label: 'All Settings' },
    { label: 'Organisation' },
    { label: 'Profile' }
  ]

  const handleEditProfile = () => {
    setIsEditing(!isEditing)
    console.log('Edit profile clicked')
  }

  const handleSaveProfile = () => {
    setIsEditing(false)
    console.log('Save profile clicked')
  }

  const handleExportProfile = () => {
    console.log('Export profile clicked')
  }

  const rightActions = (
    <div className="flex items-center space-x-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleExportProfile}
      >
        Export Profile
      </Button>
      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <MoreHorizontal className="w-5 h-5" />
      </button>
    </div>
  )

  const actions = (
    <Button
      onClick={isEditing ? handleSaveProfile : handleEditProfile}
      className={isEditing ? "bg-green-600 hover:bg-green-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
      size="sm"
    >
      {isEditing ? 'Save Changes' : 'Edit Profile'}
    </Button>
  )

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AllSettingsHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search settings..."
        title="Organisation Profile"
        breadcrumbs={breadcrumbs}
        actions={actions}
        rightActions={rightActions}
      />

      <div className="p-6 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Company Information</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white font-medium">{profile.companyName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Legal Name</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{profile.legalName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Registration Number</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">{profile.registrationNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tax ID</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">{profile.taxId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Industry</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{profile.industry}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Employees</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{profile.employees}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Founded</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{profile.founded}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Website</label>
                  <p className="mt-1 text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">{profile.website}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Contact Information</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <p className="text-sm text-gray-900 dark:text-white">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                  <p className="text-sm text-gray-900 dark:text-white">{profile.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fax</label>
                  <p className="text-sm text-gray-900 dark:text-white">{profile.fax}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Business Address */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Business Address</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-1 text-sm text-gray-900 dark:text-white">
                <p>{profile.address?.street}</p>
                <p>{profile.address?.city}, {profile.address?.state} {profile.address?.zipCode}</p>
                <p>{profile.address?.country}</p>
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Billing Address</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-1 text-sm text-gray-900 dark:text-white">
                <p>{profile.billingAddress?.street}</p>
                <p>{profile.billingAddress?.city}, {profile.billingAddress?.state} {profile.billingAddress?.zipCode}</p>
                <p>{profile.billingAddress?.country}</p>
              </div>
              {JSON.stringify(profile.address) === JSON.stringify(profile.billingAddress) && (
                <div className="mt-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Same as business address
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Organisation Profile
              </h3>
              <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  Your organisation profile information appears on invoices, quotes, and other business documents. 
                  Keep this information up to date to maintain professionalism in your business communications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}