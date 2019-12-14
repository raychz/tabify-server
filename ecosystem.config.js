module.exports = {
  apps : [{
    name: 'API',
    script: './dist/main.js',
    exec_mode : "cluster_mode",

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    node_args: '-r ./tsconfig-paths-bootstrap.js -r dotenv-safe/config',
    instances: 'max',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }],

  deploy : {
    // production : {
    //   user : 'node',
    //   host : '212.83.163.1',
    //   ref  : 'origin/master',
    //   repo : 'git@github.com:repo.git',
    //   path : '/var/www/production',
    //   'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    // }
  }
};
