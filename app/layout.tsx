import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Phố Việt — Giữ gốc, đón mới',description:'Khám phá phố Việt, cùng làm nhiệm vụ văn hóa trong phòng chơi 3D.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="vi"><head><link rel="preload" href="/fonts/noto-sans-regular.woff" as="font" type="font/woff" crossOrigin="anonymous"/><link rel="preload" href="/fonts/noto-sans-bold.woff" as="font" type="font/woff" crossOrigin="anonymous"/></head><body>{children}</body></html>}
