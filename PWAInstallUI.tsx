import React, { useState } from 'react';
import { Download, Smartphone, Check, Copy, ExternalLink, X, WifiOff, Sparkles } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from './usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'hud' | 'menu' }> = ({ variant = 'hud' }) => {
  const { isInstallable, isInstalled, isIOS, isChrome, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  // If already running as installed APK / standalone PWA, hide or show 'Installed'
  if (isInstalled) {
    if (variant === 'menu') {
      return (
        <div className="flex items-center gap-2 text-green-700 bg-green-100 p-2 border-2 border-green-600 text-sm">
          <Check className="w-4 h-4 text-green-600" />
          <span>App is installed as standalone APK / PWA</span>
        </div>
      );
    }
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenExternal = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <>
      {variant === 'hud' ? (
        <button
          onClick={handleClick}
          title="Install CozyPresenter as Android APK / Web App"
          className="mc-btn px-2 sm:px-2.5 py-0.5 sm:py-1 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm bg-[#448833]! hover:bg-[#55aa44]! text-white border-[#77dd55]! shadow-md whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="hidden md:inline">Install APK</span>
          <span className="md:hidden">APK</span>
        </button>
      ) : (
        <div className="bg-[#b0b0b0] p-3 border-2 border-[#555] shadow-inner space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xl text-black font-bold flex items-center gap-1.5">
              <Smartphone className="w-5 h-5 text-black" /> Google Chrome / Android APK
            </span>
            <span className="text-xs bg-[#407a3c] text-white px-2 py-0.5 border border-[#66aa66]">
              PWA Ready
            </span>
          </div>
          <p className="text-sm text-[#222]">
            Install CozyPresenter 3D directly onto your Android device or Chrome desktop. Chrome builds a native WebAPK with offline support!
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleClick}
              className="mc-btn flex-1 py-1.5 px-3 flex items-center justify-center gap-2 bg-[#448833]! text-white border-[#77dd55]! font-bold text-base"
            >
              <Download className="w-4 h-4" />
              {isInstallable ? 'Install as APK Now' : 'How to Install in Chrome'}
            </button>
            <button
              onClick={handleOpenExternal}
              title="Open in new tab to install"
              className="mc-btn px-3 py-1.5 flex items-center gap-1 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Installation Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
          <div className="mc-panel w-full max-w-md p-5 bg-[#c6c6c6] border-4 border-[#000] shadow-2xl relative">
            <div className="flex justify-between items-center border-b-2 border-[#555] pb-2 mb-3">
              <h3 className="text-2xl text-black flex items-center gap-2">
                <Smartphone className="w-6 h-6 text-green-700" />
                Install CozyPresenter 3D
              </h3>
              <button
                onClick={() => setShowGuide(false)}
                className="mc-btn w-7 h-7 flex items-center justify-center text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-black text-lg">
              {/* Chrome on Android / Mobile */}
              <div className="bg-[#b0b0b0] p-3 border-2 border-[#555]">
                <div className="font-bold text-xl text-[#111] mb-1 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  Chrome on Android (WebAPK):
                </div>
                <ol className="list-decimal list-inside space-y-1 text-base text-[#222]">
                  <li>
                    Open this app in <strong>Google Chrome</strong> (outside the preview iframe).
                  </li>
                  <li>
                    Tap the <strong>three dots (⋮)</strong> menu in the upper-right of Chrome.
                  </li>
                  <li>
                    Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </li>
                  <li>
                    Chrome and Google Play will automatically generate and install the <strong>WebAPK</strong> onto your phone!
                  </li>
                </ol>
              </div>

              {/* Desktop Chrome flow */}
              <div className="bg-[#b0b0b0] p-3 border-2 border-[#555]">
                <div className="font-bold text-xl text-[#111] mb-1">
                  Chrome on PC / Mac / Chromebook:
                </div>
                <p className="text-base text-[#222]">
                  Look for the <strong>Install icon (⊕ / ⤓)</strong> on the right side of Chrome's URL address bar, or click Chrome menu (⋮) &gt; <strong>"Install CozyPresenter 3D..."</strong>.
                </p>
              </div>

              {/* iOS Note */}
              {isIOS && (
                <div className="bg-[#e2d8b0] p-2.5 border-2 border-[#887744] text-sm text-[#332200]">
                  <strong>Safari iOS:</strong> Tap the <strong>Share</strong> button (square with up arrow), then tap <strong>"Add to Home Screen"</strong>.
                </div>
              )}

              {/* Direct Open / Copy link */}
              <div className="pt-2 border-t border-[#888] flex gap-2">
                <button
                  onClick={handleOpenExternal}
                  className="mc-btn flex-1 py-2 flex items-center justify-center gap-2 bg-[#3b82f6]! text-white border-[#93c5fd]! text-lg font-bold"
                >
                  <ExternalLink className="w-4 h-4" /> Open in New Chrome Tab
                </button>
                <button
                  onClick={handleCopyLink}
                  className="mc-btn px-3 py-2 flex items-center gap-1.5 text-base"
                >
                  {copied ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => setShowGuide(false)}
                className="mc-btn w-full py-1.5 text-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-[#a33] text-white px-3 py-1.5 border-2 border-[#f66] shadow-xl text-base">
      <WifiOff className="w-4 h-4 animate-bounce" />
      <span>Offline Mode — Running from cached PWA storage!</span>
    </div>
  );
};
