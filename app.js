document.addEventListener("DOMContentLoaded", () => {
    const takePhotoBtn = document.getElementById("takePhotoBtn");
    const cameraInput = document.getElementById("cameraInput");
    const photo = document.getElementById("photo");
    const generatePdfBtn = document.getElementById("generatePdfBtn");
    const mapContainer = document.getElementById("map");
    const logoPath = "https://www.adeena.fr/wp-content/uploads/2024/01/Logo-ADEENA-233x44-sans-texte-150x38.png"; 

    let photoData = null;
    let geolocationData = null;
    let addressData = null;
    let ipData = null;
    let map;

    // Prendre une photo
    takePhotoBtn.addEventListener("click", () => {
        cameraInput.click();
    });

    cameraInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                photo.src = e.target.result;
                photo.style.display = "block";
                photoData = e.target.result;
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
        generatePdfBtn.disabled = false;
    }

    async function captureMap() {
        return html2canvas(mapContainer).then(canvas => canvas.toDataURL("image/png"));
    }

    async function generatePdf() {
        alert('v14-15')
        try {
            geolocationData = await getGeolocation();
            await displayMap(geolocationData.latitude, geolocationData.longitude);
        } catch (error) {
            alert(error);
            return;
        }

        try {
            const { latitude, longitude } = geolocationData;
            addressData = await getAddress(latitude, longitude);
        } catch (error) {
            alert(error);
            return;
        }

        try {
            ipData = await getIPAddress();
        } catch (error) {
            alert(error);
            return;
        }

        const mapImageData = await captureMap();
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
        
        // Information sur le périphérique
        doc.text(`Périphérique: ${navigator.userAgent}`, 10, 190);
        doc.text(`Adresse IP: ${ipData}`, 10, 200);

        // Carte
        //if (mapImageData) {
        //    doc.addImage(mapImageData, "PNG", 10, 210, 180, 100);
        //}

        // Horodatage et autres informations
        const photoName = `Photo_${new Date().toISOString()}.jpg`;
        doc.text(`Nom de la photo: ${photoName}`, 10, 320);

        doc.save("rapport_photo.pdf");

        alert(console.log);
    }

    generatePdfBtn.addEventListener("click", generatePdf);
});
