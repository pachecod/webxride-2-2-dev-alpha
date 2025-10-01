// Scroll-based Storytelling Template
class StoryTemplate {
    constructor() {
        this.init();
    }

    init() {
        this.setupParallax();
        this.setupScrollAnimations();
        this.setupGifPlayback();
        this.setupSmoothScrolling();
        this.setupIntersectionObserver();
    }

    // Parallax effect for background elements
    setupParallax() {
        const parallaxElements = document.querySelectorAll('[data-speed]');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            
            parallaxElements.forEach(element => {
                const speed = parseFloat(element.getAttribute('data-speed'));
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
        });
    }

    // Scroll-triggered animations for info cards and other elements
    setupScrollAnimations() {
        const animatedElements = document.querySelectorAll('[data-scroll]');
        
        const animateOnScroll = () => {
            animatedElements.forEach(element => {
                const elementTop = element.getBoundingClientRect().top;
                const elementVisible = 150;
                
                if (elementTop < window.innerHeight - elementVisible) {
                    const animationType = element.getAttribute('data-scroll');
                    const delay = element.getAttribute('data-delay') || 0;
                    
                    setTimeout(() => {
                        this.triggerAnimation(element, animationType);
                    }, delay);
                }
            });
        };

        window.addEventListener('scroll', animateOnScroll);
        animateOnScroll(); // Run once on load
    }

    // Trigger specific animations based on data-scroll attribute
    triggerAnimation(element, animationType) {
        switch (animationType) {
            case 'fade-in':
                element.classList.add('visible');
                break;
            case 'slide-up':
                element.style.transform = 'translateY(0)';
                element.style.opacity = '1';
                break;
            case 'play-gif':
                element.classList.add('visible');
                break;
            default:
                element.classList.add('visible');
        }
    }

    // VR, GIF, Immersive, and WebXR embed playback control - play when in viewport
    setupGifPlayback() {
        const gifSections = document.querySelectorAll('.gif-section');
        const vrSections = document.querySelectorAll('.vr-section');
        const immersiveSections = document.querySelectorAll('.immersive-section');
        const webxrEmbedSections = document.querySelectorAll('.webxr-embed-section');
        
        const playMediaOnScroll = () => {
            // Handle GIF sections
            gifSections.forEach(section => {
                const rect = section.getBoundingClientRect();
                const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
                
                if (isInViewport && !section.classList.contains('visible')) {
                    section.classList.add('visible');
                    
                    // Optional: Restart GIF animation
                    const gif = section.querySelector('.story-gif');
                    if (gif) {
                        const gifSrc = gif.src;
                        gif.src = '';
                        setTimeout(() => {
                            gif.src = gifSrc;
                        }, 100);
                    }
                }
            });

            // Handle VR sections
            vrSections.forEach(section => {
                const rect = section.getBoundingClientRect();
                const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
                
                if (isInViewport && !section.classList.contains('visible')) {
                    section.classList.add('visible');
                }
            });

            // Handle Immersive sections
            immersiveSections.forEach(section => {
                const rect = section.getBoundingClientRect();
                const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
                
                if (isInViewport && !section.classList.contains('visible')) {
                    section.classList.add('visible');
                }
            });

            // Handle WebXR embed sections
            webxrEmbedSections.forEach(section => {
                const rect = section.getBoundingClientRect();
                const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
                
                if (isInViewport && !section.classList.contains('visible')) {
                    section.classList.add('visible');
                }
            });
        };

        window.addEventListener('scroll', playMediaOnScroll);
        playMediaOnScroll(); // Run once on load
    }

    // Smooth scrolling for navigation links
    setupSmoothScrolling() {
        const navLinks = document.querySelectorAll('.nav-links a');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Intersection Observer for better performance
    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const animationType = element.getAttribute('data-scroll');
                    
                    if (animationType) {
                        const delay = element.getAttribute('data-delay') || 0;
                        setTimeout(() => {
                            this.triggerAnimation(element, animationType);
                        }, delay);
                    }
                }
            });
        }, observerOptions);

        // Observe all elements with data-scroll attribute
        const scrollElements = document.querySelectorAll('[data-scroll]');
        scrollElements.forEach(element => {
            observer.observe(element);
        });
    }
}

// Performance optimization: Throttle scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Enhanced parallax with throttling
class EnhancedParallax {
    constructor() {
        this.parallaxElements = document.querySelectorAll('[data-speed]');
        this.setupThrottledParallax();
    }

    setupThrottledParallax() {
        const throttledParallax = throttle(() => {
            const scrolled = window.pageYOffset;
            
            this.parallaxElements.forEach(element => {
                const speed = parseFloat(element.getAttribute('data-speed'));
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
        }, 16); // ~60fps

        window.addEventListener('scroll', throttledParallax);
    }
}

// Progress indicator
class ScrollProgress {
    constructor() {
        this.createProgressBar();
        this.updateProgress();
    }

    createProgressBar() {
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 3px;
            background: linear-gradient(90deg, #667eea, #764ba2);
            z-index: 1001;
            transition: width 0.1s ease;
        `;
        document.body.appendChild(progressBar);
    }

    updateProgress() {
        const progressBar = document.querySelector('.scroll-progress');
        
        window.addEventListener('scroll', throttle(() => {
            const scrollTop = window.pageYOffset;
            const docHeight = document.body.offsetHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            
            progressBar.style.width = scrollPercent + '%';
        }, 16));
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StoryTemplate();
    new EnhancedParallax();
    new ScrollProgress();
    
    // Add some interactive features
    addInteractiveFeatures();
});

// Additional interactive features
function addInteractiveFeatures() {
    // Hover effects for info cards
    const infoCards = document.querySelectorAll('.info-card');
    infoCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Click to replay GIFs
    const gifSections = document.querySelectorAll('.gif-section');
    gifSections.forEach(section => {
        section.addEventListener('click', () => {
            const gif = section.querySelector('.story-gif');
            if (gif) {
                const gifSrc = gif.src;
                gif.src = '';
                setTimeout(() => {
                    gif.src = gifSrc;
                }, 100);
            }
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === ' ') {
            e.preventDefault();
            window.scrollBy({
                top: window.innerHeight,
                behavior: 'smooth'
            });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            window.scrollBy({
                top: -window.innerHeight,
                behavior: 'smooth'
            });
        }
    });
}

// Utility function for smooth animations
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

// Preload images for better performance
function preloadImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (img.src) {
            const preloadImg = new Image();
            preloadImg.src = img.src;
        }
    });
}

// Initialize preloading
window.addEventListener('load', preloadImages);

// Fullscreen experience function
function openFullscreen(url, title) {
    // Create a new window with the experience
    const width = window.screen.width * 0.9;
    const height = window.screen.height * 0.9;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const newWindow = window.open(
        url,
        title,
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no`
    );
    
    // Focus the new window
    if (newWindow) {
        newWindow.focus();
    }
}

// Fullscreen mode function (similar to the lower right button)
function enterFullscreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

// Open experience in fullscreen mode
function openExperienceFullscreen(url, title) {
    // Create a container for the iframe and close button
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 9999;
        background: #000;
    `;
    
    // Create a temporary iframe to enter fullscreen
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        position: absolute;
        top: 0;
        left: 0;
    `;
    iframe.title = title;
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: 2px solid white;
        border-radius: 50%;
        font-size: 24px;
        font-weight: bold;
        cursor: pointer;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    `;
    
    // Add hover effects
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = 'rgba(255, 0, 0, 0.8)';
        closeButton.style.transform = 'scale(1.1)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.background = 'rgba(0, 0, 0, 0.7)';
        closeButton.style.transform = 'scale(1)';
    });
    
    // Close functionality
    const closeExperience = () => {
        if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
        document.body.removeChild(container);
    };
    
    closeButton.addEventListener('click', closeExperience);
    
    // Add escape key functionality
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeExperience();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Add A-Frame Inspector button if the content is A-Frame
    const addAframeInspectorButton = () => {
        try {
            // Check if iframe is accessible and contains A-Frame content
            if (iframe.contentDocument && iframe.contentWindow) {
                const hasAframeScript = iframe.contentDocument.querySelector('script[src*="aframe"]');
                const hasAframeScene = iframe.contentDocument.querySelector('a-scene');
                
                if (hasAframeScript || hasAframeScene) {
                    // Create inspector button
                    const inspectorButton = document.createElement('button');
                    inspectorButton.innerHTML = '⚙️';
                    inspectorButton.style.cssText = `
                        position: absolute;
                        top: 20px;
                        right: 80px;
                        width: 50px;
                        height: 50px;
                        background: rgba(0, 0, 0, 0.7);
                        color: white;
                        border: 2px solid white;
                        border-radius: 50%;
                        font-size: 20px;
                        font-weight: bold;
                        cursor: pointer;
                        z-index: 10000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s ease;
                    `;
                    
                    // Add hover effects
                    inspectorButton.addEventListener('mouseenter', () => {
                        inspectorButton.style.background = 'rgba(59, 130, 246, 0.8)';
                        inspectorButton.style.transform = 'scale(1.1)';
                    });
                    
                    inspectorButton.addEventListener('mouseleave', () => {
                        inspectorButton.style.background = 'rgba(0, 0, 0, 0.7)';
                        inspectorButton.style.transform = 'scale(1)';
                    });
                    
                    // Inspector functionality
                    inspectorButton.addEventListener('click', () => {
                        try {
                            const iframeWindow = iframe.contentWindow;
                            const iframeDocument = iframe.contentDocument;
                            
                            // Try multiple methods to open inspector
                            if (iframeWindow && iframeWindow.AFRAME && iframeWindow.AFRAME.inspector) {
                                iframeWindow.AFRAME.inspector.open();
                                return;
                            }
                            
                            if (iframeDocument) {
                                const scene = iframeDocument.querySelector('a-scene');
                                if (scene && scene.inspector) {
                                    scene.inspector.open();
                                    return;
                                }
                                
                                // Try keyboard shortcut simulation
                                const keyEvent = new KeyboardEvent('keydown', {
                                    key: 'i',
                                    code: 'KeyI',
                                    ctrlKey: true,
                                    altKey: true,
                                    bubbles: true,
                                    cancelable: true
                                });
                                iframeDocument.dispatchEvent(keyEvent);
                            }
                        } catch (error) {
                            console.error('Failed to open A-Frame Inspector:', error);
                            alert('A-Frame Inspector could not be opened. Please try Ctrl+Alt+I (or Cmd+Option+I on Mac) directly in the experience.');
                        }
                    });
                    
                    container.appendChild(inspectorButton);
                }
            }
        } catch (error) {
            console.log('Could not add A-Frame inspector button:', error);
        }
    };
    
    // Add to container and body
    container.appendChild(iframe);
    container.appendChild(closeButton);
    document.body.appendChild(container);
    
    // Try to add inspector button after iframe loads
    iframe.addEventListener('load', () => {
        setTimeout(addAframeInspectorButton, 1000); // Give A-Frame time to load
    });
    
    // Enter fullscreen
    enterFullscreen(container);
    
    // Add fullscreen change handler
    const handleFullscreenChange = () => {
        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
            document.body.removeChild(container);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
}

// Open Luma AI Gaussian Splat experience
function openLumaExperience() {
    const lumaUrl = 'https://lumalabs.ai/capture/83a259bc-4827-4d40-868b-1065bc6e640c';
    
    // Open directly in new window
    openFullscreen(lumaUrl, 'Luma AI Gaussian Splat');
} 