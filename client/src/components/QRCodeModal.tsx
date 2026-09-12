import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, QrCode } from 'lucide-react';
import { sound } from '../services/sound';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, roomCode }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const inviteUrl = `${window.location.origin}/join?code=${roomCode}`;

  const copyLink = async () => {
    sound.playClick();
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl glass-card border border-white/20 p-6 shadow-2xl flex flex-col items-center text-center">
        
        {/* Close Button */}
        <button
          onClick={() => { sound.playClick(); onClose(); }}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-neon-purple to-neon-cyan flex items-center justify-center mb-3 shadow-glow-cyan">
          <QrCode className="w-6 h-6 text-white" />
        </div>

        <h3 className="font-display font-black text-xl text-white mb-1">
          Scan to Join Room
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Ask your friend to scan with their phone camera
        </p>

        {/* QR Code Container */}
        <div className="p-4 rounded-2xl bg-white shadow-xl mb-5 flex items-center justify-center">
          <QRCodeSVG
            value={inviteUrl}
            size={180}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Room Code Pill */}
        <div className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 mb-4 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-semibold uppercase">Room Code</span>
          <span className="font-display font-black text-lg tracking-widest text-neon-cyan">
            {roomCode}
          </span>
        </div>

        {/* Copy Link Button */}
        <button
          onClick={copyLink}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-90 font-bold text-sm text-white shadow-glow-purple flex items-center justify-center gap-2 btn-3d"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Invite Link</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};
