import React from 'react';
import { sound } from '../services/sound';

export const AVATAR_LIST = [
  { id: '1', emoji: '🧑', name: 'Cool Human' },
  { id: '2', emoji: '👩', name: 'Explorer' },
  { id: '3', emoji: '😎', name: 'Pro Gamer' },
  { id: '4', emoji: '🤠', name: 'Wild West' },
  { id: '5', emoji: '🐱', name: 'Cat' },
  { id: '6', emoji: '🦊', name: 'Fox' },
  { id: '7', emoji: '🐼', name: 'Panda' },
  { id: '8', emoji: '🦁', name: 'Lion' },
  { id: '9', emoji: '🦄', name: 'Unicorn' },
  { id: '10', emoji: '🚀', name: 'Astronaut' },
  { id: '11', emoji: '👾', name: 'Alien' },
  { id: '12', emoji: '🤖', name: 'Robot' },
  { id: '13', emoji: '👻', name: 'Ghost' },
  { id: '14', emoji: '🧙‍♂️', name: 'Wizard' },
  { id: '15', emoji: '🦸‍♀️', name: 'Hero' },
  { id: '16', emoji: '🍕', name: 'Pizza Lover' },
  { id: '17', emoji: '🎸', name: 'Rockstar' },
  { id: '18', emoji: '👑', name: 'Royalty' },
  { id: '19', emoji: '🔥', name: 'Fireball' },
  { id: '20', emoji: '💎', name: 'Diamond' },
];

interface AvatarPickerProps {
  selectedAvatar: string;
  onSelect: (avatar: string) => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({ selectedAvatar, onSelect }) => {
  return (
    <div className="w-full">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
        Choose Your Avatar
      </label>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-3 rounded-2xl glass-panel border border-white/10">
        {AVATAR_LIST.map((item) => {
          const isSelected = selectedAvatar === item.emoji;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                sound.playClick();
                onSelect(item.emoji);
              }}
              title={item.name}
              className={`text-2xl h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isSelected
                  ? 'bg-gradient-to-tr from-neon-purple to-neon-pink scale-110 shadow-glow-purple ring-2 ring-white border-transparent'
                  : 'bg-white/5 hover:bg-white/15 hover:scale-105 border border-white/5'
              }`}
            >
              {item.emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
};
