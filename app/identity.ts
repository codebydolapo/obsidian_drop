// lib/identity.ts
import { nanoid } from 'nanoid';

const AVATARS = ['🦊', '🐨', '🐼', '🦁', '🦉', '🐯', '🦄', '🐙'];
const ADJECTIVES = ['Aura', 'Neon', 'Cosmic', 'Solar', 'Velvet', 'Lunar'];
const ANIMALS = ['Fox', 'Koala', 'Panda', 'Lion', 'Owl', 'Tiger'];

export interface Profile {
  id: string;
  name: string;
  avatar: string;
}

export function getOrCreateProfile(): Profile {
  if (typeof window === 'undefined') return { id: '', name: '', avatar: '' };
  
  const saved = localStorage.getItem('obsidian_profile');
  if (saved) return JSON.parse(saved);

  const newProfile: Profile = {
    id: nanoid(),
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    name: `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]} ${ANIMALS[Math.floor(Math.random() * ANIMALS.length)]}`
  };

  localStorage.setItem('obsidian_profile', JSON.stringify(newProfile));
  return newProfile;
}