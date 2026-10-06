import type { Metadata } from 'next';

// The chat page is a Client Component, so its metadata lives here
export const metadata: Metadata = {
  title: 'Radar',
  description: 'See who is nearby and start an end-to-end encrypted chat.',
};

export default function ChatLayout({ children }: LayoutProps<'/chat'>) {
  return children;
}
