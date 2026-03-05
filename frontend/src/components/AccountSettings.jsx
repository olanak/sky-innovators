export default function AccountSettings() {
  return (
    <div className="max-w-4xl mx-auto p-8 animate-fade-in w-full transition-colors duration-300">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">Account Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors">Manage your profile, security, and platform preferences.</p>
      </div>

      <div className="space-y-6">
        
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm transition-colors">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 transition-colors">Profile Information</h3>
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold text-gray-400 dark:text-gray-300 border border-gray-200 dark:border-gray-600 transition-colors">
              O
            </div>
            <div>
              <button className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-cyan-300 dark:hover:border-cyan-500 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-lg shadow-sm transition-all duration-200">
                Change Avatar
              </button>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 transition-colors">JPG, GIF or PNG. Max size of 2MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Full Name</label>
              <input type="text" defaultValue="Olana Kenea" className="w-full px-4 py-2 bg-transparent dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Email Address</label>
              <input type="email" defaultValue="olana@sky.com" className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed transition-all" disabled />
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm transition-colors">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 transition-colors">Security</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Current Password</label>
              <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-transparent dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all dark:placeholder-gray-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">New Password</label>
              <input type="password" placeholder="Enter new password" className="w-full px-4 py-2 bg-transparent dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all dark:placeholder-gray-400" />
            </div>
          </div>
          <button className="mt-4 px-4 py-2 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
            Update Password
          </button>
        </div>

        {/* Save Changes Footer */}
        <div className="flex justify-end pt-4">
          <button className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold rounded-xl shadow-md shadow-cyan-500/20 dark:shadow-cyan-900/40 transition-all">
            Save All Changes
          </button>
        </div>

      </div>
    </div>
  );
}