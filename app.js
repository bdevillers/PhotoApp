document.addEventListener("DOMContentLoaded", () => {

    const appVersion = 'v. 22-56';

    // Afficher la version de l'application
    const appVersionElement = document.getElementById("appVersion");
    if (appVersionElement) {
        appVersionElement.textContent = appVersion; // Insère la version dans l'élément
    }
    
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

    // Fonction de formatage de la date pour le nom et le contenu du fichier
    function formatDate(forFileName = false) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        if (forFileName) {
            return `${year}-${month}-${day}_${hours}-${minutes}`;
        } else {
            return `${day}/${month}/${year} à ${hours}:${minutes}`;
        }
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
        console.log("Version :", appVersion); //Affiche la version de l'application
        try {
            // Obtenir la géolocalisation après le clic
            geolocationData = await getGeolocation();
            console.log("Géolocalisation obtenue :", geolocationData); // Affiche les données dans la console

            // Optionnel : Affiche la géolocalisation sur la page
            const mapContainer = document.getElementById("map");
            if (mapContainer) {
                // Afficher la carte ou les informations de géolocalisation ici
                await displayMap(geolocationData.latitude, geolocationData.longitude);
            }
        } catch (error) {
            console.error("Erreur lors de la géolocalisation :", error);
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
        //DEBUG
        alert('Latitude = '+latitude);
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
        // Charger les ressources Leaflet
        const leafletCssLink = document.createElement('link');
        leafletCssLink.rel = 'stylesheet';
        leafletCssLink.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
        document.head.appendChild(leafletCssLink);
    
        const leafletJsScript = document.createElement('script');
        leafletJsScript.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
        document.body.appendChild(leafletJsScript);
    
        // Créer la carte Leaflet
        map = L.map('map').setView([latitude, longitude], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
      } else {
        map.setView([latitude, longitude], 13);
      }
    
      // Ajouter un marqueur pour la position actuelle
      L.marker([latitude, longitude]).addTo(map).bindPopup("Position actuelle").openPopup();
      mapContainer.style.display = "block";
    }

    // Génération du PDF
    async function generatePdf() {
        try {
            // Compléter la géolocalisation avec l'adresse et l'IP
            geolocationData = await getGeolocation();
            await displayMap(geolocationData.latitude, geolocationData.longitude);
            //const { latitude, longitude } = geolocationData;
            addressData = await getAddress(latitude, longitude);
            ipData = await getIPAddress();
        } catch (error) {
            alert("Erreur lors de la génération du PDF : " + error);
            return;
        }

        const { osType, osVersion } = getOSInfo();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Titre
        doc.setFontSize(18);
        doc.text("Rapport de Prise de Vue", 10, 10);

        // Phrase de génération du rapport avec date et heure
        const generationText = `Rapport généré le ${formatDate()}`;
        doc.setFontSize(12);
        doc.text(generationText, 10, 20);

        // Logo
        if (logoPath) {
            doc.addImage(logoPath, "PNG", 10, 30, 40, 20);
        }

        // Photo avec ajustement de dimensions
        if (photoData) {
            const img = new Image();
            img.src = photoData;

            img.onload = function() {
                const aspectRatio = img.width / img.height;
                const maxWidth = 180;
                const maxHeight = 100;
                let width = maxWidth;
                let height = maxHeight;

                if (aspectRatio > 1) {
                    height = maxWidth / aspectRatio;
                } else {
                    width = maxHeight * aspectRatio;
                }

                doc.addImage(photoData, "JPEG", 10, 60, width, height);

                // Détails géolocalisation et informations système
                doc.text(`Latitude: ${latitude}`, 10, 170);
                doc.text(`Longitude: ${longitude}`, 10, 180);
                doc.text(`Adresse: ${addressData}`, 10, 190);
                doc.text(`Adresse IP: ${ipData}`, 10, 200);
                doc.text(`Type d'OS: ${osType}`, 10, 210);
                doc.text(`Version d'OS: ${osVersion}`, 10, 220);

                //Informations sur la version de l'application
                //doc.text(appVersion, 10, 100);

                // Nom dynamique pour le fichier
                const fileName = `${formatDate(true)}-rapport_photo.pdf`;
                doc.save(fileName);
            };
        }
    }

    generatePdfBtn.addEventListener("click", generatePdf);
});
