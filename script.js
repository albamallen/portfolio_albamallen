document.addEventListener("DOMContentLoaded", () => {
    initCursor();
    initPageTransitions();
    loadData();
});

// ===================================
// 1. CURSOR PERSONALIZADO
// ===================================
function initCursor() {
    const dot = document.querySelector(".cursor-dot");
    const outline = document.querySelector(".cursor-outline");

    if (!dot || !outline) return;

    window.addEventListener("mousemove", (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        dot.style.left = `${posX}px`;
        dot.style.top = `${posY}px`;

        outline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 500, fill: "forwards" });
    });

    const hoverTargets = document.querySelectorAll("a, .carousel-panel, .nav-link, .gallery-card, .collection-item, .project-floating-btn");

    hoverTargets.forEach(el => {
        el.addEventListener("mouseenter", () => document.body.classList.add("hovering"));
        el.addEventListener("mouseleave", () => document.body.classList.remove("hovering"));
    });
}

// ===================================
// 2. TRANSICIONES ENTRE PÁGINAS (SPA FEEL)
// ===================================
function initPageTransitions() {
    const overlay = document.querySelector(".page-transition-overlay");
    if (!overlay) return;

    // A) ENTRADA
    gsap.fromTo(overlay,
        { y: "0%" },
        { y: "-100%", duration: 1, ease: "power4.inOut", delay: 0.1 }
    );

    // B) SALIDA
    const links = document.querySelectorAll("a");
    links.forEach(link => {
        const href = link.getAttribute("href");
        if (!href || href.startsWith("#") || href.includes("javascript") || href.includes("mailto")) return;

        link.addEventListener("click", (e) => {
            // Si tiene target="_blank", dejamos que el navegador actúe normal
            if (link.target === "_blank") return;

            e.preventDefault();
            gsap.to(overlay, {
                y: "0%",
                duration: 0.8,
                ease: "power4.inOut",
                onComplete: () => {
                    window.location.href = href;
                }
            });
        });
    });
}

// ===================================
// 3. CARGA DE DATOS (ROUTING)
// ===================================
async function loadData() {
    try {
        const response = await fetch("data.json");
        const data = await response.json();
        
        // Detectar en qué página estamos
        const page = document.body.dataset.page;

        if (page === "home") {
            initCarousel(data.projects);
        } else if (page === "gallery") {
            initGallery(data.collections);
        } else if (page === "project") {
            if (typeof renderProjectPro === "function") {
                renderProjectPro(data.projects);
            }
        } else if (page === "about") {
            initAbout(data.aboutPage);
        }

    } catch (error) {
        console.error("Error cargando data.json:", error);
    }
}

// ===================================
// 4. HOME: CARRUSEL (MOTOR DE FÍSICA)
// ===================================
function initCarousel(projects) {
    const track = document.getElementById("carousel-track");
    if (!track) return;

    const isMobile = window.innerWidth < 768;
    const total = projects.length;
    const radius = isMobile ? 320 : 650;
    const angleStep = 360 / total;

    let currentRotation = 0;
    let speed = 0;
    const baseSpeed = isMobile ? 0.05 : 0.08;
    let isDragging = false;
    let isHovering = false;
    let startX = 0;
    let lastX = 0;

    gsap.ticker.add(() => {
        if (isDragging) {
            // Velocidad controlada por evento
        } else if (isHovering) {
            speed *= 0.9; // Frenado
        } else {
            speed *= 0.95; // Fricción
            if (Math.abs(speed) < baseSpeed) {
                speed += (baseSpeed - speed) * 0.05; // Recuperar crucero
            }
        }
        currentRotation += speed;
        gsap.set(track, { rotationY: currentRotation });
    });

    let wheelTimeout;
    window.addEventListener("wheel", (e) => {
        if (isMobile) return;
        isDragging = true;
        speed -= e.deltaY * 0.002;
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => { isDragging = false; }, 100);
    }, { passive: true });

    window.addEventListener("touchstart", (e) => {
        isDragging = true;
        startX = e.touches[0].clientX;
        lastX = startX;
        speed = 0;
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
        const currentX = e.touches[0].clientX;
        const diff = currentX - lastX;
        speed = diff * 0.2;
        lastX = currentX;
    }, { passive: true });

    window.addEventListener("touchend", () => { isDragging = false; });

    projects.forEach((project, i) => {
        const panel = document.createElement("div");
        panel.classList.add("carousel-panel");

        panel.onclick = (e) => {
            if (Math.abs(speed) > 1) return; // Evitar click si se está arrastrando rápido
            e.stopPropagation();
            const overlay = document.querySelector(".page-transition-overlay");
            gsap.to(overlay, {
                y: "0%", duration: 0.6, ease: "power3.inOut",
                onComplete: () => window.location.href = `project.html?id=${project.id}`
            });
        };

        if (!isMobile) {
            panel.addEventListener("mouseenter", () => {
                isHovering = true;
                document.body.classList.add("hovering");
                gsap.to(panel, { scale: 1.1, zIndex: 100, border: "1px solid white", duration: 0.3 });
            });
            panel.addEventListener("mouseleave", () => {
                isHovering = false;
                document.body.classList.remove("hovering");
                gsap.to(panel, { scale: 1, zIndex: 1, border: "none", duration: 0.3 });
            });
        }

        const isVideo = project.image.toLowerCase().endsWith(".mp4") || project.image.toLowerCase().endsWith(".webm");
        const mediaHTML = isVideo 
            ? `<video src="${project.image}" autoplay loop muted playsinline></video>`
            : `<img src="${project.image}" alt="${project.title}">`;

        panel.innerHTML = `
            ${mediaHTML}
            <div class="panel-info">
                <div class="panel-title">${project.title}</div>
            </div>
        `;

        const angle = angleStep * i;
        gsap.set(panel, {
            rotationY: angle,
            z: radius,
            transformOrigin: `50% 50% ${-radius}px`
        });

        track.appendChild(panel);
    });
}

// ===================================
// 5. GALLERY: TRAIL & STREAM (FORMATO ORIGINAL)
// ===================================
function initGallery(collections) {
    const listContainer = document.getElementById("collections-list");
    const trailContainer = document.getElementById("trail-container");
    const streamView = document.getElementById("stream-view");
    const streamTrack = document.getElementById("stream-track");
    const closeBtn = document.getElementById("close-collection");

    if (!listContainer || !collections) return;

    let activeCollection = null;
    let lastX = 0;
    let lastY = 0;
    let imageIndex = 0;
    let zIndexCounter = 1;

    // A) RENDERIZAR LISTA
    listContainer.innerHTML = "";
    collections.forEach((col) => {
        const item = document.createElement("div");
        item.className = "collection-item";
        item.innerHTML = `
            ${col.title}
            <span class="collection-meta">${col.year} — ${col.images.length} fotos</span>
        `;
        
        item.addEventListener("mouseenter", () => { activeCollection = col; imageIndex = 0; });
        item.addEventListener("mouseleave", () => { activeCollection = null; });
        item.addEventListener("click", () => openCollection(col));
        
        listContainer.appendChild(item);
    });

    // B) RASTRO (TRAIL)
    window.addEventListener("mousemove", (e) => {
        if (!activeCollection) return;
        const distance = Math.hypot(e.clientX - lastX, e.clientY - lastY);
        
        if (distance > 50) {
            createTrailImage(e.clientX, e.clientY);
            lastX = e.clientX;
            lastY = e.clientY;
        }
    });

    function createTrailImage(x, y) {
        if (!activeCollection) return;
        const src = activeCollection.images[imageIndex % activeCollection.images.length];
        imageIndex++;

        const img = document.createElement("img");
        img.src = src;
        img.className = "trail-img";
        img.style.left = `${x}px`;
        img.style.top = `${y}px`;
        img.style.zIndex = zIndexCounter++;
        
        const rotation = (Math.random() - 0.5) * 30; 
        trailContainer.appendChild(img);

        gsap.timeline({
            onComplete: () => { if(img.parentNode) img.parentNode.removeChild(img); }
        })
        .fromTo(img, 
            { scale: 0.4, opacity: 0, rotation: rotation }, 
            { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" }
        )
        .to(img, { scale: 0.8, opacity: 0, duration: 0.5, delay: 0.1, ease: "power2.out" });
    }

    // VARIABLES STREAM
    let streamAnim;
    let currentX = 0;
    let scrollVelocity = 0;

    // C) ABRIR COLECCIÓN
    function openCollection(col) {
        gsap.to(listContainer, { autoAlpha: 0, duration: 0.5 });
        trailContainer.innerHTML = ""; 
        activeCollection = null;

        const infoBox = document.getElementById("stream-info");
        document.getElementById("s-title").textContent = col.title;
        document.getElementById("s-year").textContent = col.year;
        
        // Animamos a y:0 para que suba suavemente
        gsap.to(infoBox, { opacity: 1, y: 0, duration: 1, delay: 0.5, ease: "power3.out" });

        gsap.set(streamView, { visibility: "visible" });
        gsap.to(streamView, { opacity: 1, duration: 0.5, delay: 0.3 });
        gsap.to(closeBtn, { opacity: 1, pointerEvents: "auto", delay: 1 });

        // Generar imágenes (x4 para loop seguro)
        const allImages = [...col.images, ...col.images, ...col.images, ...col.images];
        streamTrack.innerHTML = "";
        
        allImages.forEach((src) => {
            const div = document.createElement("div");
            div.className = "stream-item";
            
            // --- CAMBIO IMPORTANTE: SOLO ANCHO ALEATORIO ---
            // Ya no calculamos height ni ratios. Dejamos que la imagen mande.
            
            // Ancho aleatorio entre 25vw y 45vw para escritorio
            const randomWidth = Math.floor(Math.random() * (45 - 25 + 1) + 25);
            
            // Desplazamiento vertical aleatorio (Caos)
            const randomY = Math.floor(Math.random() * 60) - 30; 
            
            // Margen derecho aleatorio
            const randomMargin = Math.floor(Math.random() * (150 - 50 + 1) + 50);

            // Aplicamos estilos
            div.style.width = `${randomWidth}vw`;
            // NO PONEMOS HEIGHT. La altura será automática según la imagen.
            
            div.style.transform = `translateY(${randomY}px)`;
            div.style.marginRight = `${randomMargin}px`;

            if (src.endsWith(".mp4")) {
                div.innerHTML = `<video src="${src}" autoplay loop muted playsinline></video>`;
            } else {
                div.innerHTML = `<img src="${src}">`;
            }
            streamTrack.appendChild(div);
        });

        startStreamLoop();
    }

    // D) CERRAR COLECCIÓN
    closeBtn.addEventListener("click", () => {
        if (streamAnim) gsap.ticker.remove(streamAnim); 
        
        // El texto baja al desaparecer
        gsap.to(document.getElementById("stream-info"), { opacity: 0, y: 20, duration: 0.5 });

        gsap.to(streamView, { opacity: 0, duration: 0.5, onComplete: () => {
            gsap.set(streamView, { visibility: "hidden" });
            streamTrack.innerHTML = ""; 
        }});
        
        gsap.to(closeBtn, { opacity: 0, pointerEvents: "none" });
        gsap.to(listContainer, { autoAlpha: 1, duration: 0.5, delay: 0.3 });
    });

    // E) SCROLL INFINITO
    function startStreamLoop() {
        let speed = -1; 
        scrollVelocity = 0;
        currentX = 0; 

        streamAnim = () => {
            scrollVelocity *= 0.95;
            currentX += speed + scrollVelocity;

            const firstItem = streamTrack.children[0];
            if (!firstItem) return;

            const style = window.getComputedStyle(firstItem);
            const marginRight = parseFloat(style.marginRight);
            const width = firstItem.offsetWidth;
            
            // Estimación aproximada para el reset
            const totalSetWidth = streamTrack.scrollWidth / 4;

            if (currentX < -totalSetWidth) currentX += totalSetWidth;
            else if (currentX > 0) currentX -= totalSetWidth;

            gsap.set(streamTrack, { x: currentX });
        };

        gsap.ticker.add(streamAnim);

        window.addEventListener("wheel", (e) => {
            if (streamView.style.visibility === "visible") {
                scrollVelocity -= e.deltaY * 0.5;
                if (e.deltaX !== 0) scrollVelocity -= e.deltaX * 0.5;
            }
        });
        
        let lastTouch = 0;
        window.addEventListener("touchstart", (e) => lastTouch = e.touches[0].clientX);
        window.addEventListener("touchmove", (e) => {
            if (streamView.style.visibility === "visible") {
                const current = e.touches[0].clientX;
                scrollVelocity += (current - lastTouch) * 0.5;
                lastTouch = current;
            }
        });
    }
}

// ===================================
// 7. PÁGINA ABOUT (ABSTRACT & FLUID)
// ===================================
function initAbout(data) {
    if (!data) return;

    const container = document.querySelector(".about-container") || document.querySelector("main");
    if (!container) return;

    let timelineHTML = "";
    if (data.timeline) {
        data.timeline.forEach(item => {
            timelineHTML += `
                <div class="timeline-item anim-up">
                    <span class="t-year">${item.year}</span>
                    <span class="t-role">${item.role}</span>
                    <span class="t-place">${item.place}</span>
                </div>
            `;
        });
    }

    const skillsText = data.skills.join(" — ") + " — " + data.skills.join(" — ");

    container.innerHTML = `
        <section class="about-hero">
            <h1 class="about-title-large reveal-text">
                Digital <br> Designer & <br> Developer
            </h1>
            <img src="${data.image}" class="about-floating-img" alt="Alba Mallén">
            <div class="about-bio-block">
                ${data.bio.map(p => `<p class="about-bio-text anim-up">${p}</p>`).join("")}
            </div>
        </section>

        <section class="about-timeline-section">
            <h3 style="margin-bottom:40px; text-transform:uppercase; color:#999; font-size:0.8rem;">Trayectoria</h3>
            <div class="timeline-list">
                ${timelineHTML}
            </div>
        </section>

        <section class="skills-marquee-wrapper">
            <div class="skills-track">
                ${skillsText} — ${skillsText}
            </div>
        </section>

        <section class="about-contact">
            <p style="text-transform:uppercase; margin-bottom:20px; color:#888;">¿Hablamos?</p>
            <a href="mailto:${data.contact.email}" class="contact-link">${data.contact.email}</a>
            <a href="tel:${data.contact.phone.replace(/\s/g, '')}" style="font-size:1rem; color:#666;">${data.contact.phone}</a>
        </section>
    `;

    // ANIMACIONES GSAP
    gsap.from(".about-title-large", {
        y: 100, opacity: 0, duration: 1.5, ease: "power4.out", delay: 0.2
    });

    gsap.fromTo(".about-floating-img",
        { rotation: 5, y: 50, opacity: 0 },
        { rotation: -5, y: -50, opacity: 1, duration: 1.5, ease: "power3.out", delay: 0.5 }
    );

    gsap.to(".about-floating-img", {
        yPercent: 30, ease: "none",
        scrollTrigger: {
            trigger: ".about-hero", start: "top top", end: "bottom top", scrub: true
        }
    });

    const elements = document.querySelectorAll(".anim-up");
    elements.forEach(el => {
        gsap.from(el, {
            y: 50, opacity: 0, duration: 1, ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 90%" }
        });
    });

    gsap.to(".skills-track", {
        xPercent: -50, ease: "none", duration: 20, repeat: -1
    });

    gsap.to("body", {
        backgroundColor: "#1a1a1a", color: "#f2f2f2",
        scrollTrigger: {
            trigger: ".skills-marquee-wrapper",
            start: "top center", end: "bottom center",
            toggleActions: "play reverse play reverse"
        }
    });
}