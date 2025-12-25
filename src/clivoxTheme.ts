import { PartialTheme } from '@fluentui/react';

// Palette extracted from the "Welcome to Clivox" artifact
export const clivoxTheme: PartialTheme = {
    palette: {
        themePrimary: '#2dd4bf', // Teal Button Color
        themeLighterAlt: '#0a1c1c',
        themeLighter: '#1a3d3d',
        themeLight: '#2e6b6b',
        themeTertiary: '#00cccc',
        themeSecondary: '#00e5e5',
        themeDarkAlt: '#00e5e5',
        themeDark: '#00cccc',
        themeDarker: '#009999',
        neutralLighterAlt: '#2d2b55', // Dark Purple/Blue background tone
        neutralLighter: '#3a3869',
        neutralLight: '#4a487d',
        neutralQuaternaryAlt: '#595691',
        neutralQuaternary: '#6966a5',
        neutralTertiaryAlt: '#7e7bb9',
        neutralTertiary: '#c8c8c8',
        neutralSecondary: '#d0d0d0',
        neutralPrimaryAlt: '#dadada',
        neutralPrimary: '#ffffff', // White Text
        neutralDark: '#f4f4f4',
        black: '#f8f8f8',
        white: '#1e1b4b', // Deep Blue Background (Slate/Indigo mix)
    },
    effects: {
        roundedCorner2: '16px',
        roundedCorner4: '24px',
    },
    fonts: {
        medium: {
            fontFamily: '"Outfit", "Segoe UI", sans-serif',
        }
    }
};
