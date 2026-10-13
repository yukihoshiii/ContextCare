import type { Metadata } from 'next';
import {cookies} from 'next/headers';
import './globals.css';
import {themeBootstrap} from '@/lib/theme-bootstrap';
export const metadata: Metadata = { title: 'ContextCare · Patient workspace', description: 'Evidence-linked preparation for every appointment. Synthetic-data prototype.', robots: { index: false, follow: false } };
export default async function RootLayout({ children }: { children: React.ReactNode }) {
 const saved=(await cookies()).get('contextcare-theme')?.value;
 const theme=saved==='dark'||saved==='light'?saved:undefined;
 return <html lang="en" data-theme={theme} suppressHydrationWarning><head><script id="theme-bootstrap" dangerouslySetInnerHTML={{__html:themeBootstrap}}/></head><body>{children}</body></html>;
}
