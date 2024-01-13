module.exports = [
  {
    name: "erp",
    script: "dist/server.js",
    args: "",
    exec_mode: "",
    instances: "",
    autostart: true,
    watch: false,
    max_memory_restart: "1G",
    log_date_format: "YYYY-MM-DD HH:mm Z",
    env: {
      NODE_ENV: "prod",
    },
  },
];
