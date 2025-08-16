const servers = {
  streamhg: "https://hglink.to/e/zqt5ix0dpggn",
  abyss: "https://zplayer.io/?v=tFIl3ebsb"
};

function loadServer(server) {
  const frame = document.getElementById("videoFrame");
  frame.src = servers[server];
}

// Auto-load default server
window.onload = () => {
  loadServer("streamhg");
};
