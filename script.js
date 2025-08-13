// Get ?id= from URL parameters
const params = new URLSearchParams(window.location.search);
const videoId = params.get("id");

// Select iframe
const videoFrame = document.getElementById("videoFrame");

if (videoId) {
  // Set iframe source
  videoFrame.src = `https://burnedplayer.pages.dev/?v=${encodeURIComponent(videoId)}`;
} else {
  // If no id in params, show message
  document.querySelector(".player-container").innerHTML = `
    <p style="color: red; font-size: 1.2rem;">
      ❌ No video ID provided. Please use ?id= in the URL.
    </p>
  `;
}
