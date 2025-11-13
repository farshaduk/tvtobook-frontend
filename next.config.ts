// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     domains: [],
//   },
//   // Enable RTL support
//   compiler: {
//     styledComponents: true,
//   },
// }

// module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  images: {
    unoptimized: true,
  },
  // Enable RTL support
  compiler: {
    styledComponents: true,
  },
  // Configure API URL - do not provide fallback defaults here; require environment variable to be set by the host
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
}

module.exports = nextConfig





