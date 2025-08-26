// Enhanced form components from FormSidePanel (compact styling, advanced features) - PRIMARY EXPORTS
export { 
  FormSidePanel,
  
  // Enhanced versions exported with simple names (these are the default ones to use)
  EnhancedFormField as FormField,
  EnhancedFormSection as FormSection,
  ConditionalFormField,
  
  // Enhanced versions with explicit names
  EnhancedFormField,
  EnhancedFormSection,
  ConditionalFormField as EnhancedConditionalFormField,
  
  // Grid layouts
  FormGrid, 
  TwoColumnGrid, 
  ThreeColumnGrid, 
  SingleColumnGrid,
  
  // Form actions
  FormActions,
  StandardFormActions,
  CreateFormActions,
  EditFormActions,
  SaveFormActions
} from './FormSidePanel'

// Basic/Original form components (simple styling, larger spacing) - LEGACY EXPORTS
export { FormField as BasicFormField } from './FormField'
export { FormSection as BasicFormSection, EssentialInfoSection, RelationshipsSection, AddressSection } from './FormSection'
export { ConditionalFormField as BasicConditionalFormField } from './ConditionalFormField'