/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add the backend folder to module resolution
    // This allows imports from the backend folder outside of frontend
    config.resolve.alias = {
      ...config.resolve.alias,
      '@backend': path.resolve(__dirname, '../backend'),
    }
    
    // Also add backend node_modules to module resolution
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(__dirname, '../backend/node_modules'),
      path.resolve(__dirname, '../backend'),
    ]
    
    return config
  },
}

module.exports = nextConfig
