import { Routes, Route } from 'react-router-dom';

// Placeholder pages
const ComingSoonPage = () => (
  <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
    <div className="text-center">
      <div className="text-6xl mb-4">📧</div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Team Inbox</h1>
      <p className="text-gray-600 dark:text-gray-400">Coming Soon</p>
      <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
        Collaborate on customer communications across your team
      </p>
    </div>
  </div>
);

export default function TeamInboxApp() {
  return (
    <Routes>
      <Route path="/" element={<ComingSoonPage />} />
      <Route path="*" element={<ComingSoonPage />} />
    </Routes>
  );
}

export { TeamInboxApp };