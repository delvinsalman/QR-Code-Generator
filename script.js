document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const advancedOptions = document.querySelector('.advanced-options');
    const advancedOptionsHeader = document.querySelector('.advanced-options-header');
    const advancedOptionsContent = document.querySelector('.advanced-options-content');
    const advancedOptionsChevron = advancedOptionsHeader.querySelector('.fa-chevron-down');
    const generateBtn = document.getElementById('generate-btn');
    const qrPlaceholder = document.getElementById('qr-placeholder');
    const qrContainer = document.getElementById('qr-container');
    const qrCanvas = document.getElementById('qr-code');
    const downloadBtns = document.querySelectorAll('.download-btn');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const logoUploadBtn = document.querySelector('.logo-upload-btn');
    const logoUploadInput = document.getElementById('logo-upload');
    const logoPreview = document.querySelector('.logo-preview');
    const logoRemoveBtn = document.querySelector('.logo-remove-btn');
    const qrSizeSlider = document.getElementById('qr-size');
    const qrFgColor = document.getElementById('qr-fg-color');
    const qrBgColor = document.getElementById('qr-bg-color');
    const errorCorrection = document.getElementById('error-correction');

    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab') + '-tab';
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Advanced options toggle
    advancedOptionsHeader.addEventListener('click', () => {
        advancedOptions.classList.toggle('expanded');
        advancedOptionsChevron.classList.toggle('fa-chevron-down');
        advancedOptionsChevron.classList.toggle('fa-chevron-up');
    });

    // Logo upload
    logoUploadBtn.addEventListener('click', () => {
        logoUploadInput.click();
    });

    logoUploadInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    // Create a round crop for the logo
                    const canvas = document.createElement('canvas');
                    canvas.width = 80;
                    canvas.height = 80;
                    const ctx = canvas.getContext('2d');
                    
                    // Create circular clipping path
                    ctx.beginPath();
                    ctx.arc(40, 40, 38, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();
                    
                    // Draw image centered
                    const ratio = Math.min(80 / img.width, 80 / img.height);
                    const newWidth = img.width * ratio;
                    const newHeight = img.height * ratio;
                    ctx.drawImage(img, 40 - newWidth/2, 40 - newHeight/2, newWidth, newHeight);
                    
                    // Set as preview
                    logoPreview.innerHTML = '';
                    logoPreview.appendChild(canvas);
                    logoPreview.querySelector('canvas').style.width = '100%';
                    logoPreview.querySelector('canvas').style.height = '100%';
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    // Logo remove
    logoRemoveBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        logoPreview.innerHTML = '<i class="fas fa-image"></i>';
        logoUploadInput.value = '';
    });

    // Generate QR Code
    generateBtn.addEventListener('click', generateQRCode);

    function generateQRCode() {
        let qrData = '';
        const activeTab = document.querySelector('.tab.active').getAttribute('data-tab');
        
        // Validate and get data based on active tab
        switch(activeTab) {
            case 'url':
                const urlInput = document.getElementById('url-input');
                if (!urlInput.value) {
                    showError(urlInput, 'Please enter a URL');
                    return;
                }
                if (!isValidUrl(urlInput.value)) {
                    showError(urlInput, 'Please enter a valid URL (include http:// or https://)');
                    return;
                }
                qrData = urlInput.value;
                break;
            
            case 'text':
                const textInput = document.getElementById('text-input');
                if (!textInput.value.trim()) {
                    showError(textInput, 'Please enter some text');
                    return;
                }
                qrData = textInput.value;
                break;
            
            case 'contact':
                const contactName = document.getElementById('contact-name').value.trim();
                const contactPhone = document.getElementById('contact-phone').value.trim();
                const contactEmail = document.getElementById('contact-email').value.trim();
                const contactCompany = document.getElementById('contact-company').value.trim();
                
                if (!contactName && !contactPhone && !contactEmail) {
                    showError(document.getElementById('contact-name'), 'Please enter at least one contact detail');
                    return;
                }
                
                // Format as vCard
                qrData = 'BEGIN:VCARD\nVERSION:3.0\n';
                if (contactName) qrData += `FN:${contactName}\nN:${contactName.split(' ').reverse().join(';')};;;\n`;
                if (contactPhone) qrData += `TEL:${contactPhone}\n`;
                if (contactEmail) qrData += `EMAIL:${contactEmail}\n`;
                if (contactCompany) qrData += `ORG:${contactCompany}\n`;
                qrData += 'END:VCARD';
                break;
            
            case 'wifi':
                const wifiSsid = document.getElementById('wifi-ssid').value.trim();
                const wifiPassword = document.getElementById('wifi-password').value;
                const wifiSecurity = document.getElementById('wifi-security').value;
                
                if (!wifiSsid) {
                    showError(document.getElementById('wifi-ssid'), 'Please enter a network name');
                    return;
                }
                
                // Format as WiFi network config
                qrData = `WIFI:T:${wifiSecurity};S:${wifiSsid};`;
                if (wifiPassword) qrData += `P:${wifiPassword};`;
                qrData += ';';
                break;
        }
        
        // Get QR code options
        const size = parseInt(qrSizeSlider.value);
        const fgColor = qrFgColor.value;
        const bgColor = qrBgColor.value;
        const correctionLevel = errorCorrection.value;
        
        // Generate QR code
        QRCode.toCanvas(qrCanvas, qrData, {
            width: size,
            color: {
                dark: fgColor,
                light: bgColor
            },
            errorCorrectionLevel: correctionLevel
        }, function(error) {
            if (error) {
                showToast('Error generating QR code', 'error');
                console.error(error);
                return;
            }
            
            // Add logo if exists
            const logo = logoPreview.querySelector('canvas, img');
            if (logo) {
                const ctx = qrCanvas.getContext('2d');
                const logoSize = size * 0.2; // Logo size is 20% of QR code size
                const center = size / 2 - logoSize / 2;
                
                // Draw white background for logo
                ctx.fillStyle = bgColor;
                ctx.fillRect(center - 5, center - 5, logoSize + 10, logoSize + 10);
                
                // Draw logo
                if (logo.tagName === 'CANVAS') {
                    ctx.drawImage(logo, center, center, logoSize, logoSize);
                } else {
                    // For SVG or other image types (would need more handling)
                    ctx.drawImage(logo, center, center, logoSize, logoSize);
                }
            }
            
            // Show QR code
            qrPlaceholder.style.display = 'none';
            qrContainer.style.display = 'block';
            showToast('QR Code generated successfully!');
        });
    }
    
    // Download buttons
    downloadBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (!qrCanvas.style.display || qrCanvas.style.display === 'none') {
                showToast('Please generate a QR code first', 'warning');
                return;
            }
            
            const format = this.getAttribute('data-format');
            downloadQRCode(format);
        });
    });
    
    function downloadQRCode(format) {
        const link = document.createElement('a');
        let filename = 'qr-code';
        
        // Set filename based on content
        const activeTab = document.querySelector('.tab.active').getAttribute('data-tab');
        switch(activeTab) {
            case 'url':
                const url = document.getElementById('url-input').value;
                filename = url.replace(/^https?:\/\//, '').split('/')[0] || 'url-qr-code';
                break;
            case 'text':
                const text = document.getElementById('text-input').value.substring(0, 20).replace(/\s+/g, '-');
                filename = text || 'text-qr-code';
                break;
            case 'contact':
                const name = document.getElementById('contact-name').value.trim() || 'contact';
                filename = name.toLowerCase().replace(/\s+/g, '-') + '-qr-code';
                break;
            case 'wifi':
                const ssid = document.getElementById('wifi-ssid').value.trim() || 'wifi';
                filename = ssid.toLowerCase().replace(/\s+/g, '-') + '-qr-code';
                break;
        }
        
        if (format === 'svg') {
            // For SVG we need to regenerate the QR code
            let qrData = getQRData();
            if (!qrData) return;
            
            QRCode.toString(qrData, {
                type: 'svg',
                color: {
                    dark: qrFgColor.value,
                    light: qrBgColor.value
                },
                errorCorrectionLevel: errorCorrection.value
            }, function(error, svg) {
                if (error) {
                    showToast('Error generating SVG', 'error');
                    return;
                }
                
                link.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
                link.download = `${filename}.svg`;
                link.click();
            });
        } else {
            // For PNG/JPEG we can use the canvas
            link.download = `${filename}.${format}`;
            link.href = qrCanvas.toDataURL(`image/${format}`);
            link.click();
        }
    }
    
    function getQRData() {
        const activeTab = document.querySelector('.tab.active').getAttribute('data-tab');
        let qrData = '';
        
        switch(activeTab) {
            case 'url':
                qrData = document.getElementById('url-input').value;
                break;
            case 'text':
                qrData = document.getElementById('text-input').value;
                break;
            case 'contact':
                const contactName = document.getElementById('contact-name').value.trim();
                const contactPhone = document.getElementById('contact-phone').value.trim();
                const contactEmail = document.getElementById('contact-email').value.trim();
                const contactCompany = document.getElementById('contact-company').value.trim();
                
                qrData = 'BEGIN:VCARD\nVERSION:3.0\n';
                if (contactName) qrData += `FN:${contactName}\nN:${contactName.split(' ').reverse().join(';')};;;\n`;
                if (contactPhone) qrData += `TEL:${contactPhone}\n`;
                if (contactEmail) qrData += `EMAIL:${contactEmail}\n`;
                if (contactCompany) qrData += `ORG:${contactCompany}\n`;
                qrData += 'END:VCARD';
                break;
            case 'wifi':
                const wifiSsid = document.getElementById('wifi-ssid').value.trim();
                const wifiPassword = document.getElementById('wifi-password').value;
                const wifiSecurity = document.getElementById('wifi-security').value;
                
                qrData = `WIFI:T:${wifiSecurity};S:${wifiSsid};`;
                if (wifiPassword) qrData += `P:${wifiPassword};`;
                qrData += ';';
                break;
        }
        
        return qrData;
    }
    
    // Helper functions
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    function showError(element, message) {
        element.classList.add('error');
        showToast(message, 'error');
        setTimeout(() => {
            element.classList.remove('error');
        }, 1000);
    }
    
    function showToast(message, type = 'success') {
        toastMessage.textContent = message;
        
        // Set icon and color based on type
        const icon = toast.querySelector('i');
        switch(type) {
            case 'error':
                icon.className = 'fas fa-exclamation-circle';
                toast.style.borderLeftColor = 'var(--danger)';
                break;
            case 'warning':
                icon.className = 'fas fa-exclamation-triangle';
                toast.style.borderLeftColor = 'var(--warning)';
                break;
            default:
                icon.className = 'fas fa-check-circle';
                toast.style.borderLeftColor = 'var(--success)';
        }
        
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
});