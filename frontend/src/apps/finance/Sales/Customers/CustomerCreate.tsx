import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateFormModalpage } from '@/finance-inventory-shared/createform/CreateFormModalpage';
import { Mail, Info } from 'lucide-react';
import { OtherDetails } from './CustomersComponents/CustomerCreate-tabs/OtherDetails';
import { Address } from './CustomersComponents/CustomerCreate-tabs/Address';
import { ContactPersons } from './CustomersComponents/CustomerCreate-tabs/ContactPersons';
import { Remarks } from './CustomersComponents/CustomerCreate-tabs/Remarks';

interface CustomerFormData {
  customerType: 'business' | 'individual';
  salutation: string;
  firstName: string;
  lastName: string;
  companyName: string;
  displayName: string;
  emailAddress: string;
  workPhoneCountryCode: string;
  workPhone: string;
  mobileCountryCode: string;
  mobile: string;
  // Other Details fields
  vatTreatment: string;
  vatCountryCode: string;
  vatRegistrationNumber: string;
  companyRegistrationNumber: string;
  currency: string;
  accountsReceivable: string;
  openingBalance: string;
  paymentTerms: string;
  priceList: string;
  allowDirectDebit: boolean;
  enablePortal: boolean;
  portalLanguage: string;
  // Address fields - Billing
  billingAttention: string;
  billingCountryRegion: string;
  billingAddress: string;
  billingAddress2: string;
  billingCity: string;
  billingStateCounty: string;
  billingPostalCode: string;
  billingPhoneCountryCode: string;
  billingPhone: string;
  billingFax: string;
  // Address fields - Shipping
  shippingAttention: string;
  shippingCountryRegion: string;
  shippingAddress: string;
  shippingAddress2: string;
  shippingCity: string;
  shippingStateCounty: string;
  shippingPostalCode: string;
  shippingPhoneCountryCode: string;
  shippingPhone: string;
  shippingFax: string;
  // Contact Persons
  contactPersons: any[];
  // Remarks
  remarks: string;
}

export const CustomerCreate: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('otherDetails');
  const [formData, setFormData] = useState<CustomerFormData>({
    customerType: 'business',
    salutation: '',
    firstName: '',
    lastName: '',
    companyName: '',
    displayName: '',
    emailAddress: '',
    workPhoneCountryCode: '+44',
    workPhone: '',
    mobileCountryCode: '+44',
    mobile: '',
    // Other Details fields
    vatTreatment: '',
    vatCountryCode: 'GB',
    vatRegistrationNumber: '',
    companyRegistrationNumber: '',
    currency: 'GBP',
    accountsReceivable: '',
    openingBalance: '',
    paymentTerms: '',
    priceList: '',
    allowDirectDebit: false,
    enablePortal: false,
    portalLanguage: '',
    // Address fields - Billing
    billingAttention: '',
    billingCountryRegion: '',
    billingAddress: '',
    billingAddress2: '',
    billingCity: '',
    billingStateCounty: '',
    billingPostalCode: '',
    billingPhoneCountryCode: '+44',
    billingPhone: '',
    billingFax: '',
    // Address fields - Shipping
    shippingAttention: '',
    shippingCountryRegion: '',
    shippingAddress: '',
    shippingAddress2: '',
    shippingCity: '',
    shippingStateCounty: '',
    shippingPostalCode: '',
    shippingPhoneCountryCode: '+44',
    shippingPhone: '',
    shippingFax: '',
    // Contact Persons
    contactPersons: [],
    // Remarks
    remarks: ''
  });

  const handleClose = () => {
    navigate('/finance/sales/customers');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation for required fields
    if (!formData.displayName.trim()) {
      alert('Display Name is required');
      return;
    }
    
    setIsSubmitting(true);
    
    // TODO: Implement customer creation logic
    console.log('Creating new customer...', formData);
    
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/finance/sales/customers');
    }, 1000);
  };

  const handleInputChange = (field: keyof CustomerFormData, value: string | boolean | any[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <CreateFormModalpage
      isOpen={true}
      onClose={handleClose}
      title="New Customer"
      onSubmit={handleSubmit}
      submitLabel="Save"
      isSubmitting={isSubmitting}
    >
      <div className="space-y-6 max-w-4xl">
        {/* Customer Type */}
        <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
          <div className="flex items-center space-x-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Customer Type
            </label>
            <Info className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="customerType"
                value="business"
                checked={formData.customerType === 'business'}
                onChange={(e) => handleInputChange('customerType', e.target.value as 'business' | 'individual')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Business</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="customerType"
                value="individual"
                checked={formData.customerType === 'individual'}
                onChange={(e) => handleInputChange('customerType', e.target.value as 'business' | 'individual')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Individual</span>
            </label>
          </div>
        </div>

        {/* Primary Contact */}
        <div className="grid grid-cols-[200px,1fr] gap-4 items-start">
          <div className="flex items-center space-x-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Primary Contact
            </label>
            <Info className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <div className="grid grid-cols-3 gap-4">
              {/* Salutation */}
              <div>
                <select
                  value={formData.salutation}
                  onChange={(e) => handleInputChange('salutation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Salutation</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Dr.">Dr.</option>
                </select>
              </div>
              {/* First Name */}
              <div>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="First Name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              {/* Last Name */}
              <div>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Last Name*"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Company Name */}
        <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Company Name
          </label>
          <div className="w-[70%]">
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Display Name */}
        <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
          <div className="flex items-center space-x-1">
            <label className="text-sm font-medium text-red-500">
              Display Name
            </label>
            <span className="text-red-500">*</span>
            <Info className="w-4 h-4 text-gray-400" />
          </div>
          <div className="w-[70%]">
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              placeholder="Enter display name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Email Address */}
        <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
          <div className="flex items-center space-x-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <Info className="w-4 h-4 text-gray-400" />
          </div>
          <div className="w-[70%] relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="email"
              value={formData.emailAddress}
              onChange={(e) => handleInputChange('emailAddress', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
          <div className="flex items-center space-x-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone
            </label>
            <Info className="w-4 h-4 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Work Phone */}
            <div className="flex">
              <select
                value={formData.workPhoneCountryCode}
                onChange={(e) => handleInputChange('workPhoneCountryCode', e.target.value)}
                className="flex-shrink-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-r-0"
              >
                <option value="+44">+44</option>
                <option value="+1">+1</option>
                <option value="+91">+91</option>
              </select>
              <input
                type="tel"
                value={formData.workPhone}
                onChange={(e) => handleInputChange('workPhone', e.target.value)}
                placeholder="Work Phone"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            {/* Mobile */}
            <div className="flex">
              <select
                value={formData.mobileCountryCode}
                onChange={(e) => handleInputChange('mobileCountryCode', e.target.value)}
                className="flex-shrink-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-r-0"
              >
                <option value="+44">+44</option>
                <option value="+1">+1</option>
                <option value="+91">+91</option>
              </select>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                placeholder="Mobile"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'otherDetails', name: 'Other Details' },
              { id: 'address', name: 'Address' },
              { id: 'contactPersons', name: 'Contact Persons' },
              { id: 'customFields', name: 'Custom Fields' },
              { id: 'reportingTags', name: 'Reporting Tags' },
              { id: 'remarks', name: 'Remarks' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-4">
          {activeTab === 'otherDetails' && (
            <OtherDetails 
              formData={formData} 
              handleInputChange={handleInputChange} 
            />
          )}
          {activeTab === 'address' && (
            <Address 
              formData={formData} 
              handleInputChange={handleInputChange} 
            />
          )}
          {activeTab === 'contactPersons' && (
            <div className="relative -mx-6 px-6" style={{ width: 'calc(100vw - 20rem)' }}>
              <ContactPersons 
                formData={formData} 
                handleInputChange={handleInputChange} 
              />
            </div>
          )}
          {activeTab === 'customFields' && (
            <div className="text-gray-500 dark:text-gray-400">
              Custom Fields content will go here
            </div>
          )}
          {activeTab === 'reportingTags' && (
            <div className="text-gray-500 dark:text-gray-400">
              Reporting Tags content will go here
            </div>
          )}
          {activeTab === 'remarks' && (
            <Remarks 
              formData={formData} 
              handleInputChange={handleInputChange} 
            />
          )}
        </div>
      </div>
    </CreateFormModalpage>
  );
};