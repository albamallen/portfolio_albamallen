// ===================================
// LÓGICA DETALLE PROYECTO (ABSTRACT & PREMIUM)
// ===================================

function renderProjectPro(projects) {
    // Registramos el plugin ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // 1. OBTENER ID DEL PROYECTO DE LA URL
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("id");
    
    const currentIndex = projects.findIndex(p => p.id === projectId);
    
    // Si no encuentra el proyecto, vuelve al home
    if (currentIndex === -1) { 
        window.location.href = "index.html"; 
        return; 
    }
    
    const project = projects[currentIndex];
    
    // Calcular siguiente proyecto (Loop infinito)
    const nextIndex = (currentIndex + 1) % projects.length;
    const nextProject = projects[nextIndex];
    
    const container = document.getElementById("project-main");

    // ----------------------------------------------------
    // 2. GENERAR MEDIA DEL HERO (VIDEO O FOTO)
    // ----------------------------------------------------
    const isHeroVideo = project.image.toLowerCase().endsWith(".mp4") || 
                        project.image.toLowerCase().endsWith(".webm");
    
    const heroMedia = isHeroVideo 
        ? `<video src="${project.image}" autoplay loop muted playsinline class="p-floating-img"></video>` 
        : `<img src="${project.image}" class="p-floating-img" alt="${project.title}">`;


    // ----------------------------------------------------
    // 3. GENERAR GALERÍA ASIMÉTRICA (MIXTO VIDEO/FOTO)
    // ----------------------------------------------------
    let galleryHTML = "";
    
    // Si hay galería definida en el JSON, la usamos. Si no, no mostramos nada.
    if (project.gallery && project.gallery.length > 0) {
        project.gallery.forEach((src, i) => {
            // Lógica de diseño: 
            // 0 -> Centro, 1 -> Izquierda, 2 -> Derecha (Patrón de 3)
            let alignClass = "p-img-center";
            let speed = 80; // Velocidad parallax estándar

            if (i % 3 === 1) { 
                alignClass = "p-img-left"; 
                speed = 40; // Los de la izquierda van más lento
            } else if (i % 3 === 2) { 
                alignClass = "p-img-right"; 
                speed = 120; // Los de la derecha van más rápido
            }

            // Detectar si es video
            const isVid = src.toLowerCase().endsWith(".mp4") || src.toLowerCase().endsWith(".webm");
            
            const tag = isVid 
                ? `<video src="${src}" autoplay loop muted playsinline class="p-img-item ${alignClass} parallax-img" data-speed="${speed}"></video>` 
                : `<img src="${src}" class="p-img-item ${alignClass} parallax-img" alt="Gallery ${i}" data-speed="${speed}">`;
            
            galleryHTML += tag;
        });
    }


    // ----------------------------------------------------
    // 4. BOTÓN EXTERNO (SI EXISTE EN JSON)
    // ----------------------------------------------------
    let externalBtnHTML = "";
    if (project.externalLink && project.externalLink !== "") {
        // Texto del botón (opcional, por defecto "Visitar Web")
        const btnText = project.linkText || "Visitar Web"; 
        
        externalBtnHTML = `
            <a href="${project.externalLink}" target="_blank" class="project-floating-btn">
                <span>${btnText}</span>
                <svg class="btn-arrow" viewBox="0 0 24 24">
                    <path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"/>
                </svg>
            </a>`;
    }

    // ----------------------------------------------------
    // 5. FOOTER MEDIA (VIDEO O FOTO)
    // ----------------------------------------------------
    const isNextVideo = nextProject.image.toLowerCase().endsWith(".mp4") || 
                        nextProject.image.toLowerCase().endsWith(".webm");
    
    const nextMediaHTML = isNextVideo
        ? `<video src="${nextProject.image}" autoplay loop muted playsinline class="next-project-bg"></video>`
        : `<img src="${nextProject.image}" class="next-project-bg" alt="Next Project">`;


    // ----------------------------------------------------
    // 6. INYECTAR TODO EL HTML
    // ----------------------------------------------------
    container.innerHTML = `
        <section class="p-abstract-hero">
            <div class="p-marquee-container">
                <div class="p-marquee-text">
                    ${project.title} — ${project.title} — ${project.title} — ${project.title} —
                </div>
            </div>
            
            <div class="p-floating-img-wrapper">
                ${heroMedia}
            </div>
        </section>

        <section class="p-abstract-grid">
            
            <aside class="p-sidebar">
                <div class="p-meta-block anim-meta">
                    <span class="p-meta-label">Cliente</span>
                    <span class="p-meta-value">${project.client}</span>
                </div>
                <div class="p-meta-block anim-meta">
                    <span class="p-meta-label">Año & Rol</span>
                    <span class="p-meta-value">${project.year} — ${project.role}</span>
                </div>
                <div class="p-meta-block anim-meta">
                    <span class="p-meta-label">Servicios</span>
                    <span class="p-meta-value">${project.category}</span>
                </div>
                
                <div style="margin-top: 50px; font-size: 0.95rem; color: #666; line-height: 1.6;" class="anim-meta">
                    ${project.description}
                </div>
            </aside>

            <div class="p-content-col">
                <h2 class="p-big-desc reveal-type">${project.content}</h2>
                
                <div class="p-abstract-gallery">
                    ${galleryHTML}
                </div>
            </div>

        </section>

        <div class="next-project-section">
            ${nextMediaHTML}
            
            <div class="next-content-wrapper">
                <span class="next-label">Siguiente Proyecto</span>
                <h2 class="next-title">${nextProject.title}</h2>
                
                <svg class="next-arrow-icon" viewBox="0 0 24 24">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                </svg>
            </div>
        </div>

        ${externalBtnHTML}
    `;

    // 7. INICIAR LAS ANIMACIONES GSAP
    initAbstractAnimations(nextProject.id);
}

// ===================================
// ANIMACIONES GSAP (SCROLLTRIGGER)
// ===================================

function initAbstractAnimations(nextId) {
    
    // A) MARQUEE SCROLL (Texto moviéndose lateralmente)
    gsap.to(".p-marquee-text", {
        xPercent: -30,
        ease: "none",
        scrollTrigger: {
            trigger: ".p-abstract-hero",
            start: "top top",
            end: "bottom top",
            scrub: 1
        }
    });

    // B) HERO IMAGE (Rotación y Escalado al bajar)
    gsap.to(".p-floating-img-wrapper", {
        rotation: 0, 
        y: 150,      
        scale: 1.1,  
        ease: "none",
        scrollTrigger: {
            trigger: ".p-abstract-hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    // C) ENTRADA DATOS SIDEBAR (Stagger desde abajo)
    gsap.from(".anim-meta", {
        y: 40,
        opacity: 0,
        duration: 1.2,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
            trigger: ".p-sidebar",
            start: "top 85%"
        }
    });

    // D) GALERÍA PARALLAX (CORREGIDO: MOVIMIENTO Y OPACIDAD SEPARADOS)
    const images = document.querySelectorAll(".parallax-img");
    
    images.forEach((img) => {
        const speed = img.getAttribute("data-speed") || 80;
        
        // 1. Configuración inicial
        gsap.set(img, { opacity: 0, y: 100 }); 

        // 2. Animación de APARICIÓN (Opacidad) - SIN SCRUB
        // Se dispara una vez y completa la opacidad rápido
        gsap.to(img, {
            opacity: 1,
            duration: 1, // Tarda 1 segundo en aparecer
            ease: "power2.out",
            scrollTrigger: {
                trigger: img,
                start: "top 85%", // Empieza cuando el top de la imagen entra al 85% de la pantalla
                toggleActions: "play none none reverse" // Si subes, se vuelve a ocultar, si bajas aparece
            }
        });

        // 3. Animación de MOVIMIENTO (Parallax) - CON SCRUB
        // Esta sí depende del scroll para moverse
        gsap.to(img, {
            y: -speed, // Sube según la velocidad calculada
            ease: "none",
            scrollTrigger: {
                trigger: img,
                start: "top bottom", // Desde que entra por abajo
                end: "bottom top",   // Hasta que sale por arriba
                scrub: 1.2 // Suavizado del movimiento
            }
        });
    });
    
    // E) APARICIÓN BOTÓN EXTERNO
    const fab = document.querySelector(".project-floating-btn");
    if (fab) {
        gsap.to(fab, {
            y: 0, 
            opacity: 1, 
            duration: 1, 
            delay: 1, 
            ease: "back.out(1.7)" 
        });
    }

    // F) CLICK SIGUIENTE PROYECTO
    const nextSection = document.querySelector(".next-project-section");
    if (nextSection) {
        nextSection.addEventListener("click", () => {
            const overlay = document.querySelector(".page-transition-overlay");
            gsap.to(overlay, { 
                y: "0%", 
                duration: 0.8, 
                ease: "power4.inOut",
                onComplete: () => {
                    window.location.href = `project.html?id=${nextId}`;
                }
            });
        });
    }
}