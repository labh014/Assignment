// Script to kill process on port 3000 before starting server
const { exec } = require('child_process');
const os = require('os');

const PORT = 3000;

function killPort() {
  const platform = os.platform();
  
  if (platform === 'win32') {
    // Windows
    exec(`netstat -ano | findstr :${PORT}`, (error, stdout) => {
      if (stdout) {
        const lines = stdout.trim().split('\n');
        const pids = new Set();
        
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(pid)) {
            pids.add(pid);
          }
        });
        
        pids.forEach(pid => {
          console.log(`🔪 Killing process ${pid} on port ${PORT}...`);
          exec(`taskkill /PID ${pid} /F`, (killError) => {
            if (!killError) {
              console.log(`✅ Process ${pid} killed`);
            }
          });
        });
        
        if (pids.size === 0) {
          console.log(`✅ Port ${PORT} is free`);
        }
      } else {
        console.log(`✅ Port ${PORT} is free`);
      }
    });
  } else {
    // Linux/Mac
    exec(`lsof -ti:${PORT}`, (error, stdout) => {
      if (stdout) {
        const pids = stdout.trim().split('\n');
        pids.forEach(pid => {
          console.log(`🔪 Killing process ${pid} on port ${PORT}...`);
          exec(`kill -9 ${pid}`, (killError) => {
            if (!killError) {
              console.log(`✅ Process ${pid} killed`);
            }
          });
        });
      } else {
        console.log(`✅ Port ${PORT} is free`);
      }
    });
  }
}

killPort();

