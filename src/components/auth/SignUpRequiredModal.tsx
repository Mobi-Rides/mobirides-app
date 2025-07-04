import React from "react";

interface SignUpRequiredModalProps {
  open: boolean;
  onSignUp: () => void;
  onCancel: () => void;
}

export const SignUpRequiredModal: React.FC<SignUpRequiredModalProps> = ({
  open,
  onSignUp,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60">
      <div className="bg-white dark:bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-border animate-fade-in">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-white text-2xl"
          onClick={onCancel}
          aria-label="Close"
        >
          ×
        </button>
        <div className="flex items-center mb-4">
          <span className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl p-2 mr-3 text-3xl shadow-sm">🔒</span>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sign Up Required</h2>
        </div>
        <p className="mb-4 text-gray-700 dark:text-gray-200">
          You need to create an account to access this protected content.{' '}
          <span className="text-blue-600 font-semibold hover:underline cursor-pointer">Signing up is quick and free!</span>
        </p>
        <div className="rounded-xl p-4 mb-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/40 dark:to-purple-900/40 border border-blue-100 dark:border-blue-800">
          <p className="font-bold mb-3 flex items-center text-lg text-blue-700 dark:text-blue-300">
            <span className="mr-2 text-xl">⭐</span>Why sign up?
          </p>
          <ul className="space-y-2 pl-2">
            <li className="flex items-center text-base font-medium text-blue-900 dark:text-blue-100">
              <span className="mr-2 text-green-500">✔️</span>Access exclusive features
            </li>
            <li className="flex items-center text-base font-medium text-blue-900 dark:text-blue-100">
              <span className="mr-2 text-red-400">❤️</span>Save your preferences
            </li>
            <li className="flex items-center text-base font-medium text-blue-900 dark:text-blue-100">
              <span className="mr-2 text-yellow-400">⚡</span>Get personalized recommendations
            </li>
            <li className="flex items-center text-base font-medium text-blue-900 dark:text-blue-100">
              <span className="mr-2 text-blue-500">🛡️</span>Secure booking management
            </li>
          </ul>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <button
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors font-medium"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-md hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all"
            onClick={onSignUp}
          >
            Sign Up Now
          </button>
        </div>
      </div>
    </div>
  );
}; 