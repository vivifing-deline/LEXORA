module.exports = {
  apps: [
    {
      name: 'lexora-backend',
      script: './dist/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        APP_MODE: 'normal',
        PORT: 5000
      }
    }
  ]
};

