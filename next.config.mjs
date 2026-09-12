/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Cover art comes from the backend API host; avatars can come from
    // wherever the OAuth provider hosts them (Google, Supabase storage,
    // etc.) — that's decided by music-backend, which this frontend-only
    // change can't enumerate, so this allows any https host rather than
    // risk breaking images from a host that wasn't listed.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
}

export default nextConfig
