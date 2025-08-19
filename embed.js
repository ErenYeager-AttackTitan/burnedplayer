// BurnedPlayer - Embeddable Video Player
// Usage: <script src="burned-player.js"></script>
// Then: <div data-burned-player data-src="your-stream-url.m3u8"></div>

(function() {
    'use strict';
    
    // Inject CSS styles
    const styles = `
        .burned-player {
            position: relative;
            width: 100%;
            background: #000;
            aspect-ratio: 16/9;
            max-height: 80vh;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: white;
        }

        .burned-player * {
            box-sizing: border-box;
        }

        .burned-player video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            cursor: pointer;
        }

        .burned-player-controls {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0,0,0,0.8));
            padding: 20px;
            z-index: 10;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .burned-player:hover .burned-player-controls,
        .burned-player-controls.active {
            opacity: 1;
        }

        .burned-player .progress-container {
            background: rgba(255,255,255,0.3);
            height: 4px;
            border-radius: 2px;
            margin-bottom: 12px;
            cursor: pointer;
        }

        .burned-player .progress-bar {
            background: #E50914;
            height: 100%;
            border-radius: 2px;
            width: 0%;
            transition: width 0.1s;
        }

        .burned-player .controls-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .burned-player .controls-left,
        .burned-player .controls-right {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .burned-player .control-btn {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 8px;
            border-radius: 4px;
            transition: background-color 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .burned-player .control-btn:hover {
            background-color: rgba(255,255,255,0.1);
        }

        .burned-player .control-btn.active {
            color: #E50914;
        }

        .burned-player .volume-control {
            display: flex;
            align-items: center;
        }

        .burned-player .volume-slider {
            width: 0;
            opacity: 0;
            transition: all 0.3s ease;
            overflow: hidden;
            margin-left: 0;
        }

        .burned-player .volume-control:hover .volume-slider {
            width: 80px;
            opacity: 1;
            margin-left: 8px;
        }

        .burned-player .volume-slider input {
            width: 100%;
            height: 3px;
            background: rgba(255,255,255,0.3);
            border-radius: 2px;
            outline: none;
            -webkit-appearance: none;
            appearance: none;
        }

        .burned-player .volume-slider input::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            background: #E50914;
            height: 12px;
            width: 12px;
            border-radius: 50%;
            cursor: pointer;
        }

        .burned-player .time-display {
            font-size: 14px;
            color: #B3B3B3;
            margin-left: 12px;
        }

        .burned-player .dropdown {
            position: relative;
        }

        .burned-player .dropdown-content {
            display: none;
            position: absolute;
            bottom: 100%;
            right: 0;
            background: rgba(0,0,0,0.9);
            min-width: 120px;
            border-radius: 4px;
            margin-bottom: 8px;
            z-index: 20;
            overflow: hidden;
        }

        .burned-player .dropdown.active .dropdown-content {
            display: block;
        }

        .burned-player .dropdown-header {
            padding: 8px 12px;
            font-size: 12px;
            color: #B3B3B3;
            border-bottom: 1px solid #333;
        }

        .burned-player .dropdown-item {
            padding: 8px 12px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .burned-player .dropdown-item:hover {
            background-color: rgba(255,255,255,0.1);
        }

        .burned-player .dropdown-item.selected {
            color: #E50914;
            background-color: rgba(229, 9, 20, 0.1);
        }

        .burned-player .loading-spinner {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10;
        }

        .burned-player .spinner {
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top: 3px solid #E50914;
            width: 40px;
            height: 40px;
            animation: burned-player-spin 1s linear infinite;
        }

        @keyframes burned-player-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .burned-player .error-message {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: white;
            z-index: 10;
        }

        .burned-player .error-message h3 {
            font-size: 18px;
            margin-bottom: 8px;
        }

        .burned-player .error-message p {
            font-size: 14px;
            color: #B3B3B3;
        }
    `;
    
    // Inject styles into document
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    
    class BurnedPlayer {
        constructor(container, options = {}) {
            this.container = typeof container === 'string' ? document.querySelector(container) : container;
            this.options = {
                src: options.src || '',
                autoplay: options.autoplay || false,
                controls: options.controls !== false,
                width: options.width || '100%',
                height: options.height || 'auto',
                ...options
            };
            
            this.isPlaying = false;
            this.currentTime = 0;
            this.duration = 0;
            this.volume = 1;
            this.isLoading = true;
            this.error = null;
            this.isFullscreen = false;
            this.qualities = [];
            this.currentQuality = 'auto';
            this.subtitlesEnabled = false;
            this.showControls = false;
            this.controlsTimeout = null;
            this.hls = null;
            
            this.init();
        }
        
        init() {
            this.loadHLS(() => {
                this.createPlayer();
                this.attachEvents();
                if (this.options.src) {
                    this.loadVideo(this.options.src);
                }
            });
        }
        
        loadHLS(callback) {
            if (window.Hls) {
                callback();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
            script.onload = callback;
            script.onerror = () => {
                console.error('Failed to load HLS.js');
                callback();
            };
            document.head.appendChild(script);
        }
        
        createPlayer() {
            this.container.style.width = this.options.width;
            this.container.style.height = this.options.height;
            
            this.container.innerHTML = `
                <div class="burned-player">
                    <video preload="metadata" crossorigin="anonymous" playsinline></video>
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                    </div>
                    <div class="burned-player-controls">
                        <div class="progress-container">
                            <div class="progress-bar"></div>
                        </div>
                        <div class="controls-row">
                            <div class="controls-left">
                                <button class="control-btn play-pause-btn">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                </button>
                                <div class="volume-control">
                                    <button class="control-btn volume-btn">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                                        </svg>
                                    </button>
                                    <div class="volume-slider">
                                        <input type="range" min="0" max="100" value="100" />
                                    </div>
                                </div>
                                <span class="time-display">0:00 / 0:00</span>
                            </div>
                            <div class="controls-right">
                                <button class="control-btn subtitles-btn" style="display: none;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z"/>
                                    </svg>
                                </button>
                                <div class="dropdown quality-dropdown">
                                    <button class="control-btn settings-btn">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                                        </svg>
                                    </button>
                                    <div class="dropdown-content">
                                        <div class="dropdown-header">Quality</div>
                                    </div>
                                </div>
                                <button class="control-btn fullscreen-btn">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            this.playerElement = this.container.querySelector('.burned-player');
            this.videoElement = this.container.querySelector('video');
            this.controlsElement = this.container.querySelector('.burned-player-controls');
            this.loadingElement = this.container.querySelector('.loading-spinner');
            this.progressBar = this.container.querySelector('.progress-bar');
            this.progressContainer = this.container.querySelector('.progress-container');
            this.playPauseBtn = this.container.querySelector('.play-pause-btn');
            this.volumeBtn = this.container.querySelector('.volume-btn');
            this.volumeSlider = this.container.querySelector('.volume-slider input');
            this.timeDisplay = this.container.querySelector('.time-display');
            this.subtitlesBtn = this.container.querySelector('.subtitles-btn');
            this.settingsBtn = this.container.querySelector('.settings-btn');
            this.qualityDropdown = this.container.querySelector('.quality-dropdown');
            this.fullscreenBtn = this.container.querySelector('.fullscreen-btn');
        }
        
        attachEvents() {
            // Video events
            this.videoElement.addEventListener('loadedmetadata', () => {
                this.duration = this.videoElement.duration;
                this.updateTimeDisplay();
            });
            
            this.videoElement.addEventListener('timeupdate', () => {
                this.currentTime = this.videoElement.currentTime;
                this.updateProgress();
                this.updateTimeDisplay();
            });
            
            this.videoElement.addEventListener('play', () => {
                this.isPlaying = true;
                this.updatePlayButton();
                this.showControlsTemporarily();
            });
            
            this.videoElement.addEventListener('pause', () => {
                this.isPlaying = false;
                this.updatePlayButton();
                this.showControls = true;
                this.controlsElement.classList.add('active');
            });
            
            this.videoElement.addEventListener('volumechange', () => {
                this.volume = this.videoElement.volume;
                this.updateVolumeButton();
            });
            
            // Control events
            this.playPauseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePlayPause();
            });
            
            this.volumeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMute();
            });
            
            this.volumeSlider.addEventListener('input', (e) => {
                const volume = parseFloat(e.target.value) / 100;
                this.videoElement.volume = volume;
            });
            
            this.progressContainer.addEventListener('click', (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = clickX / rect.width;
                const newTime = percentage * this.duration;
                this.videoElement.currentTime = newTime;
            });
            
            this.subtitlesBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSubtitles();
            });
            
            this.settingsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.qualityDropdown.classList.toggle('active');
            });
            
            this.fullscreenBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFullscreen();
            });
            
            // Player events
            this.playerElement.addEventListener('mousemove', () => {
                this.showControlsTemporarily();
            });
            
            this.playerElement.addEventListener('mouseenter', () => {
                this.showControls = true;
                this.controlsElement.classList.add('active');
            });
            
            this.playerElement.addEventListener('mouseleave', () => {
                if (this.isPlaying) {
                    this.showControlsTemporarily();
                }
            });
            
            this.playerElement.addEventListener('click', (e) => {
                if (e.target === this.videoElement || e.target === this.playerElement) {
                    if (this.showControls) {
                        this.hideControls();
                    } else {
                        this.showControlsTemporarily();
                    }
                }
            });
            
            // Touch events for mobile
            this.playerElement.addEventListener('touchend', (e) => {
                if (e.target === this.videoElement || e.target === this.playerElement) {
                    if (this.showControls) {
                        this.hideControls();
                    } else {
                        this.showControlsTemporarily();
                    }
                }
            });
        }
        
        loadVideo(src) {
            this.isLoading = true;
            this.error = null;
            this.updateLoadingState();
            
            if (window.Hls && window.Hls.isSupported()) {
                this.hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90,
                });
                
                this.hls.loadSource(src);
                this.hls.attachMedia(this.videoElement);
                
                this.hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
                    this.isLoading = false;
                    this.updateLoadingState();
                    const levels = this.hls.levels.map(level => `${level.height}p`);
                    this.qualities = ['auto', ...levels];
                    this.updateQualityDropdown();
                    
                    if (this.options.autoplay) {
                        this.videoElement.play().catch(e => console.log('Autoplay blocked'));
                    }
                });
                
                this.hls.on(window.Hls.Events.ERROR, (event, data) => {
                    console.error('HLS error:', data);
                    if (data.fatal) {
                        this.error = 'Failed to load video stream';
                        this.isLoading = false;
                        this.updateLoadingState();
                    }
                });
                
            } else if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari)
                this.videoElement.src = src;
                this.isLoading = false;
                this.updateLoadingState();
                this.qualities = ['auto'];
                this.updateQualityDropdown();
                
                if (this.options.autoplay) {
                    this.videoElement.play().catch(e => console.log('Autoplay blocked'));
                }
            } else {
                this.error = 'HLS not supported in this browser';
                this.isLoading = false;
                this.updateLoadingState();
            }
        }
        
        // ... (rest of the methods are the same as in standalone-player.html)
        togglePlayPause() {
            if (this.isPlaying) {
                this.videoElement.pause();
            } else {
                this.videoElement.play();
            }
        }
        
        toggleMute() {
            this.videoElement.muted = !this.videoElement.muted;
        }
        
        toggleSubtitles() {
            this.subtitlesEnabled = !this.subtitlesEnabled;
            this.subtitlesBtn.classList.toggle('active', this.subtitlesEnabled);
            
            const textTracks = this.videoElement.textTracks;
            for (let i = 0; i < textTracks.length; i++) {
                textTracks[i].mode = this.subtitlesEnabled ? 'showing' : 'disabled';
            }
        }
        
        toggleFullscreen() {
            if (!document.fullscreenElement) {
                this.playerElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
        
        changeQuality(quality) {
            if (!this.hls) return;
            
            this.currentQuality = quality;
            
            if (quality === 'auto') {
                this.hls.currentLevel = -1;
            } else {
                const levelIndex = this.hls.levels.findIndex(level => `${level.height}p` === quality);
                if (levelIndex !== -1) {
                    this.hls.currentLevel = levelIndex;
                }
            }
            
            this.updateQualityDropdown();
            this.qualityDropdown.classList.remove('active');
        }
        
        showControlsTemporarily() {
            this.showControls = true;
            this.controlsElement.classList.add('active');
            
            if (this.controlsTimeout) {
                clearTimeout(this.controlsTimeout);
            }
            
            this.controlsTimeout = setTimeout(() => {
                if (this.isPlaying) {
                    this.hideControls();
                }
            }, 4000);
        }
        
        hideControls() {
            this.showControls = false;
            this.controlsElement.classList.remove('active');
            this.qualityDropdown.classList.remove('active');
            
            if (this.controlsTimeout) {
                clearTimeout(this.controlsTimeout);
            }
        }
        
        updatePlayButton() {
            const icon = this.isPlaying ? 
                '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' : 
                '<path d="M8 5v14l11-7z"/>';
            this.playPauseBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">${icon}</svg>`;
        }
        
        updateVolumeButton() {
            let icon;
            if (this.videoElement.muted || this.volume === 0) {
                icon = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
            } else {
                icon = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>';
            }
            this.volumeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">${icon}</svg>`;
            this.volumeSlider.value = this.videoElement.muted ? 0 : this.volume * 100;
        }
        
        updateProgress() {
            if (this.duration > 0) {
                const percentage = (this.currentTime / this.duration) * 100;
                this.progressBar.style.width = `${percentage}%`;
            }
        }
        
        updateTimeDisplay() {
            const formatTime = (time) => {
                const minutes = Math.floor(time / 60);
                const seconds = Math.floor(time % 60);
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            };
            
            this.timeDisplay.textContent = `${formatTime(this.currentTime)} / ${formatTime(this.duration)}`;
        }
        
        updateQualityDropdown() {
            const dropdownContent = this.qualityDropdown.querySelector('.dropdown-content');
            let html = '<div class="dropdown-header">Quality</div>';
            
            this.qualities.forEach(quality => {
                const isSelected = quality === this.currentQuality;
                html += `<div class="dropdown-item ${isSelected ? 'selected' : ''}" data-quality="${quality}">
                    ${quality === 'auto' ? 'Auto' : quality}
                    ${isSelected ? '<span>✓</span>' : ''}
                </div>`;
            });
            
            dropdownContent.innerHTML = html;
            
            // Add click handlers
            dropdownContent.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const quality = item.dataset.quality;
                    this.changeQuality(quality);
                });
            });
            
            // Show subtitles button if tracks available
            const hasSubtitles = this.videoElement.textTracks.length > 0 || 
                (this.hls && this.hls.subtitleTracks && this.hls.subtitleTracks.length > 0);
            this.subtitlesBtn.style.display = hasSubtitles ? 'flex' : 'none';
        }
        
        updateLoadingState() {
            if (this.isLoading) {
                this.loadingElement.style.display = 'block';
            } else if (this.error) {
                this.loadingElement.innerHTML = `
                    <div class="error-message">
                        <h3>Error loading video</h3>
                        <p>${this.error}</p>
                    </div>
                `;
            } else {
                this.loadingElement.style.display = 'none';
            }
        }
        
        // Public API methods
        play() {
            return this.videoElement.play();
        }
        
        pause() {
            this.videoElement.pause();
        }
        
        setSource(src) {
            this.loadVideo(src);
        }
        
        setVolume(volume) {
            this.videoElement.volume = Math.max(0, Math.min(1, volume));
        }
        
        seek(time) {
            this.videoElement.currentTime = time;
        }
        
        destroy() {
            if (this.hls) {
                this.hls.destroy();
            }
            if (this.controlsTimeout) {
                clearTimeout(this.controlsTimeout);
            }
            this.container.innerHTML = '';
        }
    }
    
    // Auto-initialize players from data attributes
    function initializePlayers() {
        const players = document.querySelectorAll('[data-burned-player]:not([data-initialized])');
        players.forEach(container => {
            const options = {
                src: container.dataset.src || '',
                autoplay: container.dataset.autoplay === 'true',
                controls: container.dataset.controls !== 'false',
                width: container.dataset.width || '100%',
                height: container.dataset.height || 'auto'
            };
            container.setAttribute('data-initialized', 'true');
            new BurnedPlayer(container, options);
        });
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePlayers);
    } else {
        initializePlayers();
    }
    
    // Global access
    window.BurnedPlayer = BurnedPlayer;
    
})();