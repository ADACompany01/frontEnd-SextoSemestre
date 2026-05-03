// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Adiciona suporte para extensões .web.ts
config.resolver.sourceExts.push('web.ts', 'web.tsx', 'web.js', 'web.jsx');

module.exports = config;



