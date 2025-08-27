import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, Search, ChevronDown, Check } from 'lucide-react';
import { NewFormModalbox } from '@/finance-inventory-shared';
import { useCreateChartOfAccount, useUpdateChartOfAccount, useChartOfAccount, mapFrontendToBackendAccountType, useChartOfAccounts, mapBackendToFrontendAccountType } from '../../api/chartOfAccounts';
import type { ChartOfAccountCreate, ChartOfAccountListItem } from '../../api/chartOfAccounts';
import { useBaseCurrency } from '../../api/currencies';

interface AccountCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (accountData: AccountFormData) => void;
  mode?: 'create' | 'edit';
  accountId?: number | null;
}

interface AccountFormData {
  accountType: string;
  accountName: string;
  accountCode: string;
  vatReturnPreference: boolean;
  description: string;
  addToWatchlist: boolean;
  makeSubAccount: boolean;
  parentAccount: string;
  accountNumber: string;
  routingNumber: string;
  currency: string;
}

const currencyOptions = [
  { value: 'AED', label: 'AED' },
  { value: 'AUD', label: 'AUD' },
  { value: 'CAD', label: 'CAD' },
  { value: 'CNY', label: 'CNY' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'INR', label: 'INR' },
  { value: 'JPY', label: 'JPY' },
  { value: 'SAR', label: 'SAR' },
  { value: 'USD', label: 'USD' },
  { value: 'ZAR', label: 'ZAR' }
];

const accountTypeCategories = {
  'Asset': [
    { value: 'Other Asset', label: 'Other Asset' },
    { value: 'Other Current Asset', label: 'Other Current Asset' },
    { value: 'Cash', label: 'Cash' },
    { value: 'Bank', label: 'Bank' },
    { value: 'Fixed Asset', label: 'Fixed Asset' },
    { value: 'Accounts Receivable', label: 'Accounts Receivable' },
    { value: 'Stock', label: 'Stock' },
    { value: 'Payment Clearing Account', label: 'Payment Clearing Account' },
    { value: 'Intangible Asset', label: 'Intangible Asset' },
    { value: 'Non Current Asset', label: 'Non Current Asset' },
    { value: 'Deferred Tax Asset', label: 'Deferred Tax Asset' }
  ],
  'Liability': [
    { value: 'Other Current Liability', label: 'Other Current Liability' },
    { value: 'Credit Card', label: 'Credit Card' },
    { value: 'Non Current Liability', label: 'Non Current Liability' },
    { value: 'Other Liability', label: 'Other Liability' },
    { value: 'Accounts Payable', label: 'Accounts Payable' },
    { value: 'Deferred Tax Liability', label: 'Deferred Tax Liability' }
  ],
  'Equity': [
    { value: 'Equity', label: 'Equity' }
  ],
  'Income': [
    { value: 'Income', label: 'Income' },
    { value: 'Other Income', label: 'Other Income' }
  ],
  'Expense': [
    { value: 'Expense', label: 'Expense' },
    { value: 'Cost Of Goods Sold', label: 'Cost Of Goods Sold' },
    { value: 'Other Expense', label: 'Other Expense' }
  ]
};

export const AccountCreate: React.FC<AccountCreateProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode = 'create',
  accountId = null
}) => {
  const createAccountMutation = useCreateChartOfAccount();
  const updateAccountMutation = useUpdateChartOfAccount();
  
  // Fetch base currency
  const { data: baseCurrency } = useBaseCurrency();
  
  // Fetch account data for editing when in edit mode
  const shouldFetchAccount = mode === 'edit' && accountId && accountId > 0;
  const { data: accountData, isLoading: isLoadingAccount } = useChartOfAccount(
    shouldFetchAccount ? accountId : 0
  );
  const [formData, setFormData] = useState<AccountFormData>({
    accountType: 'Other Asset',
    accountName: '',
    accountCode: '',
    vatReturnPreference: false,
    description: '',
    addToWatchlist: false,
    makeSubAccount: false,
    parentAccount: '',
    accountNumber: '',
    routingNumber: '',
    currency: baseCurrency?.currency_code || 'GBP'
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AccountFormData, string>>>({});
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currencySearchTerm, setCurrencySearchTerm] = useState('');
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const [parentSearchTerm, setParentSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  // Fetch accounts for parent account dropdown (only when makeSubAccount is true)
  const { 
    data: parentAccountsResponse, 
    isLoading: isLoadingParentAccounts 
  } = useChartOfAccounts(1, 100, parentSearchTerm, { 
    filter_by: 'AccountType.All' 
  });

  // Reset form data when switching modes or opening modal
  useEffect(() => {
    console.log('NewAccountCreateBox - useEffect triggered:', { mode, accountData, isOpen, accountId, isLoadingAccount });
    
    if (isOpen) {
      if (mode === 'create') {
        console.log('NewAccountCreateBox - Setting form data for create mode');
        // Reset to default values for create mode
        setFormData({
          accountType: 'Other Asset',
          accountName: '',
          accountCode: '',
          vatReturnPreference: false,
          description: '',
          addToWatchlist: false,
          makeSubAccount: false,
          parentAccount: '',
          accountNumber: '',
          routingNumber: '',
          currency: baseCurrency?.currency_code || 'GBP'
        });
      } else if (mode === 'edit' && accountData && !isLoadingAccount) {
        console.log('NewAccountCreateBox - Setting form data for edit mode with account data:', accountData);
        // Populate form with account data in edit mode
        const mappedAccountType = mapBackendToFrontendAccountType(accountData.account_type);
        
        const formDataToSet = {
          accountType: mappedAccountType,
          accountName: accountData.account_name || '',
          accountCode: accountData.account_code || '',
          vatReturnPreference: accountData.include_in_vat_return || false,
          description: accountData.description || '',
          addToWatchlist: accountData.show_on_dashboard || false,
          makeSubAccount: !!accountData.parent_account,
          parentAccount: accountData.parent_account ? accountData.parent_account.toString() : '',
          accountNumber: accountData.bank_account_number || '',
          routingNumber: '', // This field doesn't exist in backend, keeping as is
          currency: accountData.currency_code || baseCurrency?.currency_code || 'GBP'
        };
        
        console.log('NewAccountCreateBox - Form data to set:', formDataToSet);
        setFormData(formDataToSet);
      } else if (mode === 'edit' && !accountData && isLoadingAccount) {
        console.log('NewAccountCreateBox - Edit mode but still loading account data...');
      }
      
      // Reset UI states
      setErrors({});
      setShowDropdown(false);
      setSearchTerm('');
      setShowCurrencyDropdown(false);
      setCurrencySearchTerm('');
      setShowParentDropdown(false);
      setParentSearchTerm('');
    }
  }, [mode, accountData, isOpen, accountId, isLoadingAccount, baseCurrency]);

  const handleInputChange = (name: keyof AccountFormData, value: string | number | boolean | undefined) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AccountFormData, string>> = {};

    if (!formData.accountType) {
      newErrors.accountType = 'Account type is required';
    }

    if (!formData.accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    }

    if (formData.makeSubAccount && !formData.parentAccount) {
      newErrors.parentAccount = 'Parent account is required when creating a sub-account';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        // Map frontend form data to backend API format
        const backendData: ChartOfAccountCreate = {
          account_name: formData.accountName.trim(),
          account_type: mapFrontendToBackendAccountType(formData.accountType),
          currency_code: formData.currency,
          include_in_vat_return: formData.vatReturnPreference,
          show_on_dashboard: formData.addToWatchlist,
          can_show_in_ze: true, // Default value, might be required
        };

        // Only add account_code if it has a value
        if (formData.accountCode.trim()) {
          backendData.account_code = formData.accountCode.trim();
        }

        // Only add description if it has a value
        if (formData.description.trim()) {
          backendData.description = formData.description.trim();
        }

        // Only add bank_account_number if it has a value
        if (formData.accountNumber.trim()) {
          backendData.bank_account_number = formData.accountNumber.trim();
        }

        // Only add parent_account if it's a sub-account with a valid parent
        if (formData.makeSubAccount && formData.parentAccount) {
          backendData.parent_account = parseInt(formData.parentAccount);
        }

        console.log(`NewAccountCreateBox - ${mode === 'edit' ? 'Edit' : 'Create'} - Submitting data:`, backendData);

        // Use appropriate mutation based on mode
        const result = mode === 'edit' && accountId
          ? await updateAccountMutation.mutateAsync({ id: accountId, data: backendData })
          : await createAccountMutation.mutateAsync(backendData);
          
        console.log(`NewAccountCreateBox - Account ${mode === 'edit' ? 'updated' : 'created'}:`, result);
        
        // Call onSubmit callback if provided (for backward compatibility)
        onSubmit?.(formData);
        
        // Close modal after successful operation
        handleClose();
      } catch (error) {
        console.error(`Failed to ${mode === 'edit' ? 'update' : 'create'} account:`, error);
        // Error is handled by the mutation internally via React Query
      }
    }
  };

  const handleClose = () => {
    // Only reset form data when in create mode or when actually closing
    if (mode === 'create') {
      setFormData({
        accountType: 'Other Asset',
        accountName: '',
        accountCode: '',
        vatReturnPreference: false,
        description: '',
        addToWatchlist: false,
        makeSubAccount: false,
        parentAccount: '',
        accountNumber: '',
        routingNumber: '',
        currency: baseCurrency?.currency_code || 'GBP'
      });
    }
    
    // Reset UI states
    setErrors({});
    setShowTooltip(false);
    setShowDropdown(false);
    setSearchTerm('');
    setShowCurrencyDropdown(false);
    setCurrencySearchTerm('');
    setShowParentDropdown(false);
    setParentSearchTerm('');
    onClose();
  };

  // Filter account types based on search term
  const filteredCategories = Object.entries(accountTypeCategories).reduce((acc, [category, types]) => {
    const filteredTypes = types.filter(type => 
      type.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filteredTypes.length > 0) {
      acc[category] = filteredTypes;
    }
    return acc;
  }, {} as typeof accountTypeCategories);

  // Filter currencies based on search term
  const filteredCurrencies = currencyOptions.filter(currency =>
    currency.label.toLowerCase().includes(currencySearchTerm.toLowerCase())
  );

  // Helper function to check if an account is a descendant of another account
  const isDescendantOf = (potentialDescendant: ChartOfAccountListItem, ancestorId: number): boolean => {
    if (potentialDescendant.parent_account === ancestorId) {
      return true;
    }
    if (potentialDescendant.parent_account) {
      const parent = parentAccountsData.find(acc => acc.account_id === potentialDescendant.parent_account);
      if (parent) {
        return isDescendantOf(parent, ancestorId);
      }
    }
    return false;
  };

  // Filter parent accounts based on account type and search term
  const parentAccountsData = parentAccountsResponse?.results || parentAccountsResponse?.chartofaccounts || [];
  const filteredParentAccounts = parentAccountsData
    .filter((account: ChartOfAccountListItem) => {
      // Only show accounts of the same type
      const accountFrontendType = mapBackendToFrontendAccountType(account.account_type);
      return accountFrontendType === formData.accountType;
    })
    .filter((account: ChartOfAccountListItem) => {
      // Exclude the current account from being its own parent (in edit mode)
      if (mode === 'edit' && accountId && account.account_id === accountId) {
        return false;
      }
      return true;
    })
    .filter((account: ChartOfAccountListItem) => {
      // Exclude descendant accounts - an account cannot select its own descendant as parent
      if (mode === 'edit' && accountId) {
        if (isDescendantOf(account, accountId)) {
          return false;
        }
      }
      return true;
    })
    .filter((account: ChartOfAccountListItem) => {
      // Filter by search term
      return account.account_name.toLowerCase().includes(parentSearchTerm.toLowerCase()) ||
             account.account_code?.toLowerCase().includes(parentSearchTerm.toLowerCase());
    });

  const handleAccountTypeSelect = (accountType: string) => {
    handleInputChange('accountType', accountType);
    setShowDropdown(false);
    setSearchTerm('');
    
    // Clear parent account if the type changed (parent accounts must be same type)
    if (formData.makeSubAccount && formData.parentAccount && accountType !== formData.accountType) {
      handleInputChange('parentAccount', '');
    }
  };

  const handleCurrencySelect = (currency: string) => {
    handleInputChange('currency', currency);
    setShowCurrencyDropdown(false);
    setCurrencySearchTerm('');
  };

  const handleParentAccountSelect = (accountId: number, accountName: string) => {
    handleInputChange('parentAccount', accountId.toString());
    setShowParentDropdown(false);
    setParentSearchTerm('');
  };

  // Check if current account type should show bank fields
  const shouldShowBankCashFields = formData.accountType === 'Bank';
  
  // Check if current account type should show credit card fields
  const shouldShowCreditCardFields = formData.accountType === 'Credit Card';

  const getAccountCategory = (accountType: string): string => {
    for (const [category, types] of Object.entries(accountTypeCategories)) {
      if (types.some(type => type.value === accountType)) {
        return category;
      }
    }
    return 'Asset';
  };

  const getAccountTypeDescription = (accountType: string): string => {
    switch (accountType) {
      case 'Other Asset':
        return 'Track special assets like goodwill and other intangible assets';
      case 'Other Current Asset':
        return 'Any short term asset that can be converted into cash or cash equivalents easily\n• Prepaid expenses\n• Stocks and Mutual Funds';
      case 'Cash':
        return 'To keep track of cash and other cash equivalents like petty cash, undeposited funds, etc';
      case 'Bank':
        return 'To keep track of bank accounts like Savings, Checking, and Money Market accounts';
      case 'Fixed Asset':
        return 'Any long term investment or an asset that cannot be converted into cash easily such like:\n• Land and Buildings\n• Plant, Machinery and Equipment\n• Computers\n• Furniture';
      case 'Accounts Receivable':
        return 'Reflects money owed to you by your customers provides a default Accounts Receivable account E.g. Unpaid Invoices';
      case 'Stock':
        return 'To keep track of your inventory assets';
      case 'Payment Clearing Account':
        return 'To keep track of funds moving in and out via payment processors like Stripe, PayPal, etc';
      case 'Intangible Asset':
        return '';
      case 'Non Current Asset':
        return '';
      case 'Deferred Tax Asset':
        return 'Represents future tax benefits from expenses or losses recognized in accounting before they are deductible for tax purposes Examples include warranty expenses, bad debt provisions, and tax loss carry-forwards';
      case 'Other Current Liability':
        return 'Any short term liability like:\n• Customer Deposits\n• Tax Payable';
      case 'Credit Card':
        return 'Create a trail of all your credit card transactions by creating a credit card account';
      case 'Non Current Liability':
        return 'Liabilities that mature after a minimum period of one year like Notes Payable, Debentures, and Long Term Loans';
      case 'Other Liability':
        return 'Obligation of an entity arising from past transactions or events which would require repayment\n• Tax to be paid\n• Loan to be Repaid\n• Accounts Payable etc';
      case 'Accounts Payable':
        return 'Reflects money owed by you to your suppliers. provides a default Accounts Payable account.';
      case 'Deferred Tax Liability':
        return 'Represents future tax payments arising from taxable income recognized in accounting before it is taxable. Examples include accelerated depreciation and revenue received in advance.';
      case 'Equity':
        return 'Owners or stakeholders interest on the assets of the business after deducting all the liabilities';
      case 'Income':
        return 'Income or Revenue earned from normal business activities like sale of goods and services to customers';
      case 'Other Income':
        return 'Income or revenue earned from activities not directly related to your business like:\n• Interest Earned\n• Dividend Earned';
      case 'Expense':
        return 'Reflects expenses incurred for running normal business operations, such as:\n• Advertisements and Marketing\n• Business Travel Expenses\n• Licence Fees\n• Utility Expenses';
      case 'Cost Of Goods Sold':
        return 'Track direct costs of producing goods sold';
      case 'Other Expense':
        return 'Track miscellaneous expenses incurred for activities other than primary business operations or create additional accounts to track default expenses like insurance or contribution towards charity.';
      default:
        return '';
    }
  };

  // Create the form content
  const formContent = (
    <>
      {/* Account Type */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-red-500 w-32 flex-shrink-0">
          Account Type<span className="text-red-500">*</span>
        </label>
        <div className="flex-1 relative">
          <div className="relative">
            <input
              type="text"
              value={formData.accountType}
              onClick={() => {
                setShowDropdown(!showDropdown);
                if (!showDropdown) {
                  // Reset search term when opening dropdown
                  setSearchTerm('');
                  // Scroll to selected item after dropdown renders
                  setTimeout(() => {
                    if (selectedItemRef.current && dropdownRef.current) {
                      const dropdownRect = dropdownRef.current.getBoundingClientRect();
                      const itemRect = selectedItemRef.current.getBoundingClientRect();
                      const scrollContainer = dropdownRef.current.querySelector('.overflow-y-auto');
                      if (scrollContainer) {
                        const relativeTop = itemRect.top - dropdownRect.top - 100; // Offset to show context
                        scrollContainer.scrollTop = relativeTop;
                      }
                    }
                  }, 0);
                }
              }}
              readOnly
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md hover:border-blue-500 focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
              placeholder="Select account type"
              required
            />
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          
          {/* Dropdown */}
          {showDropdown && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowDropdown(false)}
              />
              <div ref={dropdownRef} className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-hidden">
                {/* Search Input */}
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search"
                      className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-md hover:border-blue-500 focus:outline-none  focus:border-blue-500"
                    />
                  </div>
                </div>
                
                {/* Account Type Categories */}
                <div className="max-h-48 overflow-y-auto">
                  {Object.entries(filteredCategories).map(([category, types]) => (
                    <div key={category}>
                      <div className="px-4 py-2 text-sm font-semibold text-gray-800 bg-gray-100">
                        {category}
                      </div>
                      {types.map((type) => (
                        <div key={type.value} className="relative">
                          <button
                            ref={formData.accountType === type.value ? selectedItemRef : null}
                            type="button"
                            onClick={() => handleAccountTypeSelect(type.value)}
                            className={`w-full text-left px-4 py-2.5 text-sm focus:outline-none transition-colors relative ${
                              formData.accountType === type.value 
                                ? 'bg-blue-600 text-white' 
                                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                          >
                            <span className="pr-6">{type.label}</span>
                            {formData.accountType === type.value && (
                              <Check className="w-4 h-4 text-white absolute right-4 top-1/2 transform -translate-y-1/2" />
                            )}
                          </button>
                          {/* Tooltip on hover */}
                          <div className="absolute left-full top-0 ml-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity z-30">
                            <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              {type.label}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  
                  {Object.keys(filteredCategories).length === 0 && (
                    <div className="px-4 py-8 text-sm text-gray-400 text-center">
                      No account types found
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          
          {errors.accountType && (
            <p className="mt-1 text-sm text-red-600">{errors.accountType}</p>
          )}
        </div>
      </div>

      {/* Account Name - Hide for Credit Card */}
      {formData.accountType !== 'Credit Card' && (
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-red-500 w-32 flex-shrink-0">
            Account Name<span className="text-red-500">*</span>
          </label>
          <div className="flex-1">
            <input
              type="text"
              value={formData.accountName}
              onChange={(e) => handleInputChange('accountName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-500 focus:outline-none  focus:border-blue-500 transition-colors"
              required
            />
            {errors.accountName && (
              <p className="mt-1 text-sm text-red-600">{errors.accountName}</p>
            )}
          </div>
        </div>
      )}

      {/* Make this a sub-account - Only show for Other Current Asset, Cash, Accounts Receivable, Fixed Asset, Other Current Liability, Accounts Payable, Equity, Income, Expense, and Cost Of Goods Sold */}
      {(formData.accountType === 'Other Current Asset' || formData.accountType === 'Cash' || formData.accountType === 'Accounts Receivable' || formData.accountType === 'Fixed Asset' || formData.accountType === 'Other Current Liability' || formData.accountType === 'Accounts Payable' || formData.accountType === 'Equity' || formData.accountType === 'Income' || formData.accountType === 'Expense' || formData.accountType === 'Cost Of Goods Sold') && (
        <div className="flex items-start gap-4">
          <div className="w-32 flex-shrink-0"></div>
          <div className="flex-1 flex items-start gap-3">
            <input
              type="checkbox"
              id="makeSubAccount"
              checked={formData.makeSubAccount}
              onChange={(e) => handleInputChange('makeSubAccount', e.target.checked)}
              className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <label htmlFor="makeSubAccount" className="text-sm text-gray-700">
                Make this a sub-account
              </label>
              <div className="relative group">
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity z-30">
                  <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-md whitespace-nowrap max-w-xs">
                    Select this option if you are creating a sub-account.
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-l-transparent border-r-2 border-r-transparent border-b-2 border-b-gray-800"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parent Account - Show when makeSubAccount is true */}
      {formData.makeSubAccount && (
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-red-500 w-32 flex-shrink-0">
            Parent Account<span className="text-red-500">*</span>
          </label>
          <div className="flex-1 relative">
            <div className="relative">
              <input
                type="text"
                value={filteredParentAccounts.find(acc => acc.account_id.toString() === formData.parentAccount)?.account_name || 'Select an account'}
                onClick={() => setShowParentDropdown(!showParentDropdown)}
                readOnly
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md hover:border-blue-500 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                placeholder="Select parent account"
                required
              />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            
            {/* Parent Account Dropdown */}
            {showParentDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowParentDropdown(false)}
                />
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-hidden">
                  {/* Search Input */}
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={parentSearchTerm}
                        onChange={(e) => setParentSearchTerm(e.target.value)}
                        placeholder="Search accounts"
                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-md hover:border-blue-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    {/* Account Type Filter Label */}
                    <div className="mt-2 text-sm font-bold text-gray-700">
                      {formData.accountType}
                    </div>
                  </div>
                  
                  {/* Parent Account Options */}
                  <div className="max-h-48 overflow-y-auto">
                    {isLoadingParentAccounts ? (
                      <div className="px-4 py-8 text-sm text-gray-400 text-center">
                        Loading accounts...
                      </div>
                    ) : filteredParentAccounts.length > 0 ? (
                      filteredParentAccounts.map((account) => (
                        <button
                          key={account.account_id}
                          type="button"
                          onClick={() => handleParentAccountSelect(account.account_id, account.account_name)}
                          className={`w-full text-left px-4 py-2.5 text-sm focus:outline-none transition-colors relative ${
                            formData.parentAccount === account.account_id.toString()
                              ? 'bg-blue-600 text-white' 
                              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          <span className="font-medium pr-6">{account.account_name}</span>
                          {formData.parentAccount === account.account_id.toString() && (
                            <Check className="w-4 h-4 text-white absolute right-4 top-1/2 transform -translate-y-1/2" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-sm text-gray-400 text-center">
                        No {formData.accountType} accounts found
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {errors.parentAccount && (
              <p className="mt-1 text-sm text-red-600">{errors.parentAccount}</p>
            )}
          </div>
        </div>
      )}

      {/* Account Code - Show here only for non-Credit Card types */}
      {formData.accountType !== 'Credit Card' && (
        <div className="flex items-center gap-4">
          <div className="w-32 flex-shrink-0">
            <span className="text-sm font-medium text-gray-700 border-b border-dotted border-gray-400 inline-block">
              Account Code
            </span>
          </div>
          <div className="w-64">
            <input
              type="text"
              value={formData.accountCode}
              onChange={(e) => handleInputChange('accountCode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-500 focus:outline-none  focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Credit Card specific fields */}
      {shouldShowCreditCardFields && (
        <>
          {/* Credit Card Name */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-red-500 w-32 flex-shrink-0">
              Credit Card Name<span className="text-red-500">*</span>
            </label>
            <div className="flex-1">
              <input
                type="text"
                value={formData.accountName}
                onChange={(e) => handleInputChange('accountName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-500 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Account Code */}
          <div className="flex items-center gap-4">
            <div className="w-32 flex-shrink-0">
              <span className="text-sm font-medium text-gray-700 border-b border-dotted border-gray-400 inline-block">
                Account Code
              </span>
            </div>
            <div className="w-64">
              <input
                type="text"
                value={formData.accountCode}
                onChange={(e) => handleInputChange('accountCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Currency */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
              Currency
            </label>
            <div className="flex-1 relative">
              <div className="relative">
                <input
                  type="text"
                  value={formData.currency}
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  readOnly
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md hover:border-blue-500 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  placeholder="Select currency"
                />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>

              {/* Currency Dropdown */}
              {showCurrencyDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowCurrencyDropdown(false)}
                  />
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-3 border-b border-gray-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={currencySearchTerm}
                          onChange={(e) => setCurrencySearchTerm(e.target.value)}
                          placeholder="Search"
                          className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-md hover:border-blue-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* Currency Options */}
                    <div className="max-h-48 overflow-y-auto">
                      {filteredCurrencies.map((currency) => (
                        <button
                          key={currency.value}
                          type="button"
                          onClick={() => handleCurrencySelect(currency.value)}
                          className={`w-full text-left px-4 py-2.5 text-sm focus:outline-none transition-colors relative ${
                            formData.currency === currency.value 
                              ? 'bg-blue-600 text-white' 
                              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          <span className="pr-6">{currency.label}</span>
                          {formData.currency === currency.value && (
                            <Check className="w-4 h-4 text-white absolute right-4 top-1/2 transform -translate-y-1/2" />
                          )}
                        </button>
                      ))}
                      
                      {filteredCurrencies.length === 0 && (
                        <div className="px-4 py-8 text-sm text-gray-400 text-center">
                          No currencies found
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Bank/Cash specific fields */}
      {shouldShowBankCashFields && (
        <>
          {/* Account Number / IBAN */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
              Account Number / IBAN
            </label>
            <div className="flex-1">
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-500 focus:outline-none  focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Routing Number / Sort Code */}
          <div className="flex items-center gap-4">
            <div className="w-32 flex-shrink-0">
              <div className="text-sm font-medium text-gray-700">
                <span className="border-b border-dotted border-gray-400 inline-block">
                  Routing Number /
                </span>
                <br />
                <span className="border-b border-dotted border-gray-400 inline-block">
                  Sort Code
                </span>
              </div>
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={formData.routingNumber}
                onChange={(e) => handleInputChange('routingNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-500 focus:outline-none  focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Currency */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
              Currency
            </label>
            <div className="flex-1 relative">
              <div className="relative">
                <input
                  type="text"
                  value={formData.currency}
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  readOnly
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md hover:border-blue-500 focus:outline-none  focus:border-blue-500 transition-colors cursor-pointer"
                  placeholder="Select currency"
                />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>

              {/* Currency Dropdown */}
              {showCurrencyDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowCurrencyDropdown(false)}
                  />
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-3 border-b border-gray-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={currencySearchTerm}
                          onChange={(e) => setCurrencySearchTerm(e.target.value)}
                          placeholder="Search"
                          className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-md hover:border-blue-500 focus:outline-none  focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* Currency Options */}
                    <div className="max-h-48 overflow-y-auto">
                      {filteredCurrencies.map((currency) => (
                        <button
                          key={currency.value}
                          type="button"
                          onClick={() => handleCurrencySelect(currency.value)}
                          className={`w-full text-left px-4 py-2.5 text-sm focus:outline-none transition-colors relative ${
                            formData.currency === currency.value 
                              ? 'bg-blue-600 text-white' 
                              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          <span className="pr-6">{currency.label}</span>
                          {formData.currency === currency.value && (
                            <Check className="w-4 h-4 text-white absolute right-4 top-1/2 transform -translate-y-1/2" />
                          )}
                        </button>
                      ))}
                      
                      {filteredCurrencies.length === 0 && (
                        <div className="px-4 py-8 text-sm text-gray-400 text-center">
                          No currencies found
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* VAT Return Preference */}
      <div className="flex items-start gap-4">
        <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0 mt-0.5">
          VAT Return Preference
        </label>
        <div className="flex-1">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="vatReturnPreference"
              checked={formData.vatReturnPreference}
              onChange={(e) => handleInputChange('vatReturnPreference', e.target.checked)}
              className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:outline-none"
            />
            <div>
              <label htmlFor="vatReturnPreference" className="text-sm text-gray-700">
                Include the transactions in VAT Return
              </label>
              <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                Tick this if you want to include the transactions involving this account to reflect in VAT Return
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="flex items-start gap-4">
        <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0 mt-2">
          Description
        </label>
        <div className="flex-1">
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Max. 500 characters"
            className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-blue-500 focus:outline-none  focus:border-blue-500 resize-none transition-colors"
          />
        </div>
      </div>

      {/* Watchlist Checkbox */}
      <div className="flex items-center gap-4">
        <div className="w-32 flex-shrink-0"></div>
        <div className="flex-1 flex items-center gap-3">
          <input
            type="checkbox"
            id="addToWatchlist"
            checked={formData.addToWatchlist}
            onChange={(e) => handleInputChange('addToWatchlist', e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:outline-none"
          />
          <label htmlFor="addToWatchlist" className="text-sm text-gray-700">
            Add to the watchlist on my dashboard
          </label>
        </div>
      </div>
    </>
  );

  // Create the right panel content
  const rightPanelContent = (
    formData.accountType && getAccountTypeDescription(formData.accountType) && (
      <div className="absolute top-0 left-0 w-full">
        <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">
              {getAccountCategory(formData.accountType)}
            </span>
          </div>
          <div className="text-sm leading-snug whitespace-pre-line">
            {getAccountTypeDescription(formData.accountType)}
          </div>
          {/* Tooltip Arrow attached to the left side */}
          <div className="absolute right-full top-3 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-gray-800"></div>
        </div>
      </div>
    )
  );

  return (
    <NewFormModalbox
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'edit' ? 'Edit Account' : 'Create Account'}
      onSubmit={handleSubmit}
      submitLabel={mode === 'edit' ? 'Update' : 'Save'}
      isSubmitting={mode === 'edit' ? updateAccountMutation.isPending : createAccountMutation.isPending}
      showErrorBanner={mode === 'edit' ? updateAccountMutation.isError : createAccountMutation.isError}
      errorMessage={(() => {
        const mutation = mode === 'edit' ? updateAccountMutation : createAccountMutation;
        const baseMessage = `Failed to ${mode === 'edit' ? 'update' : 'create'} account. Please try again.`;
        
        if (mutation.error) {
          if (mutation.error.code === 'ECONNABORTED') {
            return `${baseMessage} Request timed out - this may be due to data validation issues.`;
          }
          if (mutation.error.response?.status === 500) {
            return `${baseMessage} Server error occurred - please contact support if this persists.`;
          }
          if (mutation.error instanceof Error) {
            return `${baseMessage} ${mutation.error.message}`;
          }
        }
        
        return baseMessage;
      })()}
      isLoadingContent={mode === 'edit' && isLoadingAccount}
      loadingMessage="Loading account data..."
      rightPanelContent={rightPanelContent}
    >
      {formContent}
    </NewFormModalbox>
  );
};

export default AccountCreate;