// DOM elements
const issueForm = document.getElementById('issueForm');
const fileUploadZone = document.getElementById('fileUploadZone');
const fileInput = document.getElementById('fileInput');
const uploadedFiles = document.getElementById('uploadedFiles');
const successModal = document.getElementById('successModal');
const logoutModal = document.getElementById('logoutModal');

// Mobile menu - check if elements exist before adding listeners
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeSidebar = document.getElementById('closeSidebar');

if (menuToggle && sidebar && sidebarOverlay) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
        sidebarOverlay.classList.toggle('hidden');
    });
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
    });
    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
        });
    }
}

// Tab functionality (just show/hide EJS-rendered content)
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        // Update button styles
        document.querySelectorAll('.tab-btn').forEach(b => {
            if (b.dataset.tab === tab) {
                b.classList.add('bg-gold', 'text-charcoal');
                b.classList.remove('text-stone', 'bg-cream', 'border', 'border-beige');
            } else {
                b.classList.remove('bg-gold', 'text-charcoal');
                b.classList.add('text-stone', 'bg-cream', 'border', 'border-beige');
            }
        });
        // Show/hide content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${tab}Tab`).classList.remove('hidden');
    });
});

// Check for order parameter
const urlParams = new URLSearchParams(window.location.search);
const orderFromUrl = urlParams.get('order');
if (orderFromUrl) {
    document.getElementById('orderSelect').value = orderFromUrl;
}

// File upload
let uploadedFilesList = [];
fileUploadZone.addEventListener('click', () => fileInput.click());
fileUploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadZone.classList.add('dragover');
});
fileUploadZone.addEventListener('dragleave', () => {
    fileUploadZone.classList.remove('dragover');
});
fileUploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});
function displayUploadedFile(file) {
    const fileDiv = document.createElement('div');
    fileDiv.className = 'flex items-center justify-between p-3 bg-pearl rounded-lg fade-in';
    fileDiv.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas fa-image text-gold"></i>
            <span class="text-sm text-charcoal">${file.name}</span>
            <span class="text-xs text-stone">(${(file.size / 1024).toFixed(1)} KB)</span>
        </div>
        <button onclick="removeFile('${file.name}')" class="text-red-500 hover:text-red-700">
            <i class="fas fa-times"></i>
        </button>
    `;
    uploadedFiles.appendChild(fileDiv);
}
window.removeFile = function(fileName) {
    uploadedFilesList = uploadedFilesList.filter(f => f.name !== fileName);
    renderUploadedFiles();
};
function renderUploadedFiles() {
    uploadedFiles.innerHTML = '';
    uploadedFilesList.forEach(file => displayUploadedFile(file));
}

const submitBtn = issueForm.querySelector('button[type="submit"]');

function setLoading(isLoading) {
    if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
    } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Report';
    }
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
            uploadedFilesList.push(file);
            displayUploadedFile(file);
        } else {
            alert('Only JPG/PNG images up to 5MB are allowed.');
        }
    });
}

// Form submission: POST to backend
issueForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return; // Prevent double submit
    setLoading(true);
    try {
        const orderSelect = document.getElementById('orderSelect');
        const selectedOption = orderSelect.selectedOptions[0];
        const productId = selectedOption?.dataset.productId || '';
        const sellerId = selectedOption?.dataset.sellerId || '';
        const categoryRaw = document.querySelector('input[name="category"]:checked')?.value || '';
        const categoryMap = {
            'damaged': 'Damaged',
            'wrong': 'Wrong Item',
            'missing': 'Missing',
            'quality': 'Quality',
            'shipping': 'Shipping',
            'other': 'Other'
        };
        const category = categoryMap[categoryRaw] || categoryRaw.charAt(0).toUpperCase() + categoryRaw.slice(1);
        const description = document.getElementById('issueDescription').value;
        if (description.length < 10) {
            alert('Description must be at least 10 characters.');
            setLoading(false);
            return;
        }
        const formData = new FormData();
        formData.append('orderId', orderSelect.value);
        formData.append('productId', productId);
        formData.append('sellerId', sellerId);
        formData.append('category', category);
        formData.append('description', description);
        formData.append('preferredResolution', document.getElementById('resolution').value);
        // Only append files if any
        if (uploadedFilesList.length > 0) {
            uploadedFilesList.forEach(file => {
                formData.append('photos', file);
            });
        }
        if (!formData.get('orderId') || !formData.get('productId') || !formData.get('sellerId') || !formData.get('category') || !formData.get('description')) {
        alert('Please fill in all required fields');
            setLoading(false);
        return;
    }
        // Debug: print all FormData entries
        console.log('DEBUG FormData:', [...formData.entries()]);
        const response = await fetch('/dashboard/report-issue', {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            body: formData // DO NOT set Content-Type, browser will handle it
        });
        if (response.ok) {
            const data = await response.json();
            document.getElementById('reportId').textContent = data.reportId || '';
    successModal.classList.remove('hidden');
    issueForm.reset();
    uploadedFilesList = [];
    uploadedFiles.innerHTML = '';
        } else {
            let errMsg = 'Failed to submit report';
            try {
                const err = await response.json();
                errMsg = err.message || errMsg;
            } catch {}
            alert(errMsg);
        }
    } catch (err) {
        alert('Failed to submit report. Please check your files and try again.');
    } finally {
        setLoading(false);
    }
});

// Close success modal
document.getElementById('closeSuccess').addEventListener('click', () => {
    successModal.classList.add('hidden');
    document.querySelector('[data-tab="existing"]').click();
    // Optionally, reload the page to show the new report
    window.location.reload();
});

// Logout modal
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    logoutModal.classList.remove('hidden');
});
document.getElementById('cancelLogout')?.addEventListener('click', () => {
    logoutModal.classList.add('hidden');
});
document.getElementById('confirmLogout')?.addEventListener('click', () => {
    window.location.href = '/logout';
});

// Close modals on escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        successModal.classList.add('hidden');
        logoutModal.classList.add('hidden');
    }
});
