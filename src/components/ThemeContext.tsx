import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

interface ThemeConfig {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    theme: 'light' | 'dark' | 'glass';
    orgName: string;
}

interface ThemeContextType {
    config: ThemeConfig;
    loading: boolean;
    updateOrganization: (orgId: number) => Promise<void>;
}

const defaultTheme: ThemeConfig = {
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    logoUrl: '/pwa-192x192.png',
    theme: 'dark',
    orgName: 'Clivox'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<ThemeConfig>(defaultTheme);
    const [loading, setLoading] = useState(true);

    const updateOrganization = async (orgId: number) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/api/organizaciones/${orgId}`);
            if (res.ok) {
                const data = await res.json();
                const estetica = data.configuracion_estetica ? JSON.parse(data.configuracion_estetica) : {};

                setConfig({
                    primaryColor: estetica.primaryColor || defaultTheme.primaryColor,
                    secondaryColor: estetica.secondaryColor || defaultTheme.secondaryColor,
                    logoUrl: data.logo_url || defaultTheme.logoUrl,
                    theme: estetica.theme || defaultTheme.theme,
                    orgName: data.nombre
                });
            }
        } catch (err) {
            console.error("Error loading org theme", err);
        } finally {
            setLoading(false);
        }
    };

    // Al iniciar, intentar cargar la organización del usuario logueado o por default
    useEffect(() => {
        const storedOrg = localStorage.getItem('clivox_org');
        if (storedOrg) {
            updateOrganization(Number(storedOrg));
        } else {
            setLoading(false);
        }
    }, []);

    // Aplicar variables CSS dinámicas al root
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--primary-org', config.primaryColor);
        root.style.setProperty('--secondary-org', config.secondaryColor);

        // Aquí podrías cambiar clases globales de Tailwind o CSS vanilla
        if (config.theme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, [config]);

    return (
        <ThemeContext.Provider value={{ config, loading, updateOrganization }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
