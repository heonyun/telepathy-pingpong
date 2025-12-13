
import "./globals.css";
import ServiceWorkerRegister from "./ServiceWorkerRegister";
import InstallPrompt from "./InstallPrompt"; // Add InstallPrompt

export const metadata = {
    title: "Telepathy Pingpong",
    description: "One-Touch Heartbeat Communication",
    manifest: "/manifest.json",
    themeColor: "#ff007a",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "One-Touch",
    },
    icons: {
        icon: "/icons/icon-192x192.png",
        apple: "/icons/icon-192x192.png",
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                {children}
                <ServiceWorkerRegister />
                <InstallPrompt />
            </body>
        </html>
    );
}
