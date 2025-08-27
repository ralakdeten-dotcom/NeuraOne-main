import React from 'react';
import { X } from 'lucide-react';

interface RoundingExamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoundingExamplesModal: React.FC<RoundingExamplesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
      <div className="flex justify-center items-center min-h-screen p-2 sm:p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xs sm:max-w-md lg:max-w-lg">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
              Rounding Examples
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-4 sm:px-6 py-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Round Off To
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Input Value
                    </th>
                    <th className="px-2 sm:px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Rounded Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  <tr>
                    <td className="px-2 sm:px-3 py-3">
                      <span className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">
                        Never mind
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                      1000.678
                    </td>
                    <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                      1000.678
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 sm:px-3 py-3">
                      <span className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">
                        Nearest whole number
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                      1000.678
                    </td>
                    <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                      1001
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 sm:px-3 py-3">
                      <span className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">
                        0.99
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                      1000.678
                    </td>
                    <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                      1000.99
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 sm:px-3 py-3">
                      <span className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">
                        0.50
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                      1000.678
                    </td>
                    <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                      1000.50
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 sm:px-3 py-3">
                      <span className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">
                        0.49
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                      1000.678
                    </td>
                    <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                      1000.49
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 sm:px-3 py-3">
                      <span className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">
                        Decimal Places
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                      -
                    </td>
                    <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                      -
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={onClose}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium w-full sm:w-auto text-center"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};