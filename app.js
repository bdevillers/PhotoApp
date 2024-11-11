document.addEventListener("DOMContentLoaded", () => {
    const takePhotoBtn = document.getElementById("takePhotoBtn");
    const cameraInput = document.getElementById("cameraInput");
    const photo = document.getElementById("photo");
    const generatePdfBtn = document.getElementById("generatePdfBtn");
    const mapContainer = document.getElementById("map");
    const logoPath = "logo.png"; 

    let photoData = null;
    let geolocationData = null;
    let addressData = null;
    let ipData = null;
    let map;

    // Format date pour le nom de fichier
    function formatDate() {
        const now = new Date();
        return now.toISOString().replace(/[:.]/g, "-");
    }

    // Prendre une photo et afficher la géolocalisation
    takePhotoBtn.addEventListener("click", async () => {
        cameraInput.click();

        // Obtenir la géolocalisation après le clic
        try {
            geolocationData = await getGeolocation();
            await displayMap(geolocationData.latitude, geolocationData.longitude);
        } catch (error) {
            alert("Erreur lors de la géolocalisation : " + error);
        }
    });

    // Récupération de la photo depuis l'appareil
    cameraInput.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                photo.src = e.target.result;
                photo.style.display = "block";
                photoData = e.target.result;
                generatePdfBtn.disabled = false; // Active le bouton PDF
                alert('v 14-45');
            };
            reader.readAsDataURL(file);
        }
    });

    // Obtenir la géolocalisation
    function getGeolocation() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const { latitude, longitude } = position.coords;
                    resolve({ latitude, longitude });
                }, () => {
                    reject("Erreur de géolocalisation.");
                });
            } else {
                reject("Géolocalisation non supportée par le navigateur.");
            }
        });
    }

    // Récupérer l'adresse avec la géolocalisation
    async function getAddress(latitude, longitude) {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        if (response.ok) {
            const data = await response.json();
            return data.display_name;
        } else {
            throw new Error("Impossible de récupérer l'adresse.");
        }
    }

    // Obtenir l'adresse IP
    async function getIPAddress() {
        const response = await fetch("https://api.ipify.org?format=json");
        if (response.ok) {
            const data = await response.json();
            return data.ip;
        } else {
            throw new Error("Impossible de récupérer l'adresse IP.");
        }
    }
    
    async function displayMap(latitude, longitude) {
        if (!map) {
            map = L.map('map').setView([latitude, longitude], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
        } else {
            map.setView([latitude, longitude], 13);
        }
        L.marker([latitude, longitude]).addTo(map).bindPopup("Position actuelle").openPopup();
        mapContainer.style.display = "block";
    }

    // Génération du PDF
    async function generatePdf() {
        try {
            // Compléter la géolocalisation avec l'adresse
            const { latitude, longitude } = geolocationData;
            addressData = await getAddress(latitude, longitude);
            ipData = await getIPAddress();
        } catch (error) {
            alert("Erreur lors de la génération du PDF : " + error);
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Rapport de Prise de Vue", 10, 10);

        // Logo
        if (logoPath) {
            doc.addImage(logoPath, "PNG", 10, 20, 40, 20);
        }

        // Photo
        if (photoData) {
            doc.addImage(photoData, "JPEG", 10, 50, 180, 100);
        }

        // Détails géolocalisation
        doc.setFontSize(12);
        doc.text(`Latitude: ${geolocationData.latitude}`, 10, 160);
        doc.text(`Longitude: ${geolocationData.longitude}`, 10, 170);
        doc.text(`Adresse: ${addressData}`, 10, 180);
        doc.text(`Adresse IP: ${ipData}`, 10, 190);

        // Carte
        //if (mapImageData) {
        //    doc.addImage(mapImageData, "PNG", 10, 210, 180, 100);
        //}

        // Nom dynamique pour le fichier
        const fileName = `${formatDate()}-rapport_photo.pdf`;
        doc.save(fileName);
    }

    generatePdfBtn.addEventListener("click", generatePdf);
});
