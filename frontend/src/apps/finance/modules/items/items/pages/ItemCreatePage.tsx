import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X, ImageIcon, HelpCircle, Trash2, ZoomIn, ChevronDown, Check, XCircle } from 'lucide-react'
import { useCreateFinanceItem, useUpdateFinanceItem, useFinanceItem, CreateFinanceItemData } from '../../api/ItemsAPI'
import { useVendors, useChartOfAccounts, useLocations, useTaxRates } from '../../api/apiHooks'
import { CreateFormModalpage } from '../../../../finance-inventory-shared'

interface ItemCreatePageProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const ItemCreatePage: React.FC<ItemCreatePageProps> = ({ 
  isOpen = true, 
  onClose 
}) => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)
  
  const createItemMutation = useCreateFinanceItem()
  const updateItemMutation = useUpdateFinanceItem()
  const { data: existingItem, isLoading: isLoadingItem } = useFinanceItem(
    isEditMode ? id || '' : ''
  )
  
  // Load data from APIs
  const { data: vendors = [] } = useVendors()
  const { data: salesAccountsData = [] } = useChartOfAccounts('Income')
  const { data: expenseAccountsData = [] } = useChartOfAccounts('Expense')
  const { data: inventoryAccountsData = [] } = useChartOfAccounts('Asset')
  const { data: locations = [] } = useLocations()
  const { data: taxRates = [] } = useTaxRates()

  const [itemType, setItemType] = useState('goods')
  const [salesInfoExpanded, setSalesInfoExpanded] = useState(true)
  const [purchaseInfoExpanded, setPurchaseInfoExpanded] = useState(true)
  const [trackInventory, setTrackInventory] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState('')
  const [unitSearchTerm, setUnitSearchTerm] = useState('')
  const [conditionDropdownOpen, setConditionDropdownOpen] = useState(false)
  const [selectedCondition, setSelectedCondition] = useState('')
  const [conditionSearchTerm, setConditionSearchTerm] = useState('')
  const [salesAccountDropdownOpen, setSalesAccountDropdownOpen] = useState(false)
  const [selectedSalesAccount, setSelectedSalesAccount] = useState('')
  const [salesAccountSearchTerm, setSalesAccountSearchTerm] = useState('')
  const [purchaseAccountDropdownOpen, setPurchaseAccountDropdownOpen] = useState(false)
  const [selectedPurchaseAccount, setSelectedPurchaseAccount] = useState('')
  const [purchaseAccountSearchTerm, setPurchaseAccountSearchTerm] = useState('')
  const [vatDropdownOpen, setVatDropdownOpen] = useState(false)
  const [selectedVat, setSelectedVat] = useState('')
  const [vatSearchTerm, setVatSearchTerm] = useState('')

  const [warehouses, setWarehouses] = useState([
    { id: 1, name: '', openingStock: '0', openingValue: '0' }
  ])
  const [preferredVendorDropdownOpen, setPreferredVendorDropdownOpen] = useState(false)
  const [selectedPreferredVendor, setSelectedPreferredVendor] = useState('')
  const [preferredVendorSearchTerm, setPreferredVendorSearchTerm] = useState('')
  const [valuationMethodDropdownOpen, setValuationMethodDropdownOpen] = useState(false)
  const [selectedValuationMethod, setSelectedValuationMethod] = useState('')
  const [valuationMethodSearchTerm, setValuationMethodSearchTerm] = useState('')
  const [inventoryAccountDropdownOpen, setInventoryAccountDropdownOpen] = useState(false)
  const [selectedInventoryAccount, setSelectedInventoryAccount] = useState('')
  const [inventoryAccountSearchTerm, setInventoryAccountSearchTerm] = useState('')
  
  // Form state variables
  const [itemName, setItemName] = useState('')
  const [itemSku, setItemSku] = useState('')
  const [salesPrice, setSalesPrice] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [salesDescription, setSalesDescription] = useState('')
  const [purchaseDescription, setPurchaseDescription] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const unitDropdownRef = useRef<HTMLDivElement>(null)
  const unitInputRef = useRef<HTMLInputElement>(null)
  const conditionDropdownRef = useRef<HTMLDivElement>(null)
  const conditionInputRef = useRef<HTMLInputElement>(null)
  const salesAccountDropdownRef = useRef<HTMLDivElement>(null)
  const salesAccountInputRef = useRef<HTMLInputElement>(null)
  const purchaseAccountDropdownRef = useRef<HTMLDivElement>(null)
  const purchaseAccountInputRef = useRef<HTMLInputElement>(null)
  const vatDropdownRef = useRef<HTMLDivElement>(null)
  const vatInputRef = useRef<HTMLInputElement>(null)

  const preferredVendorDropdownRef = useRef<HTMLDivElement>(null)
  const preferredVendorInputRef = useRef<HTMLInputElement>(null)
  const valuationMethodDropdownRef = useRef<HTMLDivElement>(null)
  const valuationMethodInputRef = useRef<HTMLInputElement>(null)
  const inventoryAccountDropdownRef = useRef<HTMLDivElement>(null)
  const inventoryAccountInputRef = useRef<HTMLInputElement>(null)

  // Pre-fill form fields when in edit mode
  useEffect(() => {
    if (isEditMode && existingItem) {
      setItemType(existingItem.product_type || 'goods')
      setItemName(existingItem.name || '')
      setItemSku(existingItem.sku || '')
      setSalesPrice(existingItem.rate ? String(existingItem.rate) : '')
      setCostPrice(existingItem.purchase_rate ? String(existingItem.purchase_rate) : '')
      setSalesDescription(existingItem.sales_description || '')
      setPurchaseDescription(existingItem.purchase_description || '')
      setSelectedUnit(existingItem.unit || '')
      
      // Set IDs for dropdowns (they're already strings in the backend)
      if (existingItem.account_id) {
        setSelectedSalesAccount(existingItem.account_id)
      }
      if (existingItem.purchase_account_id) {
        setSelectedPurchaseAccount(existingItem.purchase_account_id)
      }
      if (existingItem.vendor_id) {
        setSelectedPreferredVendor(existingItem.vendor_id)
      }
      if (existingItem.inventory_account_id) {
        setSelectedInventoryAccount(existingItem.inventory_account_id)
      }
      
      // Set expanded sections if we have data
      if (existingItem.rate > 0) {
        setSalesInfoExpanded(true)
      }
      if (existingItem.purchase_rate > 0) {
        setPurchaseInfoExpanded(true)
      }
    }
  }, [isEditMode, existingItem])


  // Initialize warehouses with primary location when locations are loaded
  useEffect(() => {
    if (locations && locations.length > 0 && warehouses[0].name === '') {
      const primaryLocation = locations.find(loc => loc.is_primary) || locations[0]
      setWarehouses([{ 
        id: primaryLocation.location_id, 
        name: primaryLocation.location_name, 
        openingStock: '0', 
        openingValue: '0' 
      }])
    }
  }, [locations, warehouses])

  const units = [
    { value: 'box', label: 'Box' },
    { value: 'dz', label: 'dz' },
    { value: 'ft', label: 'ft' },
    { value: 'g', label: 'g' },
    { value: 'in', label: 'in' },
    { value: 'kg', label: 'kg' },
    { value: 'km', label: 'km' },
    { value: 'lb', label: 'lb' },
    { value: 'mg', label: 'mg' },
    { value: 'ml', label: 'ml' },
    { value: 'm', label: 'm' },
    { value: 'pcs', label: 'pcs' }
  ]

  const conditions = [
    { value: 'new', label: 'New' },
    { value: 'used', label: 'Used' },
    { value: 'refurbished', label: 'Refurbished' }
  ]

  // Format sales accounts from API data
  const salesAccounts = React.useMemo(() => {
    const grouped: Record<string, any[]> = {}
    salesAccountsData.forEach(account => {
      const category = account.account_category || account.account_type || 'Income'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push({
        value: String(account.account_id),
        label: account.account_name
      })
    })
    return Object.entries(grouped).map(([category, options]) => ({
      category,
      options
    }))
  }, [salesAccountsData])

  // Format purchase accounts from API data
  const purchaseAccounts = React.useMemo(() => {
    const grouped: Record<string, any[]> = {}
    expenseAccountsData.forEach(account => {
      const category = account.account_category || account.account_type || 'Expense'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push({
        value: String(account.account_id),
        label: account.account_name
      })
    })
    return Object.entries(grouped).map(([category, options]) => ({
      category,
      options
    }))
  }, [expenseAccountsData])

  // Format VAT/Tax options from API data
  const vatOptions = React.useMemo(() => {
    if (!taxRates.length) return [{ category: 'Tax', options: [] }]
    return [{
      category: 'Tax',
      options: taxRates.map(tax => ({
        value: String(tax.tax_id),
        label: `${tax.tax_name} [${tax.tax_percentage}%]`
      }))
    }]
  }, [taxRates])


  // Format vendors from API data
  const preferredVendors = React.useMemo(() => {
    return vendors.map(vendor => ({
      value: String(vendor.contact_id),
      label: vendor.company_name || vendor.name
    }))
  }, [vendors])

  const valuationMethods = [
    { value: 'FIFO', label: 'FIFO (First In First Out)' },
    { value: 'LIFO', label: 'LIFO (Last In First Out)' },
    { value: 'Average', label: 'Average Cost' }
  ]

  // Format inventory accounts from API data
  const inventoryAccounts = React.useMemo(() => {
    const grouped: Record<string, any[]> = {}
    inventoryAccountsData.forEach(account => {
      const category = account.account_category || 'Stock'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push({
        value: String(account.account_id),
        label: account.account_name
      })
    })
    return Object.entries(grouped).map(([category, options]) => ({
      category,
      options
    }))
  }, [inventoryAccountsData])


  const handleClose = () => {
    navigate('/finance/items')
  }


  const handleSave = async (e?: React.FormEvent) => {
    // If it's a form submission event, prevent default
    if (e) {
      e.preventDefault()
    }
    
    try {
      // Validate required fields
      if (!itemName.trim()) {
        alert('Please enter an item name')
        return
      }

      // Validate price - backend requires positive price
      if (salesInfoExpanded && (!salesPrice || parseFloat(salesPrice) <= 0)) {
        alert('Please enter a valid selling price greater than 0')
        return
      }

      // If sales info is not expanded, we still need a price for backend
      if (!salesInfoExpanded) {
        alert('Please expand "Sales Information" and enter a selling price')
        return
      }

      // Validate image size (if any)
      if (selectedImages.length > 0) {
        const firstImage = selectedImages[0]
        const maxSizeInMB = 5
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024
        
        if (firstImage.size > maxSizeInBytes) {
          alert(`Image file too large. Please use an image smaller than ${maxSizeInMB}MB.`)
          return
        }
      }

      // Prepare item data - IDs must be strings for the backend
      const itemData: CreateFinanceItemData = {
        name: itemName.trim(),
        sku: itemSku.trim() || undefined,
        product_type: itemType as 'goods' | 'service',
        item_type: 'sales_and_purchases', // Default to sales_and_purchases
        unit: selectedUnit || undefined,
        rate: salesInfoExpanded ? parseFloat(salesPrice) || 0 : 0,
        purchase_rate: purchaseInfoExpanded ? parseFloat(costPrice) || 0 : 0,
        sales_description: salesInfoExpanded ? salesDescription.trim() || undefined : undefined,
        purchase_description: purchaseInfoExpanded ? purchaseDescription.trim() || undefined : undefined,
        account_id: salesInfoExpanded && selectedSalesAccount ? selectedSalesAccount : undefined,
        purchase_account_id: purchaseInfoExpanded && selectedPurchaseAccount ? selectedPurchaseAccount : undefined,
        vendor_id: purchaseInfoExpanded && selectedPreferredVendor ? selectedPreferredVendor : undefined,
        inventory_account_id: trackInventory && itemType === 'goods' && selectedInventoryAccount ? selectedInventoryAccount : undefined,
        initial_stock: trackInventory && itemType === 'goods' && warehouses.length > 0 ? parseFloat(warehouses[0].openingStock) : undefined,
        initial_stock_rate: trackInventory && itemType === 'goods' && warehouses.length > 0 ? parseFloat(warehouses[0].openingValue) : undefined
      }

      console.log('Saving item with data:', itemData)
      
      // Submit the data
      if (isEditMode && id) {
        await updateItemMutation.mutateAsync({ itemId: id, itemData })
        console.log('Item updated successfully')
      } else {
        await createItemMutation.mutateAsync(itemData)
        console.log('Item created successfully')
      }
      
      // Navigate back to items list
      navigate('/finance/items')
      
    } catch (error: any) {
      console.error('Error saving item:', error)
      
      // Show more specific error messages
      const errorMessage = error.message || 'Error saving item. Please try again.'
      alert(errorMessage)
    }
  }

  const addWarehouse = () => {
    const newWarehouse = {
      id: Date.now(),
      name: '',
      openingStock: '0',
      openingValue: '0'
    }
    setWarehouses([...warehouses, newWarehouse])
  }

  const removeWarehouse = (id: number) => {
    setWarehouses(warehouses.filter(warehouse => warehouse.id !== id))
  }

  const updateWarehouse = (id: number, field: string, value: string) => {
    setWarehouses(warehouses.map(warehouse => 
      warehouse.id === id ? { ...warehouse, [field]: value } : warehouse
    ))
  }

  const handleCancel = () => {
    navigate('/finance/items')
  }

  const handleUnitSelect = (unit: string) => {
    setSelectedUnit(unit)
    setUnitSearchTerm(unit)
    setUnitDropdownOpen(false)
  }

  const handleUnitInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUnitSearchTerm(value)
    setUnitDropdownOpen(true)
    // Don't clear selection when typing, only filter
  }

  const handleUnitInputFocus = () => {
    setUnitDropdownOpen(true)
    // Clear search term to show all options
    setUnitSearchTerm('')
  }

  const handleDeleteSelectedUnit = () => {
    setSelectedUnit('')
    setUnitSearchTerm('')
    if (unitInputRef.current) {
      unitInputRef.current.focus()
    }
  }

  const filteredUnits = units.filter(unit =>
    unit.label.toLowerCase().includes(unitSearchTerm.toLowerCase())
  )

  const handleConditionSelect = (condition: string) => {
    setSelectedCondition(condition)
    setConditionSearchTerm(condition)
    setConditionDropdownOpen(false)
  }

  const handleConditionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setConditionSearchTerm(value)
    setConditionDropdownOpen(true)
    // Don't clear selection when typing, only filter
  }

  const handleConditionInputFocus = () => {
    setConditionDropdownOpen(true)
    // Clear search term to show all options
    setConditionSearchTerm('')
  }

  const handleDeleteSelectedCondition = () => {
    setSelectedCondition('')
    setConditionSearchTerm('')
    if (conditionInputRef.current) {
      conditionInputRef.current.focus()
    }
  }

  const filteredConditions = conditions.filter(condition =>
    condition.label.toLowerCase().includes(conditionSearchTerm.toLowerCase())
  )

  const handleSalesAccountSelect = (account: string) => {
    setSelectedSalesAccount(account)
    setSalesAccountSearchTerm(account)
    setSalesAccountDropdownOpen(false)
  }

  const handleSalesAccountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSalesAccountSearchTerm(value)
    setSalesAccountDropdownOpen(true)
  }

  const handleSalesAccountInputFocus = () => {
    setSalesAccountDropdownOpen(true)
    setSalesAccountSearchTerm('')
  }

  const handleDeleteSelectedSalesAccount = () => {
    setSelectedSalesAccount('')
    setSalesAccountSearchTerm('')
    if (salesAccountInputRef.current) {
      salesAccountInputRef.current.focus()
    }
  }

  const getFilteredSalesAccounts = () => {
    if (!salesAccountSearchTerm) return salesAccounts
    
    return salesAccounts.map(category => ({
      ...category,
      options: category.options.filter(option =>
        option.label.toLowerCase().includes(salesAccountSearchTerm.toLowerCase())
      )
    })).filter(category => category.options.length > 0)
  }

  const handlePurchaseAccountSelect = (account: string) => {
    setSelectedPurchaseAccount(account)
    setPurchaseAccountSearchTerm(account)
    setPurchaseAccountDropdownOpen(false)
  }

  const handlePurchaseAccountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPurchaseAccountSearchTerm(value)
    setPurchaseAccountDropdownOpen(true)
  }

  const handlePurchaseAccountInputFocus = () => {
    setPurchaseAccountDropdownOpen(true)
    setPurchaseAccountSearchTerm('')
  }

  const handleDeleteSelectedPurchaseAccount = () => {
    setSelectedPurchaseAccount('')
    setPurchaseAccountSearchTerm('')
    if (purchaseAccountInputRef.current) {
      purchaseAccountInputRef.current.focus()
    }
  }

  const getFilteredPurchaseAccounts = () => {
    if (!purchaseAccountSearchTerm) return purchaseAccounts
    
    return purchaseAccounts.map(category => ({
      ...category,
      options: category.options.filter(option =>
        option.label.toLowerCase().includes(purchaseAccountSearchTerm.toLowerCase())
      )
    })).filter(category => category.options.length > 0)
  }

  const handleVatSelect = (vat: string) => {
    setSelectedVat(vat)
    setVatSearchTerm(vat)
    setVatDropdownOpen(false)
  }

  const handleVatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setVatSearchTerm(value)
    setVatDropdownOpen(true)
  }

  const handleVatInputFocus = () => {
    setVatDropdownOpen(true)
    setVatSearchTerm('')
  }

  const handleDeleteSelectedVat = () => {
    setSelectedVat('')
    setVatSearchTerm('')
    if (vatInputRef.current) {
      vatInputRef.current.focus()
    }
  }

  const getFilteredVatOptions = () => {
    if (!vatSearchTerm) return vatOptions
    
    return vatOptions.map(category => ({
      ...category,
      options: category.options.filter(option =>
        option.label.toLowerCase().includes(vatSearchTerm.toLowerCase())
      )
    })).filter(category => category.options.length > 0)
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target as Node)) {
        setUnitDropdownOpen(false)
      }
      if (conditionDropdownRef.current && !conditionDropdownRef.current.contains(event.target as Node)) {
        setConditionDropdownOpen(false)
      }
      if (salesAccountDropdownRef.current && !salesAccountDropdownRef.current.contains(event.target as Node)) {
        setSalesAccountDropdownOpen(false)
      }
      if (purchaseAccountDropdownRef.current && !purchaseAccountDropdownRef.current.contains(event.target as Node)) {
        setPurchaseAccountDropdownOpen(false)
      }
      if (vatDropdownRef.current && !vatDropdownRef.current.contains(event.target as Node)) {
        setVatDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Image upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const addImages = (files: File[], replace = false) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (replace) {
      // Clean up existing URLs to prevent memory leaks
      imagePreviewUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
      // Replace existing images
      setSelectedImages(imageFiles)
      setImagePreviewUrls([])
    } else {
      // Add to existing images
      setSelectedImages(prev => [...prev, ...imageFiles])
    }
    
    // Create preview URLs
    imageFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          if (replace) {
            setImagePreviewUrls([e.target?.result as string])
          } else {
            setImagePreviewUrls(prev => [...prev, e.target?.result as string])
          }
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)
      addImages(files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const shouldReplace = e.target.dataset.replace === 'true'
      addImages(files, shouldReplace)
      // Reset the input value so the same file can be selected again
      e.target.value = ''
      // Reset the replace flag
      e.target.dataset.replace = 'false'
    }
  }

  const handleBrowseClick = (replace = false) => {
    // Store the replace flag in a data attribute so we can access it in handleFileInput
    if (fileInputRef.current) {
      fileInputRef.current.dataset.replace = replace.toString()
      fileInputRef.current.click()
    }
  }

  const removeImage = (index: number) => {
    // Clean up the object URL to prevent memory leaks
    if (imagePreviewUrls[index]) {
      URL.revokeObjectURL(imagePreviewUrls[index])
    }
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleZoomImage = (imageUrl: string) => {
    setZoomedImage(imageUrl)
  }

  const closeZoom = () => {
    setZoomedImage(null)
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">New Item</h1>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content - Takes remaining space */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Type Selection */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 w-32">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</span>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    value="goods"
                    checked={itemType === 'goods'}
                    onChange={(e) => setItemType(e.target.value)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Goods</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    value="service"
                    checked={itemType === 'service'}
                    onChange={(e) => setItemType(e.target.value)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Service</span>
                </label>
              </div>
            </div>

            {/* Main Content Row */}
            <div className="flex gap-0">
              {/* Left Section - Fields */}
              <div>
                {/* Name and SKU Fields with normal spacing */}
                <div className="space-y-4">
                  {/* Name Field */}
                  <div className="flex items-center gap-8">
                    <label className="text-sm font-medium text-red-600 dark:text-red-400 w-32">
                      Name*
                    </label>
                    <input
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-80 px-3 py-2 text-sm border border-blue-300 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* SKU Field */}
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-1 w-32">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">SKU</label>
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={itemSku}
                      onChange={(e) => setItemSku(e.target.value)}
                      className="w-80 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Unit Field with custom spacing */}
                <div className="flex items-center gap-8 mt-4">
                  <div className="flex items-center gap-1 w-32">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Unit</label>
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="relative w-80" ref={unitDropdownRef}>
                    <div className="relative">
                      <input
                        ref={unitInputRef}
                        type="text"
                        value={selectedUnit || unitSearchTerm}
                        onChange={handleUnitInputChange}
                        onFocus={handleUnitInputFocus}
                        placeholder="Select or type to add"
                        className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                        {selectedUnit && (
                          <button
                            type="button"
                            onClick={handleDeleteSelectedUnit}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (!unitDropdownOpen) {
                              setUnitSearchTerm('')
                              setUnitDropdownOpen(true)
                            } else {
                              setUnitDropdownOpen(false)
                            }
                          }}
                        >
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${unitDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>
                    
                    {unitDropdownOpen && filteredUnits.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredUnits.map((unit) => (
                          <button
                            key={unit.value}
                            type="button"
                            onClick={() => handleUnitSelect(unit.label)}
                            className="w-full px-3 py-2 text-sm text-left text-gray-900 dark:text-gray-100 hover:bg-blue-100 dark:hover:bg-blue-600 focus:outline-none focus:bg-blue-100 dark:focus:bg-blue-600 flex items-center justify-between"
                          >
                            <span>{unit.label}</span>
                            {selectedUnit === unit.label && (
                              <Check className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Manufacturer and Lead Time Row with large spacing */}
                <div className="flex items-center gap-8" style={{ marginTop: '80px' }}>
                  <div className="flex items-center gap-1 w-32">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Manufacturer</label>
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="w-80 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-16">
                    Lead time
                  </label>
                  <input
                    type="text"
                    className="w-64 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Condition Field */}
                <div className="flex items-center gap-8 mt-6">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
                    Condition
                  </label>
                  <div className="relative w-80" ref={conditionDropdownRef}>
                    <div className="relative">
                      <input
                        ref={conditionInputRef}
                        type="text"
                        value={selectedCondition || conditionSearchTerm}
                        onChange={handleConditionInputChange}
                        onFocus={handleConditionInputFocus}
                        placeholder=""
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                        {selectedCondition && (
                          <button
                            type="button"
                            onClick={handleDeleteSelectedCondition}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (!conditionDropdownOpen) {
                              setConditionSearchTerm('')
                              setConditionDropdownOpen(true)
                            } else {
                              setConditionDropdownOpen(false)
                            }
                          }}
                        >
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${conditionDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>
                    
                    {conditionDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden">
                        {/* Search input inside dropdown */}
                        <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search"
                              value={conditionSearchTerm}
                              onChange={handleConditionInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        
                        {/* Options list */}
                        <div className="max-h-40 overflow-y-auto">
                          {filteredConditions.length > 0 ? (
                            filteredConditions.map((condition) => (
                              <button
                                key={condition.value}
                                type="button"
                                onClick={() => handleConditionSelect(condition.label)}
                                className={`w-full px-3 py-2 text-sm text-left text-gray-900 dark:text-gray-100 hover:bg-blue-100 dark:hover:bg-blue-600 focus:outline-none focus:bg-blue-100 dark:focus:bg-blue-600 flex items-center justify-between ${
                                  selectedCondition === condition.label ? 'bg-blue-500 text-white' : ''
                                }`}
                              >
                                <span>{condition.label}</span>
                                {selectedCondition === condition.label && (
                                  <Check className="w-4 h-4 text-white" />
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                              No results found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Section - Image Upload */}
              <div className="flex-shrink-0 -ml-4">
                <div 
                  className={`border-2 border-dashed rounded-lg p-4 text-center h-40 w-60 transition-colors ${
                    selectedImages.length === 0 ? 'cursor-pointer' : ''
                  } ${
                    dragActive 
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-300 bg-gray-50 dark:bg-gray-700'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={selectedImages.length === 0 ? handleBrowseClick : undefined}
                >
                  {selectedImages.length > 0 ? (
                    <div className="h-full flex flex-col">
                      <div className="flex-1 mb-2 bg-white dark:bg-gray-800 rounded overflow-hidden relative group">
                        <img 
                          src={imagePreviewUrls[0]} 
                          alt={selectedImages[0].name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleZoomImage(imagePreviewUrls[0]);
                          }}
                          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center w-full h-full"
                        >
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-2 hover:bg-opacity-100">
                            <ZoomIn className="w-5 h-5 text-gray-700" />
                          </div>
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBrowseClick(true);
                          }}
                          className="text-blue-600 dark:text-blue-400 text-xs hover:underline"
                        >
                          Change Image
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(0);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Drag image(s) here or
                      </p>
                      <span className="text-blue-600 dark:text-blue-400 text-xs hover:underline">
                        Browse images
                      </span>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </div>

            {/* Sales and Purchase Information Section */}
            <div className="grid grid-cols-2 gap-6">
              {/* Sales Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={salesInfoExpanded}
                    onChange={(e) => setSalesInfoExpanded(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Sales Information</span>
                </div>

                <div className="space-y-4 ml-6">
                  {/* Selling Price */}
                  <div className="flex items-center gap-8">
                    <label className={`text-sm font-medium w-32 ${salesInfoExpanded ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      Selling Price*
                    </label>
                    <div className="flex">
                      <span className={`inline-flex items-center px-2 text-sm border border-r-0 rounded-l-md ${
                        salesInfoExpanded 
                          ? 'text-gray-900 bg-gray-200 border-gray-300' 
                          : 'text-gray-500 bg-gray-100 border-gray-200'
                      }`}>
                        GBP
                      </span>
                      <input
                        type="text"
                        value={salesPrice}
                        onChange={(e) => setSalesPrice(e.target.value)}
                        disabled={!salesInfoExpanded}
                        className={`w-64 px-3 py-2 text-sm border rounded-r-md ${
                          salesInfoExpanded 
                            ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900' 
                            : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Account */}
                  <div className="flex items-center gap-8">
                    <label className={`text-sm font-medium w-32 ${salesInfoExpanded ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      Account*
                    </label>
                    <div className="relative w-80" ref={salesAccountDropdownRef}>
                      <div className="relative">
                        <input
                          ref={salesAccountInputRef}
                          type="text"
                          value={selectedSalesAccount || salesAccountSearchTerm}
                          onChange={handleSalesAccountInputChange}
                          onFocus={handleSalesAccountInputFocus}
                          placeholder=""
                          disabled={!salesInfoExpanded}
                          className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${
                            salesInfoExpanded 
                              ? 'border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                              : 'border-gray-200 bg-gray-50 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          }`}
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                          {selectedSalesAccount && salesInfoExpanded && (
                            <button
                              type="button"
                              onClick={handleDeleteSelectedSalesAccount}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={!salesInfoExpanded}
                            onClick={() => {
                              if (!salesAccountDropdownOpen && salesInfoExpanded) {
                                setSalesAccountSearchTerm('')
                                setSalesAccountDropdownOpen(true)
                              } else {
                                setSalesAccountDropdownOpen(false)
                              }
                            }}
                          >
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${salesAccountDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>
                      
                      {salesAccountDropdownOpen && salesInfoExpanded && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden">
                          {/* Search input inside dropdown */}
                          <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Search"
                                value={salesAccountSearchTerm}
                                onChange={handleSalesAccountInputChange}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          
                          {/* Options list */}
                          <div className="max-h-40 overflow-y-auto">
                            {getFilteredSalesAccounts().length > 0 ? (
                              getFilteredSalesAccounts().map((category) => (
                                <div key={category.category}>
                                  {/* Category Header */}
                                  <div className="px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-600">
                                    {category.category}
                                  </div>
                                  {/* Category Options */}
                                  {category.options.map((option) => (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => handleSalesAccountSelect(option.label)}
                                      className={`w-full px-6 py-2 text-sm text-left text-gray-900 dark:text-gray-100 hover:bg-blue-100 dark:hover:bg-blue-600 focus:outline-none focus:bg-blue-100 dark:focus:bg-blue-600 flex items-center justify-between ${
                                        selectedSalesAccount === option.label ? 'bg-blue-500 text-white' : ''
                                      }`}
                                    >
                                      <span>{option.label}</span>
                                      {selectedSalesAccount === option.label && (
                                        <Check className="w-4 h-4 text-white" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                No results found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex items-start gap-8">
                    <label className={`text-sm font-medium w-32 mt-2 ${salesInfoExpanded ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={salesDescription}
                      onChange={(e) => setSalesDescription(e.target.value)}
                      disabled={!salesInfoExpanded}
                      className={`w-80 px-3 py-2 text-sm border rounded-md ${
                        salesInfoExpanded 
                          ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900' 
                          : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Purchase Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={purchaseInfoExpanded}
                    onChange={(e) => setPurchaseInfoExpanded(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Purchase Information</span>
                </div>

                <div className="space-y-4 ml-6">
                  {/* Cost Price */}
                  <div className="flex items-center gap-8">
                    <label className={`text-sm font-medium w-32 ${purchaseInfoExpanded ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      Cost Price*
                    </label>
                    <div className="flex">
                      <span className={`inline-flex items-center px-2 text-sm border border-r-0 rounded-l-md ${
                        purchaseInfoExpanded 
                          ? 'text-gray-900 bg-gray-200 border-gray-300' 
                          : 'text-gray-500 bg-gray-100 border-gray-200'
                      }`}>
                        GBP
                      </span>
                      <input
                        type="text"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        disabled={!purchaseInfoExpanded}
                        className={`w-64 px-3 py-2 text-sm border rounded-r-md ${
                          purchaseInfoExpanded 
                            ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900' 
                            : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Account */}
                  <div className="flex items-center gap-8">
                    <label className={`text-sm font-medium w-32 ${purchaseInfoExpanded ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      Account*
                    </label>
                    <div className="relative w-80" ref={purchaseAccountDropdownRef}>
                      <div className="relative">
                        <input
                          ref={purchaseAccountInputRef}
                          type="text"
                          value={selectedPurchaseAccount || purchaseAccountSearchTerm}
                          onChange={handlePurchaseAccountInputChange}
                          onFocus={handlePurchaseAccountInputFocus}
                          placeholder=""
                          disabled={!purchaseInfoExpanded}
                          className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${
                            purchaseInfoExpanded 
                              ? 'border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                              : 'border-gray-200 bg-gray-50 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          }`}
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                          {selectedPurchaseAccount && purchaseInfoExpanded && (
                            <button
                              type="button"
                              onClick={handleDeleteSelectedPurchaseAccount}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={!purchaseInfoExpanded}
                            onClick={() => {
                              if (!purchaseAccountDropdownOpen && purchaseInfoExpanded) {
                                setPurchaseAccountSearchTerm('')
                                setPurchaseAccountDropdownOpen(true)
                              } else {
                                setPurchaseAccountDropdownOpen(false)
                              }
                            }}
                          >
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${purchaseAccountDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>
                      
                      {purchaseAccountDropdownOpen && purchaseInfoExpanded && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden">
                          {/* Search input inside dropdown */}
                          <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Search"
                                value={purchaseAccountSearchTerm}
                                onChange={handlePurchaseAccountInputChange}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          
                          {/* Options list */}
                          <div className="max-h-40 overflow-y-auto">
                            {getFilteredPurchaseAccounts().length > 0 ? (
                              getFilteredPurchaseAccounts().map((category) => (
                                <div key={category.category}>
                                  {/* Category Header */}
                                  <div className="px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-600">
                                    {category.category}
                                  </div>
                                  {/* Category Options */}
                                  {category.options.map((option) => (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => handlePurchaseAccountSelect(option.label)}
                                      className={`w-full px-6 py-2 text-sm text-left text-gray-900 dark:text-gray-100 hover:bg-blue-100 dark:hover:bg-blue-600 focus:outline-none focus:bg-blue-100 dark:focus:bg-blue-600 flex items-center justify-between ${
                                        selectedPurchaseAccount === option.label ? 'bg-blue-500 text-white' : ''
                                      }`}
                                    >
                                      <span>{option.label}</span>
                                      {selectedPurchaseAccount === option.label && (
                                        <Check className="w-4 h-4 text-white" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                No results found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex items-start gap-8">
                    <label className={`text-sm font-medium w-32 mt-2 ${purchaseInfoExpanded ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={purchaseDescription}
                      onChange={(e) => setPurchaseDescription(e.target.value)}
                      disabled={!purchaseInfoExpanded}
                      className={`w-80 px-3 py-2 text-sm border rounded-md ${
                        purchaseInfoExpanded 
                          ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900' 
                          : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  {/* Preferred Vendor */}
                  <div className="flex items-center gap-8">
                    <label className={`text-sm font-medium w-32 ${purchaseInfoExpanded ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                      Preferred Vendor
                    </label>
                    <select 
                      disabled={!purchaseInfoExpanded}
                      className={`w-80 px-3 py-2 text-sm border rounded-md ${
                        purchaseInfoExpanded 
                          ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900' 
                          : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <option value=""></option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* VAT Section */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-1 w-32">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">VAT</label>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </div>
              <div className="relative w-80" ref={vatDropdownRef}>
                <div className="relative">
                  <input
                    ref={vatInputRef}
                    type="text"
                    value={selectedVat || vatSearchTerm}
                    onChange={handleVatInputChange}
                    onFocus={handleVatInputFocus}
                    placeholder=""
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {selectedVat && (
                      <button
                        type="button"
                        onClick={handleDeleteSelectedVat}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!vatDropdownOpen) {
                          setVatSearchTerm('')
                          setVatDropdownOpen(true)
                        } else {
                          setVatDropdownOpen(false)
                        }
                      }}
                    >
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${vatDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
                
                {vatDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden">
                    {/* Search input inside dropdown */}
                    <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search"
                          value={vatSearchTerm}
                          onChange={handleVatInputChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    
                    {/* Options list */}
                    <div className="max-h-40 overflow-y-auto">
                      {getFilteredVatOptions().length > 0 ? (
                        getFilteredVatOptions().map((category) => (
                          <div key={category.category}>
                            {/* Category Header */}
                            <div className="px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-600">
                              {category.category}
                            </div>
                            {/* Category Options */}
                            {category.options.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleVatSelect(option.label)}
                                className={`w-full px-6 py-2 text-sm text-left text-gray-900 dark:text-gray-100 hover:bg-blue-100 dark:hover:bg-blue-600 focus:outline-none focus:bg-blue-100 dark:focus:bg-blue-600 flex items-center justify-between ${
                                  selectedVat === option.label ? 'bg-blue-500 text-white' : ''
                                }`}
                              >
                                <span>{option.label}</span>
                                {selectedVat === option.label && (
                                  <Check className="w-4 h-4 text-white" />
                                )}
                              </button>
                            ))}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                          No results found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Spacer between VAT and Track Inventory */}
            {salesInfoExpanded && purchaseInfoExpanded && <div className="h-8"></div>}

            {/* Track Inventory - Only show when both Sales and Purchase Information are expanded */}
            {salesInfoExpanded && purchaseInfoExpanded && (
              <div className="space-y-6 mb-32">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={trackInventory}
                      onChange={(e) => setTrackInventory(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-medium text-gray-900 dark:text-white">Track Inventory for this item</span>
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                    You cannot enable/disable inventory tracking once you've created transactions for this item
                  </p>
                </div>

                {/* Inventory Fields - Show when Track Inventory is checked */}
                {trackInventory && (
                  <div className="space-y-4 ml-6">
                    {/* Inventory Account and Valuation Method Row */}
                    <div className="flex items-center gap-8">
                      {/* Inventory Account */}
                      <div className="flex items-center gap-8">
                        <label className="text-sm font-medium text-red-600 dark:text-red-400 w-32">
                          Inventory Account*
                        </label>
                        <select className="w-80 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">Select an account</option>
                        </select>
                      </div>

                      {/* Inventory Valuation Method */}
                      <div className="flex items-center gap-8 ml-16">
                        <label className="text-sm font-medium text-red-600 dark:text-red-400 w-32">
                          Inventory Valuation Method*
                        </label>
                        <select className="w-80 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">Select the valuation method</option>
                        </select>
                      </div>
                    </div>

                    {/* Warehouse Section */}
                    <div className="space-y-4">
                      {/* Header Row */}
                      <div className="grid grid-cols-3 gap-0">
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            WAREHOUSE NAME
                          </label>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            OPENING STOCK
                          </label>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline">
                            COPY TO ALL
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            OPENING STOCK VALUE
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PER UNIT
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline">
                            COPY TO ALL
                          </p>
                        </div>
                      </div>

                      {/* Warehouse Row */}
                      <div className="grid grid-cols-3 gap-0 items-start">
                        <div>
                          <select className="w-1/2 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="ralakde">Ralakde</option>
                          </select>
                        </div>
                        <div>
                          <input
                            type="number"
                            defaultValue="0"
                            className="w-1/2 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            defaultValue="2"
                            className="w-1/2 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Add Warehouses Link */}
                      <div className="flex items-center">
                        <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1">
                          <span className="text-lg">+</span>
                          Add Warehouses
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Additional spacing at bottom of content */}
            <div className="h-32"></div>
            </div>

            {/* Footer - Always at bottom */}
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-start gap-3">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeZoom}
        >
          <div 
            className="relative bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeZoom}
              className="absolute top-4 right-4 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full p-2 z-10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6">
              <img 
                src={zoomedImage}
                alt="Zoomed image"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}