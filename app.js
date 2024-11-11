document.addEventListener("DOMContentLoaded", () => {
    const takePhotoBtn = document.getElementById("takePhotoBtn");
    const cameraInput = document.getElementById("cameraInput");
    const photo = document.getElementById("photo");
    const generatePdfBtn = document.getElementById("generatePdfBtn");
    const mapContainer = document.getElementById("map");
    const logoPath = "logo.png"; 
    const formatDate = formatDate()

    let photoData = null;
    let geolocationData = null;
    let addressData = null;
    let ipData = null;
    let map;

    // Format date pour le nom de fichier
    function formatDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        const reportStringName = 'Rapport généré le '+day+'/'+month+'/'+year+' à '+hours+'h'+minutes;
        const fileName = year+'-'+month+'-'+'day'+hours+'-'+minutes+'-rapport-photo.pdf';

        //return nowReportName
        //return `${day}/${month}/${year} ${hours}:${minutes}`;
        //return now.toISOString().replace(/[:.]/g, "-");
        
    }

    // Obtenir le type et la version de l'OS
    function getOSInfo() {
        const userAgent = navigator.userAgent;
        let osType = "Inconnu";
        let osVersion = "Inconnu";

        if (userAgent.indexOf("Win") !== -1) {
            osType = "Windows";
            const versionMatch = userAgent.match(/Windows NT ([\d.]+)/);
            osVersion = versionMatch ? versionMatch[1] : "Inconnu";
        } else if (userAgent.indexOf("Mac") !== -1) {
            osType = "MacOS";
            const versionMatch = userAgent.match(/Mac OS X ([\d_]+)/);
            osVersion = versionMatch ? versionMatch[1].replace(/_/g, ".") : "Inconnu";
        } else if (userAgent.indexOf("Linux") !== -1) {
            osType = "Linux";
        } else if (userAgent.indexOf("Android") !== -1) {
            osType = "Android";
            const versionMatch = userAgent.match(/Android ([\d.]+)/);
            osVersion = versionMatch ? versionMatch[1] : "Inconnu";
        } else if (userAgent.indexOf("like Mac") !== -1) {
            osType = "iOS";
            const versionMatch = userAgent.match(/OS ([\d_]+)/);
            osVersion = versionMatch ? versionMatch[1].replace(/_/g, ".") : "Inconnu";
        }

        return { osType, osVersion };
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

        const { osType, osVersion } = getOSInfo();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Rapport de Prise de Vue", 10, 10);

        // Logo
        if (logoPath) {
            doc.addImage(logoPath, "PNG", 10, 20, 40, 20);
        }

        // Photo
        // Dimensions pour la photo
        const maxWidth = 200;
        const maxHeight = 200;
    
        if (photoData) {
            const img = new Image();
            img.src = photoData;
    
            // Une fois l'image chargée, ajout dans le PDF
            img.onload = function() {
                const aspectRatio = img.width / img.height;
                let width = maxWidth;
                let height = maxHeight;
    
                if (aspectRatio > 1) {
                    // Image horizontale
                    height = maxWidth / aspectRatio;
                } else {
                    // Image verticale ou carrée
                    width = maxHeight * aspectRatio;
                }
    
                doc.addImage(photoData, "JPEG", 10, 50, width, height);
            if (photoData) {
                doc.addImage(photoData, "JPEG", 10, 50, 180, 100);
            }

        // Détails géolocalisation
        doc.setFontSize(12);
        doc.text(`Latitude: ${geolocationData.latitude}`, 10, 160);
        doc.text(`Longitude: ${geolocationData.longitude}`, 10, 170);
        doc.text(`Adresse: ${addressData}`, 10, 180);
        // Carte
        //if (mapImageData) {
        //    doc.addImage(mapImageData, "PNG", 10, 210, 180, 100);
        //}

        //Informations sur le périphérique
        doc.text(`Type d'OS: ${osType}`, 10, 210);
        doc.text(`Version d'OS: ${osVersion}`, 10, 220);
        doc.text(`Adresse IP: ${ipData}`, 10, 190);

        //Informations sur la version de l'application
        doc.text('v 18-15')

        //Informations sur le rapport
        doc.text(formatDate);

        // Nom dynamique pour le fichier
        //const fileName = `${formatDate()}-rapport_photo.pdf`;
        doc.save(fileName);
    }

    generatePdfBtn.addEventListener("click", generatePdf);
});
