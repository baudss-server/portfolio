/*
 * FINAL CODE v4: With Image Fetching on Load
 * - Awtomatikong kinukuha ang huling na-upload na picture mula sa Firestore tuwing naglo-load ang page.
 * - Tinitiyak na pare-pareho ang nakikitang profile picture sa lahat ng devices.
*/

// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import * as THREE from 'three';


// === FIREBASE CONFIGURATION ===
const firebaseConfig = {
    apiKey: "AIzaSyAuF-WP8t7yv2QWt48FVWF8FBeKMqJ7kXg",
    authDomain: "jl-porfolio-mail.firebaseapp.com",
    projectId: "jl-porfolio-mail",
    storageBucket: "jl-porfolio-mail.appspot.com",
    messagingSenderId: "927698662666",
    appId: "1:927698662666:web:85f2624574f36a3edc76f3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// === CONTACT FORM LOGIC ===
const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyX_8XE3tWwt48FVWF8FBeKMqJ7kXg/exec'; // Palitan kung iba na
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    // (Ang contact form logic mo ay pareho pa rin)
    const submitButton = contactForm.querySelector('button[type="submit"]');
    contactForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = `<span class="animate-spin" style="width: 20px; height: 20px; border: 2px solid transparent; border-top-color: white; border-radius: 50%; display: inline-block;"></span> Sending...`;
        const formData = new FormData(contactForm);
        const data = { name: formData.get('name'), email: formData.get('email'), message: formData.get('message') };
        fetch(APPSCRIPT_URL, { method: 'POST', mode: 'no-cors', cache: 'no-cache', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
            .then(response => { Swal.fire({ title: 'Salamat!', text: 'Matagumpay na naipadala ang iyong mensahe. 📬', icon: 'success', confirmButtonText: 'Okay', confirmButtonColor: '#06b6d4', customClass: { popup: 'custom-swal-width' } }); contactForm.reset(); })
            .catch(error => { console.error('Error:', error); Swal.fire({ title: 'Oops!', text: 'Nagkaroon ng problema. Pakisubukang muli. 😟', icon: 'error', confirmButtonText: 'Okay', confirmButtonColor: '#06b6d4', customClass: { popup: 'custom-swal-width' } }); })
            .finally(() => { submitButton.disabled = false; submitButton.innerHTML = originalButtonText; });
    });
}

// === BAGONG FUNCTION: Para i-compress ang image ===
function compressImage(file, options = {}) {
    return new Promise((resolve, reject) => {
        const { maxWidth = 800, quality = 0.7 } = options;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}

// === BAGONG FUNCTION: Para kunin ang huling picture mula sa Firestore ===
async function loadLatestProfilePicture() {
    const profilePhotoImage = document.getElementById('profilePhoto');
    try {
        // Gumawa ng query para kunin ang documents, naka-order by `uploadedAt` (pinakabago una), limit 1.
        const q = query(collection(db, "profileImagesBase64"), orderBy("uploadedAt", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Kunin ang unang document (na siyang pinakabago)
            const latestImageDoc = querySnapshot.docs[0];
            const imageData = latestImageDoc.data().imageData;
            // Ilagay ang Base64 string sa src ng image
            profilePhotoImage.src = imageData;
        } else {
            console.log("No profile image found in Firestore.");
        }
    } catch (error) {
        console.error("Error loading profile picture:", error);
    }
}


// === ALL OTHER PAGE SCRIPTS ===
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    
    // TATAWAGIN ANG BAGONG FUNCTION PAGKA-LOAD NG PAGE
    loadLatestProfilePicture();

    // (Mobile Menu & Nav Logic - pareho pa rin)
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileMenu = document.getElementById('mobile-menu');
    navLinks.forEach(link => { link.addEventListener('click', () => { if (mobileMenu.classList.contains('is-open')) mobileMenu.classList.remove('is-open'); }); });
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('is-open'));
    
    // --- PHOTO UPLOAD LOGIC ---
    const photoUploadInput = document.getElementById('photoUpload');
    
    photoUploadInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        Swal.fire({
            title: 'Compressing & Saving...', text: 'Please wait, making your image ready.', allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }, customClass: { popup: 'custom-swal-width' }
        });

        try {
            const compressedBase64 = await compressImage(file, { maxWidth: 800, quality: 0.7 });
            const FIRESTORE_LIMIT_BYTES = 950000;
            const stringSizeInBytes = new Blob([compressedBase64]).size;
            if (stringSizeInBytes > FIRESTORE_LIMIT_BYTES) {
                throw new Error("Image is still too large after compression.");
            }
            await addDoc(collection(db, "profileImagesBase64"), {
                imageData: compressedBase64, fileName: `compressed-${file.name}`, uploadedAt: serverTimestamp()
            });
            
            // Pagkatapos mag-upload, i-reload natin para siguradong updated
            await loadLatestProfilePicture();

            Swal.fire({
                title: 'Success!', text: 'Your photo was compressed and updated successfully.', icon: 'success', confirmButtonColor: '#06b6d4', customClass: { popup: 'custom-swal-width' }
            });

        } catch (error) {
            console.error("Error during image processing:", error);
            Swal.fire({
                title: 'Processing Failed',
                text: error.message === "Image is still too large after compression." ? "The original image is too large. Please use a smaller file." : "There was a problem processing your image.",
                icon: 'error', confirmButtonColor: '#06b6d4', customClass: { popup: 'custom-swal-width' }
            });
            photoUploadInput.value = "";
        }
    });

    // --- Page Load & Scroll Animations (GSAP) & Three.js ---
    // (Ang code mo para dito ay pareho pa rin)
    gsap.from("header", { duration: 1, yPercent: -100, opacity: 0, ease: "power2.out", delay: 0.5 });
    gsap.from("footer", { duration: 1, yPercent: 100, opacity: 0, ease: "power2.out", delay: 0.5 });
    gsap.from(".hero-element", { duration: 1.2, opacity: 0, y: -50, stagger: 0.2, ease: "bounce.out", delay: 1 });
    gsap.registerPlugin(ScrollTrigger);
    const createSectionAnimation = (sectionId, fromDirection) => {
        const elements = document.querySelectorAll(`${sectionId} .text-center, ${sectionId} .grid, ${sectionId} .max-w-3xl, ${sectionId} .max-w-5xl`);
        elements.forEach(el => {
            gsap.from(el, {
                scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 15%", toggleActions: "play reverse play reverse" },
                opacity: 0, x: fromDirection === 'left' ? -100 : 100, duration: 0.8, ease: "power3.out"
            });
        });
    };
    createSectionAnimation("#about", 'left');
    createSectionAnimation("#services", 'right');
    createSectionAnimation("#projects", 'left');
    createSectionAnimation("#contact", 'right');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#bg-canvas'), alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.setZ(30);
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 5000;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) posArray[i] = (Math.random() - 0.5) * 200;
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({ size: 0.05, color: 0x06b6d4 });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    const clock = new THREE.Clock();
    const animate = () => {
        const elapsedTime = clock.getElapsedTime();
        particlesMesh.rotation.y = elapsedTime * 0.05;
        particlesMesh.rotation.x = elapsedTime * 0.02;
        renderer.render(scene, camera);
        window.requestAnimationFrame(animate);
    };
    animate();
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
});