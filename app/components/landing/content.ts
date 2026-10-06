// Copy and data for the landing page, kept in one place so it's easy to edit.

import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  EyeOff,
  Fingerprint,
  GraduationCap,
  Handshake,
  Lock,
  MapPin,
  Mic,
  PartyPopper,
  Radar,
  Smartphone,
  UserX,
} from 'lucide-react';

export const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Radar,
    title: 'Open the radar',
    body: 'Everyone on your Wi-Fi with Obsidian Drop open shows up around you, each with a random name like Neon Fox.',
  },
  {
    icon: Handshake,
    title: 'Send a request',
    body: 'Tap someone to say hello. They see who it is and have 30 seconds to accept or decline.',
  },
  {
    icon: Lock,
    title: 'Chat privately, then let it go',
    body: 'Messages are end-to-end encrypted. Close the chat and it is gone for both of you. Nothing is saved.',
  },
];

export const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Lock,
    title: 'End-to-end encrypted',
    body: 'Every chat gets fresh keys made in your browser. Our server relays scrambled text it cannot read.',
  },
  {
    icon: UserX,
    title: 'No accounts',
    body: 'No email, no phone number, no password. You get a random name and avatar the moment you arrive.',
  },
  {
    icon: EyeOff,
    title: 'Nothing is stored',
    body: 'Messages live only in the two open browser tabs. There is no history, no backup, no database.',
  },
  {
    icon: Fingerprint,
    title: 'Safety codes',
    body: 'Both screens show the same 20-digit code. Compare them in person and you know nobody is listening in.',
  },
  {
    icon: MapPin,
    title: 'Venue codes',
    body: 'Crowded network? Pick a code like #stage1 and only people who enter it will see each other.',
  },
  {
    icon: Smartphone,
    title: 'Nothing to install',
    body: 'Works in any modern browser on phones and laptops. Share a link and you are both in.',
  },
];

// True facts about how the app works, shown next to the live online count
export const FACTS: { value: string; label: string }[] = [
  { value: '0', label: 'messages stored on our servers' },
  { value: '0', label: 'accounts or sign-ups needed' },
  { value: '256-bit', label: 'AES-GCM encryption, keys made on your device' },
  { value: '30 s', label: 'before an unanswered request expires' },
];

export const USE_CASES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Mic, title: 'Conferences & meetups', body: 'Ask the person two rows ahead about their talk without swapping numbers.' },
  { icon: GraduationCap, title: 'Classrooms & campuses', body: 'Quick, anonymous questions and study chats that do not follow you home.' },
  { icon: Briefcase, title: 'Coworking & offices', body: 'Reach the desk across the room without adding someone on three apps.' },
  { icon: PartyPopper, title: 'Events & venues', body: 'Print a venue code on a poster and let the room find each other.' },
];

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatar: string;
  // Samples only render in development, so placeholder quotes never reach the live site
  sample?: boolean;
}

// Replace these with real quotes (with the person's permission) before launch.
// Entries without `sample: true` are shown in production.
export const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'Sample quote: we put a venue code on the slides and half the room was chatting before the Q&A started.',
    name: 'Sample Name',
    role: 'Meetup organiser',
    avatar: '🦊',
    sample: true,
  },
  {
    quote: 'Sample quote: comparing the safety code in person takes five seconds and makes it feel properly private.',
    name: 'Sample Name',
    role: 'Security engineer',
    avatar: '🦉',
    sample: true,
  },
  {
    quote: 'Sample quote: no sign-up meant my whole study group was in within a minute.',
    name: 'Sample Name',
    role: 'University student',
    avatar: '🐼',
    sample: true,
  },
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: 'Who can see me on the radar?',
    a: 'Only people on the same network as you (for example the same Wi-Fi) who have Obsidian Drop open. If you join a venue code, only people on your network who entered the same code.',
  },
  {
    q: 'Can Obsidian Drop read my messages?',
    a: 'No. Messages are encrypted in your browser with keys that never leave your device. Our server only passes along scrambled text. Compare the safety code with the other person to confirm nobody swapped the keys.',
  },
  {
    q: 'What happens when I close a chat?',
    a: 'It ends for both of you and the messages are gone. They are never written to a database, so there is nothing to recover.',
  },
  {
    q: 'Do I need to install anything or sign up?',
    a: 'No. Open the site in a modern browser and you get a random name straight away. There are no accounts.',
  },
  {
    q: 'Why does it sometimes take a minute to connect?',
    a: 'When nobody has used the app for a while, our server goes to sleep and needs about a minute to wake up. After that, connections are instant.',
  },
  {
    q: 'Can I find someone who is on mobile data?',
    a: 'Usually not yet. Phones on mobile data often appear on different networks, so the radar works best when everyone is on the same Wi-Fi.',
  },
];
