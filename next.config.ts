import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // Désactive la PWA en local pour éviter les bugs de cache
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tes autres configurations Next.js s'il y en a
};

export default withPWA(nextConfig);