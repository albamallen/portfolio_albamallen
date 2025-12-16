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

    // Si por lo que sea no existen en el HTML (ej: error carga), salimos
    if (!dot || !outline) return;

    window.addEventListener("mousemove", (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        // El punto va directo
        dot.style.left = `${posX}px`;
        dot.style.top = `${posY}px`;

        // El círculo tiene "delay" (animación)
        outline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 500, fill: "forwards" });
    });

    // Detectar elementos interactivos para cambiar el cursor
    // Incluimos enlaces, botones y tarjetas
    const hoverTargets = document.querySelectorAll("a, .carousel-panel, .nav-link, .gallery-card");
    
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

    // A) ENTRADA: Al cargar, el telón se quita (sube)
    gsap.fromTo(overlay, 
        { y: "0%" }, 
        { y: "-100%", duration: 1, ease: "power4.inOut", delay: 0.1 }
    );

    // B) SALIDA: Interceptar clicks en enlaces para poner el telón antes de irse
    const links = document.querySelectorAll("a");
    links.forEach(link => {
        const href = link.getAttribute("href");

        // Ignorar anclas vacías o links externos (si los hubiera)
        if (!href || href.startsWith("#") || href.includes("javascript")) return;

        link.addEventListener("click", (e) => {
            e.preventDefault(); // Parar navegación estándar

            // Bajar el telón
            gsap.to(overlay, { 
                y: "0%", 
                duration: 0.8, 
                ease: "power4.inOut",
                onComplete: () => {
                    window.location.href = href; // Cambiar página al terminar
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
        // --- ESTAS LÍNEAS SON OBLIGATORIAS PARA QUE EXISTA 'data' ---
        const response = await fetch("data.json");
        const data = await response.json();
        // -------------------------------------------------------------

        const page = document.body.dataset.page;

        if (page === "home") {
            initCarousel(data.projects);
        } else if (page === "gallery") {
            initGallery(data.galleryImages);
        } else if (page === "project") {
            // Aquí comprobamos si cargaste el archivo nuevo project-logic.js
            if (typeof renderProjectPro === "function") {
                renderProjectPro(data.projects);
            } else {
                console.error("Error: No se encuentra la función renderProjectPro. ¿Has enlazado project-logic.js en el HTML?");
            }
        } else if (page === "about") {
            initAbout(data.aboutPage);
        }

    } catch (error) {
        console.error("Error cargando data.json:", error);
    }
}
// ===================================
// 4. HOME: CARRUSEL (CORREGIDO SUPERPOSICIÓN)
// ===================================
// ===================================
// 4. HOME: CARRUSEL (MOTOR DE FÍSICA PURA - FLUIDEZ TOTAL)
// ===================================
function initCarousel(projects) {
    const track = document.getElementById("carousel-track");
    if (!track) return;

    // --- DETECCIÓN MÓVIL Y RADIO ---
    const isMobile = window.innerWidth < 768;
    const total = projects.length;
    
    let radius;
    if (isMobile) {
        radius = 320; 
    } else {
        radius = 650; 
    }

    const angleStep = 360 / total;

    // --- VARIABLES DE FÍSICA (LA CLAVE) ---
    // Posición actual
    let currentRotation = 0;
    
    // Velocidad actual (grados por frame)
    let speed = 0; 
    
    // Velocidad crucero (lo que gira solo)
    const baseSpeed = isMobile ? 0.05 : 0.08; 
    
    // Estados
    let isDragging = false;
    let isHovering = false;
    
    // Variables para Touch
    let startX = 0;
    let lastX = 0;

    // --- 1. MOTOR PRINCIPAL (TICKER) ---
    // Se ejecuta 60 veces por segundo. Gestiona TODO el movimiento.
    gsap.ticker.add(() => {
        // A) SI ESTAMOS ARRASTRANDO (Touch/Scroll activo)
        // No aplicamos fricción ni auto-giro, la velocidad la define tu mano.
        if (isDragging) {
            // La velocidad ya se calculó en los eventos touch/wheel
        } 
        // B) SI ESTAMOS EN HOVER (Parada suave)
        else if (isHovering) {
            // Fricción fuerte para frenar (0.9 = frena rápido)
            speed *= 0.9;
        }
        // C) SI ESTÁ LIBRE (Inercia natural)
        else {
            // 1. Aplicamos fricción natural (0.95 = se desliza mucho)
            speed *= 0.95;

            // 2. Recuperación de velocidad base (Auto-giro)
            // Si la velocidad baja de la base, la empujamos suavemente hacia arriba
            if (Math.abs(speed) < baseSpeed) {
                // Lerp suave hacia baseSpeed
                speed += (baseSpeed - speed) * 0.05;
            }
        }

        // Aplicar la velocidad calculada a la rotación
        currentRotation += speed;
        gsap.set(track, { rotationY: currentRotation });
    });


    // --- 2. CONTROL RUEDA (SCROLL) ---
    let wheelTimeout;
    
    window.addEventListener("wheel", (e) => {
        if (isMobile) return;
        
        // Al mover la rueda, estamos "arrastrando" conceptualmente
        isDragging = true;

        // ACUMULAMOS VELOCIDAD (EMPUJÓN)
        // Cuanto más rápido scrolleas, más se suma.
        // El -0.05 es la sensibilidad (ajustar si va muy rápido)
        speed -= e.deltaY * 0.002;

        // Detectar cuándo paramos de scrollear
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
            isDragging = false; // Soltamos la rueda -> entra la inercia del Ticker
        }, 100);
    }, { passive: true });


    // --- 3. CONTROL TOUCH (MÓVIL) ---
    window.addEventListener("touchstart", (e) => {
        isDragging = true;
        startX = e.touches[0].clientX;
        lastX = startX;
        speed = 0; // Reseteamos inercia al tocar para tener control total
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
        const currentX = e.touches[0].clientX;
        const diff = currentX - lastX;
        
        // Convertimos el movimiento del dedo en velocidad directa
        // Multiplicador 0.2 para que siga al dedo 1:1 aprox
        speed = diff * 0.2;
        
        lastX = currentX;
    }, { passive: true });

    window.addEventListener("touchend", () => {
        isDragging = false; 
        // Al soltar, el 'speed' lleva la velocidad del último movimiento (lanzamiento)
        // El Ticker se encargará de frenarlo suavemente con la fricción (0.95)
    });


    // --- 4. GENERAR PANELES ---
    projects.forEach((project, i) => {
        const panel = document.createElement("div");
        panel.classList.add("carousel-panel");

        // Click -> Ir a proyecto
        panel.onclick = (e) => {
            // Pequeño hack: Si hemos arrastrado mucho, no es click, es drag.
            // Pero para simplificar, permitimos click siempre que no estemos moviendo rápido
            if (Math.abs(speed) > 1) return; // Si gira rápido, no clicka (evita clicks falsos al lanzar)

            e.stopPropagation();
            const overlay = document.querySelector(".page-transition-overlay");
            gsap.to(overlay, { 
                y: "0%", duration: 0.6, ease: "power3.inOut",
                onComplete: () => window.location.href = `project.html?id=${project.id}`
            });
        };

        // Hover (Solo Desktop)
        if (!isMobile) {
            panel.addEventListener("mouseenter", () => {
                isHovering = true; // El Ticker leerá esto y frenará
                document.body.classList.add("hovering");
                gsap.to(panel, { scale: 1.1, zIndex: 100, border: "1px solid white", duration: 0.3 });
            });
            panel.addEventListener("mouseleave", () => {
                isHovering = false; // El Ticker volverá a acelerar
                document.body.classList.remove("hovering");
                gsap.to(panel, { scale: 1, zIndex: 1, border: "none", duration: 0.3 });
            });
        }

        // Video vs Foto
        const isVideo = project.image.toLowerCase().endsWith(".mp4") || 
                        project.image.toLowerCase().endsWith(".webm");
        let mediaHTML = "";

        if (isVideo) {
            mediaHTML = `
                <video src="${project.image}" autoplay loop muted playsinline>
                </video>
            `;
        } else {
            mediaHTML = `<img src="${project.image}" alt="${project.title}">`;
        }

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
// 5. GALLERY: ORGANIC CHAOS (RESPONSIVE)
// ===================================
function initGallery(images) {
    const viewport = document.getElementById("gallery-viewport");
    if (!viewport) return;

    viewport.innerHTML = ""; // Limpiar

    // --- DETECCIÓN MÓVIL ---
    const isMobile = window.innerWidth < 768;

    // --- CONFIGURACIÓN RESPONSIVE ---
    // Escritorio: 6 columnas (denso). Móvil: 2 columnas (grande).
    const columns = isMobile ? 2 : 6; 
    
    // Multiplicamos imágenes. En móvil necesitamos menos copias porque son más grandes,
    // pero mantenemos x4 para asegurar el scroll infinito suave.
    const allImages = [...images, ...images, ...images, ...images]; 
    
    const cellWidth = window.innerWidth / columns;
    const cellHeight = cellWidth * (isMobile ? 1.2 : 0.8); // En móvil las hacemos más verticales

    // Velocidades Base
    let speedX = isMobile ? 0.2 : 0.4; // Un poco más lento en móvil para apreciar las fotos
    let speedY = isMobile ? 0.2 : 0.3;
    
    // Variables de Turbo (Scroll/Touch)
    let scrollVelocityX = 0;
    let scrollVelocityY = 0;

    const items = [];

    // --- CREACIÓN Y POSICIONAMIENTO ---
    allImages.forEach((src, i) => {
        const card = document.createElement("div");
        card.className = "gallery-card";

        // 1. TAMAÑO ALEATORIO
        // En móvil variamos menos el tamaño para evitar huecos feos
        const scaleBase = isMobile ? 0.9 : 0.9;
        const scaleVar = isMobile ? 0.2 : 0.5; // Menos variación en móvil
        
        const scale = Math.random() * scaleVar + scaleBase; 
        
        const w = cellWidth * scale;
        // Altura aleatoria
        const h = (cellHeight * scale) * (Math.random() * 0.3 + 0.8);

        card.style.width = `${w}px`;
        card.style.height = `${h}px`;

        card.innerHTML = `
            <img src="${src}" loading="lazy">
            <div class="gallery-caption">Foto ${(i % 9) + 1}</div>
        `;

        // 2. CÁLCULO DE POSICIÓN (Masonry / Ladrillo)
        const colIndex = i % columns;
        const rowIndex = Math.floor(i / columns);

        let startX = colIndex * cellWidth;
        let startY = rowIndex * cellHeight;

        // Desplazamiento columnas impares (Efecto Ladrillo)
        if (colIndex % 2 !== 0) {
            startY += cellHeight * 0.5;
        }

        // 3. CAOS (JITTER)
        // En móvil reducimos el caos a la mitad (0.2) para que no se monten tanto
        const chaosFactor = isMobile ? 0.2 : 0.4;
        
        const jitterX = (Math.random() - 0.5) * (cellWidth * chaosFactor);
        const jitterY = (Math.random() - 0.5) * (cellHeight * chaosFactor);

        const itemObj = {
            element: card,
            x: startX + jitterX,
            y: startY + jitterY,
            width: w,
            height: h,
            // Profundidad Parallax (velocidad variable)
            parallaxSpeed: Math.random() * 0.2 + 0.9 
        };

        items.push(itemObj);
        viewport.appendChild(card);
        
        // Efecto Hover solo en Desktop (en móvil el tap hace cosas nativas)
        if (!isMobile) {
            card.addEventListener("mouseenter", () => document.body.classList.add("hovering"));
            card.addEventListener("mouseleave", () => document.body.classList.remove("hovering"));
        }
    });

    // Límites para el Wrapping (Teletransporte)
    const totalRows = Math.ceil(allImages.length / columns);
    const wrapHeight = totalRows * cellHeight;
    const wrapWidth = window.innerWidth + (isMobile ? 50 : 200);

    // --- MOTOR MOVIMIENTO ---
    gsap.ticker.add(() => {
        // Fricción (Qué tan rápido se detiene el turbo)
        scrollVelocityX *= 0.95;
        scrollVelocityY *= 0.95;

        const currentSpeedX = speedX + scrollVelocityX;
        const currentSpeedY = speedY + scrollVelocityY;

        items.forEach(item => {
            // Mover
            item.x -= currentSpeedX * item.parallaxSpeed;
            item.y -= currentSpeedY * item.parallaxSpeed;

            // Teletransporte X
            const buffer = 100; // Margen para que no desaparezca de golpe
            if (item.x < -item.width - buffer) item.x += wrapWidth + item.width;
            if (item.x > wrapWidth) item.x -= wrapWidth + item.width + buffer;

            // Teletransporte Y
            if (item.y < -item.height - buffer) item.y += wrapHeight;
            if (item.y > wrapHeight - item.height) item.y -= wrapHeight + buffer;

            // Aplicar
            gsap.set(item.element, { x: item.x, y: item.y });
        });
    });

    // --- SCROLL TURBO (Desktop + Mobile Wheel) ---
    window.addEventListener("wheel", (e) => {
        scrollVelocityX += e.deltaX * 0.15;
        scrollVelocityY += e.deltaY * 0.15;
        if (e.deltaX === 0) scrollVelocityX += e.deltaY * 0.15; 
    }, { passive: true });

    // --- TOUCH TURBO (Mobile Swipe) ---
    let touchStartX = 0;
    let touchStartY = 0;
    let touchLastX = 0;
    let touchLastY = 0;

    window.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchLastX = touchStartX;
        touchLastY = touchStartY;
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;

        // Calculamos la diferencia de movimiento
        const diffX = touchLastX - currentX; // Invertido para sensación de arrastre
        const diffY = touchLastY - currentY;

        // Añadimos velocidad al turbo (factor 0.2 para suavidad)
        scrollVelocityX += diffX * 0.2;
        scrollVelocityY += diffY * 0.2;

        touchLastX = currentX;
        touchLastY = currentY;
    }, { passive: true });
}

// ===================================
// 7. PÁGINA ABOUT (ABSTRACT & FLUID)
// ===================================
function initAbout(data) {
    if (!data) return;

    // A) INYECTAR HTML (Reemplazamos el contenedor existente)
    // Buscamos el contenedor 'about-container' que tenías en el HTML
    // O si prefieres, limpiamos el main y lo creamos de cero.
    // Vamos a asumir que tienes un <div id="about-main"> o usamos el body para inyectar.
    
    // Para no romper tu estructura actual, vamos a limpiar el .about-container 
    // y llenarlo con la nueva estructura.
    const container = document.querySelector(".about-container") || document.querySelector("main");
    if (!container) return;
    
    // Preparamos el HTML de la Timeline
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

    // Preparamos el Marquee de Skills (Lo duplicamos para efecto infinito)
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
    
    // B) ANIMACIONES GSAP
    
    // 1. Hero Title (Reveal)
    gsap.from(".about-title-large", {
        y: 100,
        opacity: 0,
        duration: 1.5,
        ease: "power4.out",
        delay: 0.2
    });

    // 2. Foto Flotante (Parallax suave)
    gsap.fromTo(".about-floating-img", 
        { rotation: 5, y: 50, opacity: 0 },
        { 
            rotation: -5, y: -50, opacity: 1, 
            duration: 1.5, ease: "power3.out", delay: 0.5 
        }
    );
    
    // Parallax al hacer scroll en la foto
    gsap.to(".about-floating-img", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
            trigger: ".about-hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    // 3. Textos y Timeline (Aparición escalonada)
    const elements = document.querySelectorAll(".anim-up");
    elements.forEach(el => {
        gsap.from(el, {
            y: 50,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: el,
                start: "top 90%"
            }
        });
    });

    // 4. Skills Marquee (Movimiento infinito)
    gsap.to(".skills-track", {
        xPercent: -50, // Se mueve hacia la izquierda
        ease: "none",
        duration: 20, // Velocidad constante
        repeat: -1    // Infinito
    });
    
    // 5. Cambio de color de fondo al llegar a Skills (Efecto dramático)
    gsap.to("body", {
        backgroundColor: "#1a1a1a", // Se oscurece
        color: "#f2f2f2",
        scrollTrigger: {
            trigger: ".skills-marquee-wrapper",
            start: "top center",
            end: "bottom center",
            toggleActions: "play reverse play reverse"
        }
    });
}