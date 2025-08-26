import { LucideIcon } from 'lucide-react'

// Base settings interfaces that all apps can use
export interface BaseSettingsItem {
  id: string
  name: string
  description?: string
  icon?: LucideIcon
}

export interface SettingsCategory {
  id: string
  title: string
  icon: LucideIcon
  color: string
  bgColor: string
  items: string[]
  sections?: SettingsSection[]
}

export interface SettingsSection {
  title?: string
  icon?: LucideIcon
  items: string[]
}

export interface SettingsGroup {
  id: string
  title: string
  categories: SettingsCategory[]
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

// Route mapping types
export interface RouteMapping {
  [categoryId: string]: string
}

export interface SpecialRouteMapping {
  [itemName: string]: string
}

// Base settings form types
export interface SettingsFormField {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'toggle' | 'textarea'
  value: any
  options?: { label: string; value: any }[]
  required?: boolean
  disabled?: boolean
}

export interface SettingsFormSection {
  title: string
  description?: string
  fields: SettingsFormField[]
}