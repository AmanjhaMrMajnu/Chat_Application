// PM2 ecosystem configuration file
// Use with: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: 'chat-server',
    script: './index.js',
    
    // Instances
    instances: 1,
    exec_mode: 'cluster',
    
    // Auto restart configuration
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    
    // Logging
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Environment variables
    env: {
      NODE_ENV: 'development',
      PORT: 8000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8000
    },
    
    // Advanced features
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Exponential backoff restart delay
    exp_backoff_restart_delay: 100,
    
    // Listen timeout
    listen_timeout: 3000,
    
    // Kill timeout
    kill_timeout: 5000
  }]
};
