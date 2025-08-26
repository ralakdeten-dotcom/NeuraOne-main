import { Mail, MessageSquare, Users, Zap } from 'lucide-react';

export function TeamInboxComingSoon() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            TeamInbox
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-400 mb-8">
            Coming Soon
          </p>
        </div>

        <div className="mb-12">
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Manage all your customer communications in one unified inbox. 
            Collaborate with your team, automate responses, and provide 
            exceptional customer support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <MessageSquare className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-4 mx-auto" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Unified Conversations
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Email, chat, and social messages in one place
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <Users className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-4 mx-auto" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Team Collaboration
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Assign, mention, and work together seamlessly
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <Zap className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-4 mx-auto" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Smart Automation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Templates, rules, and automated workflows
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <Mail className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-4 mx-auto" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              CRM Integration
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Full customer context from your CRM
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300">
          <span className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Under Development</span>
        </div>
      </div>
    </div>
  );
}