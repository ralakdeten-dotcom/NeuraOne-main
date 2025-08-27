import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { getApiBaseUrl } from '@/utils/tenant';

// Keep existing interfaces for frontend compatibility
export interface PriceListAPI {
  id: string | number;
  name: string;
  description?: string;
  currency: string;
  details: string;
  pricingScheme: string;
  roundOffPreference: string;
  status?: 'active' | 'inactive';
  originalData?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface PriceListFormData {
  name: string;
  transactionType: 'sales' | 'purchase';
  priceListType: 'all_items' | 'individual_items';
  description: string;
  percentage: string;
  roundOffTo: string;
  markupType: 'markup' | 'markdown';
  // Individual Items fields
  pricingScheme?: 'unit_pricing' | 'volume_pricing';
  currency?: string;
  includeDiscount?: boolean;
  // Item values for Individual Items
  itemValues?: {
    [itemId: string]: {
      customRate?: string;
      discount?: string;
    };
  };
}

// Backend interfaces
interface BackendPriceBook {
  pricebook_id: number;
  name: string;
  description?: string;
  currency_id: string;
  currency_code?: string;
  decimal_place: number;
  is_default: boolean;
  is_increase: boolean;
  percentage?: number;
  pricebook_type: 'fixed_percentage' | 'per_item';
  rounding_type: string;
  sales_or_purchase_type: 'sales' | 'purchases';
  status: 'active' | 'inactive';
  created_time: string;
  last_modified_time: string;
  pricebook_items?: BackendPriceBookItem[];
}

interface BackendPriceBookItem {
  pricebook_item_id: number;
  item: number;
  pricebook_rate: string;
}

// API Configuration
const getApiUrl = () => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/api/inventory/pricelists/pricebooks`;
};

// Field transformation functions
const mapRoundingType = (frontendType: string): string => {
  const mapping: Record<string, string> = {
    'never_mind': 'no_rounding',
    'nearest_whole': 'round_to_dollor',
    '0.99': 'round_to_dollar_minus_01',
    '0.50': 'round_to_half_dollar',
    '0.49': 'round_to_half_dollar_minus_01',
    'decimal_places': 'no_rounding'
  };
  return mapping[frontendType] || 'no_rounding';
};

const mapRoundingTypeFromBackend = (backendType: string): string => {
  const mapping: Record<string, string> = {
    'no_rounding': 'never_mind',
    'round_to_dollor': 'nearest_whole',
    'round_to_dollar_minus_01': '0.99',
    'round_to_half_dollar': '0.50',
    'round_to_half_dollar_minus_01': '0.49'
  };
  return mapping[backendType] || 'never_mind';
};

const getRoundOffDisplayName = (value: string) => {
  const roundOffOptions = [
    { value: 'never_mind', label: 'Never mind' },
    { value: 'nearest_whole', label: 'Nearest whole number' },
    { value: '0.99', label: '0.99' },
    { value: '0.50', label: '0.50' },
    { value: '0.49', label: '0.49' },
    { value: 'decimal_places', label: 'Decimal Places' }
  ];
  
  const option = roundOffOptions.find(opt => opt.value === value);
  return option ? option.label : 'Never mind';
};

// Transform frontend form data to backend format
const transformToBackend = (formData: PriceListFormData) => {
  const baseData = {
    name: formData.name.trim(),
    description: formData.description?.trim() || '',
    currency_id: formData.currency || 'GBP',
    sales_or_purchase_type: formData.transactionType === 'purchase' ? 'purchases' : 'sales',
    pricebook_type: formData.priceListType === 'all_items' ? 'fixed_percentage' : 'per_item',
    is_increase: formData.markupType === 'markup',
    rounding_type: mapRoundingType(formData.roundOffTo),
    status: 'active'
  };

  // Add percentage for fixed_percentage type
  if (formData.priceListType === 'all_items') {
    return {
      ...baseData,
      percentage: parseInt(formData.percentage) || 0
    };
  } else {
    // For per_item type, add pricebook_items
    const pricebook_items = [];
    if (formData.itemValues) {
      for (const [itemId, values] of Object.entries(formData.itemValues)) {
        if (values.customRate) {
          pricebook_items.push({
            item_id: itemId,
            pricebook_rate: values.customRate
          });
        }
      }
    }
    return {
      ...baseData,
      pricebook_items
    };
  }
};

// Transform backend response to frontend format
const transformFromBackend = (backendData: BackendPriceBook): PriceListAPI => {
  const details = backendData.pricebook_type === 'fixed_percentage' 
    ? (backendData.percentage ? `${backendData.percentage}% ${backendData.is_increase ? 'Markup' : 'Markdown'}` : '')
    : 'Per Item Rate';

  const originalData: PriceListFormData = {
    name: backendData.name,
    transactionType: backendData.sales_or_purchase_type === 'purchases' ? 'purchase' : 'sales',
    priceListType: backendData.pricebook_type === 'fixed_percentage' ? 'all_items' : 'individual_items',
    description: backendData.description || '',
    percentage: backendData.percentage?.toString() || '',
    roundOffTo: mapRoundingTypeFromBackend(backendData.rounding_type),
    markupType: backendData.is_increase ? 'markup' : 'markdown',
    currency: backendData.currency_id,
    pricingScheme: 'unit_pricing',
    includeDiscount: false
  };

  return {
    id: backendData.pricebook_id,
    name: backendData.name,
    description: backendData.description,
    currency: backendData.currency_code || backendData.currency_id || 'USD',
    details,
    pricingScheme: backendData.pricebook_type === 'per_item' ? 'Unit Pricing' : 'All Items',
    roundOffPreference: getRoundOffDisplayName(mapRoundingTypeFromBackend(backendData.rounding_type)),
    status: backendData.status,
    originalData,
    createdAt: backendData.created_time,
    updatedAt: backendData.last_modified_time
  };
};

// API Functions
const fetchPriceLists = async (): Promise<PriceListAPI[]> => {
  try {
    console.log('Fetching price lists from:', getApiUrl());
    const response = await axios.get(getApiUrl() + '/', {
      withCredentials: true,
    });

    console.log('Price lists fetched successfully:', response.data);
    
    // Handle different response formats (paginated, direct array, or wrapper)
    const pricebooks = response.data.results || response.data.pricebooks || response.data;
    
    if (!Array.isArray(pricebooks)) {
      console.error('Invalid response format:', response.data);
      return [];
    }

    return pricebooks.map(transformFromBackend);
  } catch (error: any) {
    console.error('Error fetching price lists:', error);
    const message = error.response?.data?.error || error.message || 'Failed to fetch price lists';
    throw new Error(message);
  }
};

const createPriceList = async (formData: PriceListFormData): Promise<PriceListAPI> => {
  try {
    const backendData = transformToBackend(formData);
    console.log('Creating price list with data:', backendData);
    
    const response = await axios.post(getApiUrl() + '/', backendData, {
      withCredentials: true,
    });

    console.log('Price list created successfully:', response.data);
    const pricebook = response.data.pricebook || response.data;
    
    return transformFromBackend(pricebook);
  } catch (error: any) {
    console.error('Error creating price list:', error);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to create price list';
    throw new Error(message);
  }
};

const updatePriceList = async (id: string | number, formData: PriceListFormData): Promise<PriceListAPI> => {
  try {
    const backendData = transformToBackend(formData);
    
    const response = await axios.put(getApiUrl() + `/${id}/`, backendData, {
      withCredentials: true,
    });

    const pricebook = response.data.pricebook || response.data;
    
    return transformFromBackend(pricebook);
  } catch (error: any) {
    console.error('Error updating price list:', error);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to update price list';
    throw new Error(message);
  }
};

const deletePriceList = async (id: string | number): Promise<void> => {
  try {
    await axios.delete(getApiUrl() + `/${id}/`, {
      withCredentials: true,
    });
  } catch (error: any) {
    console.error('Error deleting price list:', error);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to delete price list';
    throw new Error(message);
  }
};

const togglePriceListStatus = async (id: string | number, status: 'active' | 'inactive'): Promise<PriceListAPI> => {
  try {
    const endpoint = status === 'active' ? 'active' : 'inactive';
    await axios.post(getApiUrl() + `/${id}/${endpoint}/`, {}, {
      withCredentials: true,
    });

    // After status change, fetch the updated pricebook
    return getPriceListById(id);
  } catch (error: any) {
    console.error('Error updating price list status:', error);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to update price list status';
    throw new Error(message);
  }
};

const getPriceListById = async (id: string | number): Promise<PriceListAPI> => {
  if (!id || id === '') {
    throw new Error('Invalid price list ID');
  }

  try {
    const response = await axios.get(getApiUrl() + `/${id}/`, {
      withCredentials: true,
    });

    const pricebook = response.data.pricebook || response.data;
    
    return transformFromBackend(pricebook);
  } catch (error: any) {
    console.error('Error fetching price list by id:', error);
    if (error.response?.status === 404) {
      throw new Error('Price list not found');
    }
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch price list';
    throw new Error(message);
  }
};

// React Query Hooks (unchanged)
export const usePriceLists = () => {
  return useQuery({
    queryKey: ['priceLists'],
    queryFn: fetchPriceLists,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const usePriceListById = (id: string | number | undefined) => {
  return useQuery({
    queryKey: ['priceList', id],
    queryFn: () => getPriceListById(id!),
    enabled: !!id && id !== '',
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCreatePriceList = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPriceList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceLists'] });
    },
  });
};

export const useUpdatePriceList = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, formData }: { id: string | number; formData: PriceListFormData }) => 
      updatePriceList(id, formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['priceLists'] });
      queryClient.invalidateQueries({ queryKey: ['priceList', data.id] });
    },
  });
};

export const useDeletePriceList = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deletePriceList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceLists'] });
    },
  });
};

export const useTogglePriceListStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string | number; status: 'active' | 'inactive' }) => 
      togglePriceListStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['priceLists'] });
      queryClient.invalidateQueries({ queryKey: ['priceList', data.id] });
    },
  });
};