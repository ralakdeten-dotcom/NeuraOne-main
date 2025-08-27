import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { AddContactPersonButton } from '../AddContactPersonButton';

interface ContactPerson {
  id: string;
  salutation: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  workPhoneCountryCode: string;
  workPhone: string;
  mobileCountryCode: string;
  mobile: string;
  skypeName: string;
  designation: string;
  department: string;
}

interface ContactPersonsProps {
  formData: any;
  handleInputChange: (field: string, value: ContactPerson[]) => void;
}

export const ContactPersons: React.FC<ContactPersonsProps> = ({ formData, handleInputChange }) => {
  const contactPersons = formData.contactPersons || [];

  const addContactPerson = () => {
    const newContactPerson: ContactPerson = {
      id: Date.now().toString(),
      salutation: '',
      firstName: '',
      lastName: '',
      emailAddress: '',
      workPhoneCountryCode: '+44',
      workPhone: '',
      mobileCountryCode: '+44',
      mobile: '',
      skypeName: '',
      designation: '',
      department: ''
    };

    const updatedContacts = [...contactPersons, newContactPerson];
    handleInputChange('contactPersons', updatedContacts);
  };

  const removeContactPerson = (id: string) => {
    const updatedContacts = contactPersons.filter((contact: ContactPerson) => contact.id !== id);
    handleInputChange('contactPersons', updatedContacts);
  };

  const updateContactPerson = (id: string, field: keyof ContactPerson, value: string) => {
    const updatedContacts = contactPersons.map((contact: ContactPerson) => 
      contact.id === id ? { ...contact, [field]: value } : contact
    );
    handleInputChange('contactPersons', updatedContacts);
  };

  // Ensure at least one row is always shown
  React.useEffect(() => {
    if (contactPersons.length === 0) {
      addContactPerson();
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Table Structure - Always Visible */}
      <div className="w-full">
        <table className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <thead className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                SALUTATION
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                FIRST NAME
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                LAST NAME<span className="text-red-500 ml-1">*</span>
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                EMAIL ADDRESS
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                WORK PHONE
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                MOBILE
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                SKYPE NAME/NUMBER
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                DESIGNATION
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                DEPARTMENT
              </th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {contactPersons.map((contact: ContactPerson, index: number) => (
              <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                {/* Salutation */}
                <td className="px-3 py-3 w-24">
                  <select
                    value={contact.salutation}
                    onChange={(e) => updateContactPerson(contact.id, 'salutation', e.target.value)}
                    className="w-full h-8 px-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value=""></option>
                    <option value="Mr.">Mr.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Dr.">Dr.</option>
                  </select>
                </td>

                {/* First Name */}
                <td className="px-3 py-3">
                  <input
                    type="text"
                    value={contact.firstName}
                    onChange={(e) => updateContactPerson(contact.id, 'firstName', e.target.value)}
                    className="w-full h-8 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </td>

                {/* Last Name */}
                <td className="px-3 py-3">
                  <input
                    type="text"
                    value={contact.lastName}
                    onChange={(e) => updateContactPerson(contact.id, 'lastName', e.target.value)}
                    className="w-full h-8 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    aria-required="true"
                  />
                </td>

                {/* Email Address */}
                <td className="px-3 py-3">
                  <input
                    type="email"
                    value={contact.emailAddress}
                    onChange={(e) => updateContactPerson(contact.id, 'emailAddress', e.target.value)}
                    className="w-full h-8 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </td>

                {/* Work Phone */}
                <td className="px-3 py-3">
                  <div className="flex w-full">
                    <select
                      value={contact.workPhoneCountryCode}
                      onChange={(e) => updateContactPerson(contact.id, 'workPhoneCountryCode', e.target.value)}
                      className="flex-shrink-0 w-16 h-8 px-1 text-sm border border-gray-300 dark:border-gray-600 rounded-l focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-r-0"
                    >
                      <option value="+44">+44</option>
                      <option value="+1">+1</option>
                      <option value="+91">+91</option>
                      <option value="+49">+49</option>
                    </select>
                    <input
                      type="tel"
                      value={contact.workPhone}
                      onChange={(e) => updateContactPerson(contact.id, 'workPhone', e.target.value)}
                      className="flex-1 h-8 px-2 text-sm border border-gray-300 dark:border-gray-600 rounded-r focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </td>

                {/* Mobile */}
                <td className="px-3 py-3">
                  <div className="flex w-full">
                    <select
                      value={contact.mobileCountryCode}
                      onChange={(e) => updateContactPerson(contact.id, 'mobileCountryCode', e.target.value)}
                      className="flex-shrink-0 w-16 h-8 px-1 text-sm border border-gray-300 dark:border-gray-600 rounded-l focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-r-0"
                    >
                      <option value="+44">+44</option>
                      <option value="+1">+1</option>
                      <option value="+91">+91</option>
                      <option value="+49">+49</option>
                    </select>
                    <input
                      type="tel"
                      value={contact.mobile}
                      onChange={(e) => updateContactPerson(contact.id, 'mobile', e.target.value)}
                      className="flex-1 h-8 px-2 text-sm border border-gray-300 dark:border-gray-600 rounded-r focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </td>

                {/* Skype Name/Number */}
                <td className="px-3 py-3">
                  <input
                    type="text"
                    value={contact.skypeName}
                    onChange={(e) => updateContactPerson(contact.id, 'skypeName', e.target.value)}
                    className="w-full h-8 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </td>

                {/* Designation */}
                <td className="px-3 py-3">
                  <input
                    type="text"
                    value={contact.designation}
                    onChange={(e) => updateContactPerson(contact.id, 'designation', e.target.value)}
                    className="w-full h-8 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </td>

                {/* Department */}
                <td className="px-3 py-3">
                  <input
                    type="text"
                    value={contact.department}
                    onChange={(e) => updateContactPerson(contact.id, 'department', e.target.value)}
                    className="w-full h-8 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  {contactPersons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContactPerson(contact.id)}
                      className="inline-flex items-center p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      title="Remove Contact Person"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Contact Person Button - positioned below table */}
      <div className="flex justify-start pt-4">
        <AddContactPersonButton onClick={addContactPerson} />
      </div>
    </div>
  );
};