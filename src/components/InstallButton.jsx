import { useState, useEffect } from 'react';

const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault(); // Prevent automatic prompt
      setDeferredPrompt(e); // Save the event
      setShowInstall(true); // Show custom button
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt(); // Show browser install prompt

    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setDeferredPrompt(null);
      setShowInstall(false);
    });
  };

  if (!showInstall) return null;

  return (
    <button
      onClick={handleInstall}
      className="fixed bottom-20 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md z-50 sm:hidden"
    >
      Install App
    </button>
  );
};

export default InstallButton;
