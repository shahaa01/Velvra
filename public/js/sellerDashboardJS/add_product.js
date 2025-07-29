// Category Selector Component
function categorySelector() {
    return {
        activeTab: 'browse',
        selectedCategory: [],
        recentCategories: [
            { path: 'Fashion > Men > Clothing > T-Shirts' },
            { path: 'Fashion > Women > Accessories > Bags' }
        ],
        categories: [
            {
                name: 'Women',
                expanded: false,
                children: [
                    { name: 'Clothing - Dresses' },
                    { name: 'Clothing - Tops & T-Shirts' },
                    { name: 'Clothing - Jackets & Coats' },
                    { name: 'Clothing - Pants & Trousers' },
                    { name: 'Accessories - Bags' },
                    { name: 'Accessories - Jewelry' },
                    { name: 'Footwear - Heels' },
                    { name: 'Footwear - Sneakers' }
                ]
            },
            {
                name: 'Men',
                expanded: false,
                children: [
                    { name: 'Clothing - T-Shirts' },
                    { name: 'Clothing - Shirts' },
                    { name: 'Clothing - Jackets & Coats' },
                    { name: 'Clothing - Pants & Jeans' },
                    { name: 'Accessories - Watches' },
                    { name: 'Accessories - Belts' },
                    { name: 'Footwear - Sneakers' },
                    { name: 'Footwear - Formal Shoes' }
                ]
            },
            {
                name: 'Kids',
                expanded: false,
                children: [
                    { name: 'Boys - T-Shirts' },
                    { name: 'Boys - Pants' },
                    { name: 'Girls - Dresses' },
                    { name: 'Girls - Tops' },
                    { name: 'Unisex - Footwear' }
                ]
            }
        ],
        
        toggleCategory(category) {
            category.expanded = !category.expanded;
        },
        
        selectCategory(path) {
            this.selectedCategory = path;
            this.addToRecent(path.join(' > '));
        },
        
        selectFromRecent(recent) {
            this.selectedCategory = recent.path.split(' > ');
        },
        
        addToRecent(path) {
            const existingIndex = this.recentCategories.findIndex(r => r.path === path);
            if (existingIndex > -1) {
                this.recentCategories.splice(existingIndex, 1);
            }
            this.recentCategories.unshift({ path });
            if (this.recentCategories.length > 5) {
                this.recentCategories.pop();
            }
        }
    }
}

// Image Uploader Component
function imageUploader() {
    return {
        images: [],
        showEditModal: false,
        editingImage: null,
        cropper: null,
        aspectRatio: 'free',
        flipX: 1,
        flipY: 1,
        isLoading: false,
        pendingReset: false,
        // --- New loader states ---
        isUploading: false,
        isSavingEdit: false,

        async handleImageUpload(event) {
            const files = Array.from(event.target.files).slice(0, 7 - this.images.length);
            if (files.length === 0) return;
            const formData = new FormData();
            files.forEach(file => {
                formData.append('images', file);
            });
            this.isUploading = true;
            try {
                const response = await fetch('/images/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if (response.ok && data.files) {
                    data.files.forEach((filePath, idx) => {
                        const file = files[idx];
                        this.images.push({
                            url: filePath,
                            file: file,
                            name: file.name,
                            serverPath: filePath,
                            originalUrl: filePath,
                            editedUrl: null,
                            inReset: false
                        });
                    });
                } else {
                    Swal.fire({
                      icon: 'error',
                      title: 'Upload Failed',
                      text: data.error || 'Image upload failed.',
                      confirmButtonColor: '#d97706'
                    });
                }
            } catch (err) {
                Swal.fire({
                  icon: 'error',
                  title: 'Upload Failed',
                  text: 'Image upload failed. Please try again.',
                  confirmButtonColor: '#d97706'
                });
            }
            this.isUploading = false;
            event.target.value = '';
        },

        removeImage(index) {
            Swal.fire({
              title: 'Remove Image',
              text: 'Are you sure you want to remove this image?',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#d97706',
              cancelButtonColor: '#6b7280',
              confirmButtonText: 'Yes, remove it!',
              cancelButtonText: 'Cancel'
            }).then((result) => {
              if (result.isConfirmed) {
                const img = this.images[index];
                // Remove from UI
                this.images.splice(index, 1);
                // Remove from backend
                fetch('/images/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        originalUrl: img.originalUrl,
                        editedUrl: img.editedUrl
                    })
                });
              }
            });
        },

        editImage(index) {
            // Create a deep working copy for modal edits
            this.editingImageIndex = index;
            const img = this.images[index];
            this.workingImage = {
                url: img.url,
                originalUrl: img.originalUrl,
                editedUrl: img.editedUrl,
                name: img.name,
                file: img.file,
                serverPath: img.serverPath,
                inReset: img.inReset
            };
            this.showEditModal = true;
            this.pendingReset = false;
            this.$nextTick(() => {
                if (this.cropper) {
                    this.cropper.destroy();
                }
                const image = document.getElementById('imageToEdit');
                // Always use cache-busted URL for the modal
                let cropperUrl = this.workingImage.editedUrl
                    ? this.workingImage.editedUrl + '?t=' + Date.now()
                    : this.workingImage.originalUrl + '?t=' + Date.now();
                image.src = cropperUrl;
                this.cropper = new Cropper(image, {
                    aspectRatio: this.aspectRatio === 'free' ? NaN : this.aspectRatio,
                    viewMode: 1,
                    autoCropArea: 0.8,
                    responsive: true,
                    background: false,
                    ready: () => {
                        image.addEventListener('crop', () => { this.pendingReset = false; });
                        image.addEventListener('zoom', () => { this.pendingReset = false; });
                        image.addEventListener('rotate', () => { this.pendingReset = false; });
                        image.addEventListener('move', () => { this.pendingReset = false; });
                        image.addEventListener('scale', () => { this.pendingReset = false; });
                    }
                });
            });
        },

        setAspectRatio(ratio) {
            this.aspectRatio = ratio;
            if (this.cropper) {
                this.cropper.setAspectRatio(ratio === 'free' ? NaN : ratio);
                this.pendingReset = false; // Clear reset if user makes a new edit
            }
        },

        flip(direction) {
            if (!this.cropper) return;
            if (direction === 'horizontal') {
                this.flipX *= -1;
                this.cropper.scaleX(this.flipX);
            } else {
                this.flipY *= -1;
                this.cropper.scaleY(this.flipY);
            }
            this.pendingReset = false; // Clear reset if user makes a new edit
        },

        removeBackground() {
            if (!this.workingImage || !this.cropper) return;
            this.isLoading = true;
            this.cropper.getCroppedCanvas().toBlob(blob => {
                const formData = new FormData();
                formData.append('image', blob, 'current.png');
                formData.append('originalUrl', this.workingImage.originalUrl); // for reference
                fetch('/images/remove-bg', {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    const newUrl = data.newImageUrl;
                    const cacheBustedUrl = newUrl + '?t=' + Date.now();
                    this.workingImage.editedUrl = newUrl;
                    this.workingImage.url = cacheBustedUrl;
                    this.cropper.replace(cacheBustedUrl);
                })
                .finally(() => this.isLoading = false);
            }, 'image/png');
        },

        applyChanges() {
            if (!this.cropper) {
                this.showEditModal = false;
                return;
            }
            this.isSavingEdit = true;
            if (this.pendingReset) {
                const currentDataUrl = this.cropper.getCroppedCanvas().toDataURL('image/png');
                const tempImg = new window.Image();
                tempImg.onload = () => {
                    const origImg = new window.Image();
                    origImg.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = origImg.width;
                        canvas.height = origImg.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(origImg, 0, 0);
                        const origDataUrl = canvas.toDataURL('image/png');
                        if (currentDataUrl === origDataUrl) {
                            // Actually reset editedUrl to null
                            this.workingImage.editedUrl = null;
                            this.workingImage.url = this.workingImage.originalUrl;
                            this.pendingReset = false;
                            this._commitWorkingImage();
                            this.isSavingEdit = false;
                        } else {
                            this._saveCroppedImage(true);
                        }
                    };
                    origImg.src = this.workingImage.originalUrl;
                };
                tempImg.src = currentDataUrl;
                return;
            }
            this._saveCroppedImage(true);
        },

        _saveCroppedImage(commitAfter = false) {
            this.cropper.getCroppedCanvas().toBlob(blob => {
                const formData = new FormData();
                formData.append('image', blob, 'edited.png');
                formData.append('originalUrl', this.workingImage.originalUrl);
                fetch('/images/save-edit', {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    const newUrl = data.editedUrl;
                    const cacheBustedUrl = newUrl + '?t=' + Date.now();
                    this.workingImage.editedUrl = newUrl;
                    this.workingImage.url = cacheBustedUrl;
                    this.pendingReset = false;
                    if (commitAfter) this._commitWorkingImage();
                })
                .catch(() => {
                    this.pendingReset = false;
                    if (commitAfter) this._commitWorkingImage();
                })
                .finally(() => {
                    this.isSavingEdit = false;
                });
            }, 'image/png');
        },

        _commitWorkingImage() {
            // Commit the working copy to the main images array and editingImage
            if (typeof this.editingImageIndex === 'number' && this.images[this.editingImageIndex]) {
                Object.assign(this.images[this.editingImageIndex], this.workingImage);
                this.editingImage = this.images[this.editingImageIndex];
            }
            this.showEditModal = false;
            this.images = [...this.images];
            if (window.Alpine) Alpine.store('imageUploader', this);
        },

        deleteImage() {
            if (!this.editingImage) return;
            // Remove from UI
            const idx = this.images.indexOf(this.editingImage);
            if (idx !== -1) this.images.splice(idx, 1);
            this.showEditModal = false;
            // Call backend to delete both original and edited
            fetch('/images/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalUrl: this.editingImage.originalUrl,
                    editedUrl: this.editingImage.editedUrl
                })
            });
        },

        resetImage() {
            // Only set pendingReset and update cropper preview, do not modify editedUrl or url
            this.pendingReset = true;
            if (this.cropper && this.editingImage) {
                this.cropper.replace(this.editingImage.originalUrl);
            }
        },

        viewEdited() {
            // Always show the last edited image if it exists, regardless of pendingReset
            if (this.workingImage && this.workingImage.editedUrl) {
                const cacheBustedUrl = this.workingImage.editedUrl + '?t=' + Date.now();
                this.workingImage.url = cacheBustedUrl;
                if (this.cropper) this.cropper.replace(cacheBustedUrl);
            } else if (this.workingImage) {
                this.workingImage.url = this.workingImage.originalUrl;
                if (this.cropper) this.cropper.replace(this.workingImage.originalUrl);
            }
        },

        cancelModal() {
            // Discard all unsaved edits and restore the cropper and UI to the state when the modal was opened
            if (typeof this.editingImageIndex === 'number' && this.images[this.editingImageIndex]) {
                const img = this.images[this.editingImageIndex];
                const cacheBustedUrl = (img.editedUrl ? img.editedUrl : img.originalUrl) + '?t=' + Date.now();
                img.url = cacheBustedUrl;
                if (this.cropper) this.cropper.replace(cacheBustedUrl);
                this.editingImage = img;
            }
            this.pendingReset = false;
            this.showEditModal = false;
        },
    }
}

// Brand Selector Component
function brandSelector() {
    return {
        brandSearch: '',
        selectedBrand: '',
        showDropdown: false,
        brands: [
            'No Brand', 'Nike', 'Adidas', 'Puma', 'Zara', 'H&M', 'Uniqlo', 
            'Calvin Klein', 'Tommy Hilfiger', 'Levi\'s', 'Gap', 'Forever 21',
            'Mango', 'Bershka', 'Pull & Bear', 'Massimo Dutti'
        ],
        filteredBrands: [],
        
        init() {
            this.filteredBrands = this.brands;
        },
        
        filterBrands() {
            this.filteredBrands = this.brands.filter(brand => 
                brand.toLowerCase().includes(this.brandSearch.toLowerCase())
            );
            this.showDropdown = true;
        },
        
        selectBrand(brand) {
            this.brandSearch = brand;
            this.selectedBrand = brand;
            this.showDropdown = false;
        }
    }
}

// Patch for brandSelector to sync selectedBrand with manual input
const _orig_brandSelector = brandSelector;
brandSelector = function() {
  const data = _orig_brandSelector();
  const origSelectBrand = data.selectBrand;
  data.selectBrand = function(brand) {
    origSelectBrand.call(this, brand);
    if (window.Alpine) Alpine.store('brandSelector', this);
  };
  // Patch: clear selectedBrand if input is cleared
  const origFilterBrands = data.filterBrands;
  data.filterBrands = function() {
    origFilterBrands.call(this);
    // Always sync selectedBrand to brandSearch for manual entry
    this.selectedBrand = this.brandSearch;
    if (window.Alpine) Alpine.store('brandSelector', this);
  };
  return data;
};

// Variant Manager Component
function variantManager() {
    return {
        colors: [],
        sizeChart: [
            { size: 'M', bodyPart: 'Chest', unit: 'cm', value: '' }
        ],
        showColorModal: false,
        newColor: { name: '', hex: '#000000' },
        variantCombinations: [],
        // Color image state
        showColorImageModal: false,
        editingColorIndex: null,
        editingColorImageUrl: '',
        colorCropper: null,
        
        addColor() {
            if (this.newColor.name) {
                this.colors.push({
                    name: this.newColor.name,
                    hex: this.newColor.hex,
                    imageUrl: null, // Initialize imageUrl
                    publicId: null  // Initialize publicId
                });
                this.newColor = { name: '', hex: '#000000' };
                this.showColorModal = false;
                this.updateVariantCombinations();
            }
        },
        
        removeColor(index) {
            this.colors.splice(index, 1);
            this.updateVariantCombinations();
        },
        
        addSizeRow() {
            this.sizeChart.push({
                size: 'M',
                bodyPart: 'Chest',
                unit: 'cm',
                value: ''
            });
            this.updateVariantCombinations();
        },
        
        removeSizeRow(index) {
            this.sizeChart.splice(index, 1);
            this.updateVariantCombinations();
        },
        
        getUniqueSizes() {
            return [...new Set(this.sizeChart.map(s => s.size))];
        },
        
        getVariantCombinations() {
            const combinations = [];
            const sizes = this.getUniqueSizes();
            
            this.colors.forEach(color => {
                sizes.forEach(size => {
                    const id = `${color.name}-${size}`;
                    let existing = this.variantCombinations.find(c => c.id === id);
                    if (!existing) {
                        existing = {
                            id,
                            color: color.name,
                            size,
                            price: '',
                            salePrice: null,
                            salePercentage: 0,
                            stock: '',
                            sku: '',
                            active: true
                        };
                        this.variantCombinations.push(existing);
                    }
                    combinations.push(existing);
                });
            });
            
            // Clean up removed combinations
            this.variantCombinations = this.variantCombinations.filter(c => 
                combinations.some(combo => combo.id === c.id)
            );
            
            return combinations;
        },
        
        updateVariantCombinations() {
            this.$nextTick(() => {
                this.getVariantCombinations();
            });
        },
// add_product.js

// inside the return object of the variantManager() function
// REPLACE the existing functions with these four new versions

uploadColorImage(event, index) {
    const file = event.target.files[0];
    if (!file) return;

    // Don't upload. Just read the file for a local cropper preview.
    const reader = new FileReader();
    reader.onload = (e) => {
        this.editingColorIndex = index;
        this.workingColorImage = {
            imageUrl: e.target.result // This is a base64 Data URL for the preview
        };
        this.showColorImageModal = true;
        this.$nextTick(() => {
            if (this.colorCropper) this.colorCropper.destroy();
            const image = document.getElementById('colorImageToEdit');
            image.src = e.target.result;
            this.colorCropper = new Cropper(image, {
                aspectRatio: 1,
                viewMode: 1,
                autoCropArea: 0.8
            });
        });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
},

editColorImage(index) {
    this.editingColorIndex = index;
    const color = this.colors[index];
    this.workingColorImage = {
        imageUrl: color.imageUrl
    };
    this.showColorImageModal = true;
    this.$nextTick(() => {
        if (this.colorCropper) this.colorCropper.destroy();
        const image = document.getElementById('colorImageToEdit');
        // Add a cache-busting timestamp
        image.src = color.imageUrl + '?t=' + Date.now();
        this.colorCropper = new Cropper(image, {
            aspectRatio: 1,
            viewMode: 1,
            autoCropArea: 0.8
        });
    });
},

applyColorImageChanges() {
    if (!this.colorCropper || this.editingColorIndex === null) {
        this.showColorImageModal = false;
        return;
    }
    this.showColorImageSaving = true;

    // Capture the URL of the image that is about to be replaced.
    const oldImageUrl = this.colors[this.editingColorIndex].imageUrl;

    this.colorCropper.getCroppedCanvas({ width: 500, height: 500 }).toBlob(blob => {
        if (!blob) {
            this.showColorImageSaving = false;
            return;
        }

        const formData = new FormData();
        formData.append('image', blob, 'edited-color.png');
        
        // --- ADD THIS LINE ---
        // The backend /save-edit route requires this field, even if it doesn't use it for overwriting.
        formData.append('originalUrl', oldImageUrl || 'placeholder');

        // Step 1: Upload the new, cropped image.
        fetch('/images/save-edit', {
            method: 'POST',
            body: formData
        })
        .then(res => {
            if (!res.ok) throw new Error('New image upload failed');
            return res.json();
        })
        .then(data => {
            const newImageUrl = data.editedUrl;

            // Step 2: If an old image existed, delete it from the server now.
            if (oldImageUrl) {
                fetch('/images/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ originalUrl: oldImageUrl.split('?')[0] })
                }).catch(err => console.error("Non-critical: Could not delete old color image.", err));
            }

            // Step 3: Update the UI state with the single, new image URL.
            this.colors[this.editingColorIndex].imageUrl = newImageUrl + '?t=' + Date.now();
            this.showColorImageModal = false;
        })
        .catch(err => {
            console.error("Failed to apply color image changes:", err);
            alert("An error occurred while saving the image. Please try again.");
            this.showColorImageModal = false;
        })
        .finally(() => {
            this.showColorImageSaving = false;
        });
    }, 'image/png');
},

deleteColorImage(index) {
    const color = this.colors[index];
    if (!color.imageUrl) return;

    Swal.fire({
      title: 'Delete Color Image',
      text: 'Are you sure you want to delete this color image?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d97706',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        fetch('/images/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ originalUrl: color.imageUrl.split('?')[0] })
        }).then(res => {
            if (res.ok) {
                this.colors[index].imageUrl = null;
            } else {
                Swal.fire({
                  icon: 'error',
                  title: 'Delete Failed',
                  text: 'Failed to delete the image from the server. Please try again.',
                  confirmButtonColor: '#d97706'
                });
            }
        }).catch(err => {
            console.error('Error deleting color image:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'An error occurred. Failed to delete the image.',
              confirmButtonColor: '#d97706'
            });
        });
      }
    });
},
        cancelColorImageModal() {
            // Discard the working copy and close the modal
            this.workingColorImage = null;
            this.showColorImageModal = false;
        },
    }
}

// Description Editor Component
function descriptionEditor() {
    return {
        wordCount: 0,
        placeholder: 'Describe your fashion product in detail...',
        isFocused: false,
        isBold: false,
        isItalic: false,
        isUL: false,
        isOL: false,

        normalizeOrderedLists() {
            // Ensure continuous numbering for <ol> after a <ul> or other block
            const editor = this.$refs.editor;
            if (!editor) return;
            const ols = Array.from(editor.querySelectorAll('ol'));
            let lastNumber = 0;
            ols.forEach((ol, idx) => {
                // Find previous sibling that is an <ol>
                let prev = ol.previousElementSibling;
                while (prev && prev.tagName.toLowerCase() !== 'ol') {
                    prev = prev.previousElementSibling;
                }
                if (prev && prev.tagName.toLowerCase() === 'ol') {
                    // Get last li number from previous <ol>
                    const prevLis = prev.querySelectorAll('li');
                    const prevCount = prevLis.length;
                    const prevStart = parseInt(prev.getAttribute('start') || '1', 10);
                    const prevLast = prevStart + prevCount - 1;
                    ol.setAttribute('start', prevLast + 1);
                } else {
                    ol.removeAttribute('start'); // Start from 1 if not after another <ol>
                }
            });
        },

        // Call normalizeOrderedLists after every input or formatting action
        updateWordCount() {
            const text = this.$refs.editor.innerText || '';
            this.wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
            this.normalizeOrderedLists();
        },

        formatText(command) {
            this.$refs.editor.focus();

            if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
                const listTag = command === 'insertUnorderedList' ? 'ul' : 'ol';

                // If empty, insert a list as the only content
                if (this.$refs.editor.innerHTML.trim() === '' || this.$refs.editor.innerHTML === '<br>') {
                    console.log('[DEBUG] Editor empty, inserting initial list');
                    this.$refs.editor.innerHTML = `<${listTag}><li><br></li></${listTag}>`;
                    const li = this.$refs.editor.querySelector('li');
                    if (li) {
                        const range = document.createRange();
                        const sel = window.getSelection();
                        range.selectNodeContents(li);
                        range.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else {
                        console.log('[DEBUG] Failed to find <li> after inserting list');
                    }
                    this.updateWordCount();
                    this.updateActiveStates();
                    return;
                }

                // Try execCommand
                const before = this.$refs.editor.innerHTML;
                document.execCommand(command, false, null);
                const after = this.$refs.editor.innerHTML;
                if (before === after) {
                    console.log('[DEBUG] execCommand did not change editor HTML, attempting manual insertion');
                }

                // If still not a list, insert manually at caret
                const selection = window.getSelection();
                if (!this.$refs.editor.querySelector('ul') && !this.$refs.editor.querySelector('ol') && selection.rangeCount > 0) {
                    console.log('[DEBUG] No <ul> or <ol> found after execCommand, inserting manually at caret');
                    const range = selection.getRangeAt(0);
                    const li = document.createElement('li');
                    li.appendChild(document.createElement('br'));
                    const list = document.createElement(listTag);
                    list.appendChild(li);
                    range.deleteContents();
                    range.insertNode(list);

                    // Move caret inside the new li
                    const newRange = document.createRange();
                    newRange.selectNodeContents(li);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                } else {
                    if (this.$refs.editor.querySelector('ul') || this.$refs.editor.querySelector('ol')) {
                        console.log('[DEBUG] List successfully created by execCommand');
                    } else {
                        console.log('[DEBUG] Could not create list even after manual insertion');
                    }
                }

                this.updateWordCount();
                this.updateActiveStates();
                return;
            }

            document.execCommand(command, false, null);
            this.updateWordCount();
            this.updateActiveStates();
        },

        handleKeydown(e) {
            // Keyboard shortcuts
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                this.formatText('bold');
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
                e.preventDefault();
                this.formatText('italic');
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
                e.preventDefault();
                this.formatText('insertUnorderedList');
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
                e.preventDefault();
                this.formatText('insertOrderedList');
            }
        },

        updateActiveStates() {
            // Use queryCommandState to update formatting states
            this.isBold = document.queryCommandState('bold');
            this.isItalic = document.queryCommandState('italic');
            this.isUL = document.queryCommandState('insertUnorderedList');
            this.isOL = document.queryCommandState('insertOrderedList');
        },

        setPlaceholder() {
            if (!this.isFocused && this.$refs.editor.innerHTML.trim() === '') {
                this.$refs.editor.innerHTML = `<span class='editor-placeholder' style='color:#aaa;'>${this.placeholder}</span>`;
            }
        },
        clearPlaceholder() {
            if (this.$refs.editor.innerText.trim() === this.placeholder) {
                this.$refs.editor.innerHTML = '';
            }
        },
        onFocus() {
            this.isFocused = true;
            if (this.$refs.editor.innerText.trim() === this.placeholder) {
                this.$refs.editor.innerHTML = '';
            }
            this.updateActiveStates();
        },
        onBlur() {
            this.isFocused = false;
            this.setPlaceholder();
        },
        onSelectionChange() {
            this.updateActiveStates();
        },
        init() {
            this.setPlaceholder();
            // Listen for selection changes globally
            document.addEventListener('selectionchange', () => {
                if (document.activeElement === this.$refs.editor) {
                    this.onSelectionChange();
                }
            });
        },
        getHTML() {
            // For saving
            return this.$refs.editor.innerHTML;
        },
        setHTML(html) {
            // For loading
            this.$refs.editor.innerHTML = html;
            this.updateWordCount();
        }
    }
}

// Highlights Manager Component
function highlightsManager() {
    return {
        highlights: [
            { text: '' },
            { text: '' },
            { text: '' }
        ],
        suggestions: [
            'Premium Quality Material',
            'Comfortable Fit',
            'Machine Washable', 
            'Trendy Design',
            'All Season Wear',
            'Durable Construction'
        ],
        
        addHighlight() {
            this.highlights.push({ text: '' });
        },
        
        removeHighlight(index) {
            if (this.highlights.length > 1) {
                this.highlights.splice(index, 1);
            }
        },
        
        addSuggestion(suggestion) {
            const emptyHighlight = this.highlights.find(h => !h.text);
            if (emptyHighlight) {
                emptyHighlight.text = suggestion;
            } else {
                this.highlights.push({ text: suggestion });
            }
        }
    }
}

// Import fast-average-color, nspell, lodash (assume available via build or window)
// If using CDN, add <script> tags in EJS; otherwise, import here for build tools
// For browser, use window.FastAverageColor, window.nspell, window._

// --- Content Score Utilities ---

// Spellcheck setup (nspell, English dictionary)
let spell;
(async function loadSpell() {
  if (window.nspell) {
    const aff = await fetch('/public/js/dictionaries/en_US.aff').then(r => r.text());
    const dic = await fetch('/public/js/dictionaries/en_US.dic').then(r => r.text());
    spell = new window.nspell(aff, dic);
  }
})();

// Helper: Check if string contains brand/style keywords
function containsBrandOrStyle(name, brand) {
  if (!name) return false;
  const keywords = [brand, 'Dress', 'Shirt', 'T-Shirt', 'Jacket', 'Pants', 'Denim', 'Bodycon', 'Kurta', 'Saree', 'Lehenga', 'Blazer', 'Velvet', 'Cotton', 'Fit', 'Slim', 'Oversized', 'Classic', 'Formal', 'Trendy'];
  return keywords.some(k => k && name.toLowerCase().includes(k.toLowerCase()));
}

// Helper: Check if first image has white/neutral background (treat transparent as white)
async function isWhiteBackground(imgUrl) {
  if (!imgUrl || !window.FastAverageColor) return false;
  return new Promise(resolve => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function() {
      // Draw image on white background to treat transparency as white
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const fac = new window.FastAverageColor();
      const color = fac.getColor(canvas);
      const [r, g, b] = color.value;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const lightness = (max + min) / 2;
      const sat = max === min ? 0 : (max - min) / (1 - Math.abs(2 * lightness / 255 - 1));
      const isWhite = lightness > 200 && sat < 70;
      console.log('[isWhiteBackground] Result:', {r, g, b, lightness, sat, isWhite});
      resolve(isWhite);
    };
    img.onerror = () => { console.log('[isWhiteBackground] Image load error'); resolve(false); };
    img.src = imgUrl;
  });
}

// Helper: Check all images >= 480x480px
async function allImagesHighRes(images) {
  if (!images || !images.length) return false;
  for (const img of images) {
    const ok = await new Promise(resolve => {
      const i = new window.Image();
      i.onload = () => resolve(i.width >= 480 && i.height >= 480);
      i.onerror = () => resolve(false);
      i.src = img.url || img;
    });
    if (!ok) return false;
  }
  return true;
}

// Helper: Check image diversity (5+ images or diverse names)
function diverseAngles(images) {
  if (!images || images.length < 5) return false;
  const names = images.map(i => i.name || i.url || '').join(' ').toLowerCase();
  const keywords = ['front', 'back', 'side', 'angle', 'detail', 'zoom', 'model'];
  return keywords.some(k => names.includes(k)) || images.length >= 5;
}

// Helper: Spellcheck description
function spellcheckText(text) {
  if (!spell || !text) return 0;
  const words = text.split(/\s+/).filter(Boolean);
  let errors = 0;
  for (const w of words) {
    if (!spell.correct(w)) errors++;
    if (errors > 2) break;
  }
  return errors;
}

// Helper: Parse description HTML for formatting
function parseDescriptionFormatting(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const hasBold = !!doc.querySelector('b, strong');
  const hasItalic = !!doc.querySelector('i, em');
  const hasList = !!doc.querySelector('ul, ol');
  return { hasBold, hasItalic, hasList };
}

// --- Main Content Score Alpine Component ---

function contentScore() {
  return {
    score: 0,
    breakdown: {
      basicInfo: 0,
      categoryBrand: 0,
      variants: 0,
      description: 0,
      highlights: 0,
      metadata: 0
    },
    checks: {
      basicInfo: false,
      categoryBrand: false,
      variants: false,
      description: false,
      highlights: false,
      metadata: false
    },
    imageChecks: { coverBg: false, resolution: false, diversity: false },
    variantChecks: { colors: false, sizes: false, stockAndPrice: false },
    descriptionChecks: { wordCount: false, formatting: false, keywords: false, spell: false },
    highlightChecks: { length: false },
    metadataChecks: { coreFields: false, optionalFields: false },
    interval: null,
    async updateScore() {
        // --- 1. Basic Info (20 pts) ---
        let basic = 0;
        const name = document.getElementById('productName')?.value?.trim() || '';
        const brand = window.Alpine?.store('brandSelector')?.selectedBrand?.trim() || '';
        const images = (window.Alpine?.store('imageUploader')?.images || []).filter(img => img && img.url);
        const hasName = name.length >= 30;
        const hasImages = images.length >= 3;
        let hasQuality = false;
        if (hasName) basic += 5;
        if (containsBrandOrStyle(name, brand) && hasName) basic += 3;
        if (hasImages) basic += 5;
        // Cover image background
        this.imageChecks.coverBg = false;
        if (images[0]) {
          this.imageChecks.coverBg = await isWhiteBackground(images[0].url || images[0]);
          if (this.imageChecks.coverBg) basic += 5;
          hasQuality = hasQuality || this.imageChecks.coverBg;
        }
        // All images high res
        this.imageChecks.resolution = images.length > 0 ? await allImagesHighRes(images) : false;
        if (this.imageChecks.resolution) basic += 3;
        hasQuality = hasQuality || this.imageChecks.resolution;
        // Diversity
        this.imageChecks.diversity = images.length > 0 ? diverseAngles(images) : false;
        if (this.imageChecks.diversity) basic += 2;
        hasQuality = hasQuality || this.imageChecks.diversity;
        this.breakdown.basicInfo = basic;
        // Tick if name, 3+ images, and at least one image quality check
        this.checks.basicInfo = hasName && hasImages && hasQuality;
  
        // --- 2. Category & Brand (10 pts) ---
        let cat = 0;
        // Use selectedPath for category depth
        const selectedPath = (window.Alpine?.store('categorySelector')?.selectedPath || []).filter(Boolean);
        if (selectedPath.length >= 3) cat += 5;
        if (brand) cat += 5;
        this.breakdown.categoryBrand = cat;
        this.checks.categoryBrand = cat === 10;
  
        // --- 3. Variants & Pricing (20 pts) ---
        let varScore = 0;
        const colors = (window.Alpine?.store('variantManager')?.colors || []).filter(c => c && c.name && c.name.trim());
        const sizeChart = (window.Alpine?.store('variantManager')?.sizeChart || []).filter(s => s && s.size && s.bodyPart && s.unit && s.value && s.value.toString().trim() !== '');
        const combos = (window.Alpine?.store('variantManager')?.getVariantCombinations?.() || []).filter(c => c && c.color && c.size);
        // Color image for each color
        this.variantChecks.colors = colors.length > 0 && colors.every(c => c.imageUrl);
        if (this.variantChecks.colors) varScore += 6;
        // At least 1 size
        this.variantChecks.sizes = sizeChart.length > 0;
        if (this.variantChecks.sizes) varScore += 3;
        // All combos have price, stock, SKU
        this.variantChecks.stockAndPrice = combos.length > 0 && combos.every(c => c.price && c.stock && c.sku);
        if (this.variantChecks.stockAndPrice) varScore += 8;
        // Any combo has sale price
        if (combos.some(c => c.salePrice)) varScore += 3;
        this.breakdown.variants = varScore;
        this.checks.variants = varScore >= 14;
  
        // --- 4. Description (20 pts) ---
        let descScore = 0;
        const editor = document.querySelector('[contenteditable="true"]');
        const html = editor?.innerHTML || '';
        let text = editor?.innerText?.trim() || '';
        // Exclude placeholder text from scoring
        if (text === 'Describe your fashion product in detail...') text = '';
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        this.descriptionChecks.wordCount = wordCount >= 30;
        if (wordCount >= 30) descScore += 5;
        if (wordCount >= 50) descScore += 2;
        // Formatting
        const fmt = parseDescriptionFormatting(html);
        this.descriptionChecks.formatting = fmt.hasBold || fmt.hasItalic;
        if (fmt.hasBold || fmt.hasItalic) descScore += 2;
        if (fmt.hasList) descScore += 3;
        // Keywords
        this.descriptionChecks.keywords = /fabric|fit|cotton|denim|material|occasion|trend|style/i.test(text);
        if (this.descriptionChecks.keywords) descScore += 5;
        // Spellcheck
        const spellErrors = spellcheckText(text);
        this.descriptionChecks.spell = spellErrors <= 2;
        if (spellErrors <= 2 && wordCount > 0) descScore += 3;
        this.breakdown.description = descScore;
        this.checks.description = descScore >= 15;
  
        // --- 5. Highlights (15 pts) ---
        let highScore = 0;
        // Only count highlights that are non-empty and >= 4 words
        const highlights = (window.Alpine?.store('highlightsManager')?.highlights || []).filter(h => h && h.text && h.text.trim().length > 0);
        if (highlights.length >= 3) highScore += 5;
        this.highlightChecks.length = highlights.length >= 3 && highlights.every(h => (h.text || '').split(/\s+/).filter(Boolean).length >= 4);
        if (this.highlightChecks.length) highScore += 5;
        // Uses suggested or custom (non-empty)
        if (highlights.some(h => h.text && h.text.length > 0)) highScore += 5;
        this.breakdown.highlights = highScore;
        this.checks.highlights = highScore >= 10;
  
        // --- 6. Metadata & Extras (15 pts) ---
        let metaScore = 0;
        const meta = window.Alpine?.store('moreDetailsManager')?.selected || {};
        const coreFields = ['fabric', 'fashionTrend', 'fit', 'occasion', 'washCare', 'weaveType', 'neckType', 'pattern'];
        let filledCore = 0;
        for (const f of coreFields) if (meta[f] && meta[f].toString().trim()) filledCore++;
        this.metadataChecks.coreFields = filledCore >= 4;
        metaScore += Math.min(filledCore, 6) * 2;
        // Optional fields
        const optionalFields = ['sleeveLength', 'sleeveStyling', 'lining', 'surfaceStyling', 'closureType', 'transparency', 'length', 'multipack', 'numItems', 'packageContains', 'printPatternType'];
        let filledOpt = 0;
        for (const f of optionalFields) if (meta[f] && meta[f].toString().trim()) filledOpt++;
        this.metadataChecks.optionalFields = filledOpt >= 5;
        if (filledOpt >= 5) metaScore += 3;
        this.breakdown.metadata = metaScore;
        this.checks.metadata = metaScore >= 10;
  
        // --- Total ---
        const total = this.breakdown.basicInfo + this.breakdown.categoryBrand + this.breakdown.variants + this.breakdown.description + this.breakdown.highlights + this.breakdown.metadata;
        this.score = total === 0 ? 0 : total;
        // Sync to Alpine store for global access
        if (window.Alpine && Alpine.store && Alpine.store('contentScore')) {
          Alpine.store('contentScore').score = this.score;
        }
        
        // REMOVED: The imperative DOM manipulation is no longer needed.
        // const publishBtn = document.querySelector('.sticky-actions button.publish-product');
        // if (publishBtn) publishBtn.disabled = this.score < 80;
      },
      init() {
        // Start periodic update
        this.interval = setInterval(() => this.updateScore(), 1000);
        this.updateScore();
      }
    }
  }

// Register Alpine stores for all major sections for global reactivity
if (window.Alpine) {
  document.addEventListener('alpine:init', () => {
    Alpine.store('imageUploader', imageUploader());
    Alpine.store('brandSelector', brandSelector());
    Alpine.store('variantManager', variantManager());
    Alpine.store('highlightsManager', highlightsManager());
    Alpine.store('moreDetailsManager', moreDetailsManager());
    Alpine.store('categorySelector', categorySelector());
    Alpine.store('contentScore', contentScore()); // <-- Register contentScore as a global store
  });
}

// --- Publish Product Handler ---
document.addEventListener('alpine:init', () => {
  Alpine.data('publishProductHandler', () => ({
    isPublishing: false,
    async publishProduct() {
      if (this.isPublishing) return;
      this.isPublishing = true;
      try {
        // Gather all product data from Alpine stores
        const name = document.getElementById('productName')?.value?.trim() || '';
        const brand = Alpine.store('brandSelector')?.selectedBrand?.trim() || '';
        const images = (Alpine.store('imageUploader')?.images || []).map(img => img.url).filter(Boolean);
        
        // Get colors with just size names (no stock info)
        const uniqueSizes = Alpine.store('variantManager')?.getUniqueSizes?.() || [];
        const colors = (Alpine.store('variantManager')?.colors || []).map(c => ({
          name: c.name,
          hex: c.hex,
          sizes: uniqueSizes, // Use the unique sizes from sizeChart
          imageUrl: c.imageUrl || null
        }));
        
        const sizes = (Alpine.store('variantManager')?.getUniqueSizes?.() || []);
        const categoryPath = (Alpine.store('categorySelector')?.selectedPath || []).map(c => c.name || c);
        const tags = []; // Optionally gather tags if present
        const sizeChart = (Alpine.store('variantManager')?.sizeChart || []);
        const variants = (Alpine.store('variantManager')?.getVariantCombinations?.() || []);
        
        // Remove 'id' property from each variant for backend compatibility and clean data
        const cleanVariants = variants.map(({ id, ...rest }) => ({
          ...rest,
          // Convert empty strings to null for optional fields
          salePrice: rest.salePrice === '' ? null : rest.salePrice,
          salePercentage: rest.salePercentage || 0,
          // Convert empty strings to numbers for required fields
          price: rest.price === '' ? 0 : Number(rest.price),
          stock: rest.stock === '' ? 0 : Number(rest.stock)
        }));
        const highlights = (Alpine.store('highlightsManager')?.highlights || []).map(h => h.text).filter(Boolean);
        const moreDetails = Alpine.store('moreDetailsManager')?.selected || {};
        const description = Alpine.store('descriptionEditor')?.getHTML?.() || '';
        const contentScore = this.score;

        // Client-side validation (basic)
        if (!name || !brand || images.length < 1 || colors.length < 1 || sizes.length < 1 || categoryPath.length < 1 || cleanVariants.length < 1) {
          Swal.fire({
            icon: 'warning',
            title: 'Missing Information',
            text: 'Please fill all required fields and ensure you have at least one image, color, size, and variant.',
            confirmButtonColor: '#d97706'
          });
          this.isPublishing = false;
          return;
        }
        if (contentScore < 80) {
          Swal.fire({
            icon: 'warning',
            title: 'Content Score Too Low',
            text: 'Content score must be at least 80 to publish.',
            confirmButtonColor: '#d97706'
          });
          this.isPublishing = false;
          return;
        }

        // Prepare payload - no top-level price/salePrice, everything is in variants
        const payload = {
          name,
          brand,
          images,
          colors,
          sizes,
          categoryPath,
          tags,
          sizeChart,
          variants: cleanVariants,
          highlights,
          moreDetails,
          description,
          contentScore
        };

        // Debug log to help troubleshoot
        console.log('Payload being sent:', {
          colors: colors.map(c => ({ name: c.name, sizes: c.sizes })),
          variants: cleanVariants.length,
          contentScore
        });

        // Send POST request
        const response = await fetch('/product/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        // Check if user is not authenticated (redirect response)
        if (response.redirected || response.url.includes('/auth/login')) {
          alert('You must be logged in to publish a product. Please log in first.');
          window.location.href = '/auth/login';
          return;
        }
        
        // Check for authentication issues first
        if (response.status === 302 || response.status === 401 || response.status === 403) {
          Swal.fire({
            icon: 'warning',
            title: 'Authentication Required',
            text: 'You must be logged in to publish a product. Please log in first.',
            confirmButtonColor: '#d97706',
            confirmButtonText: 'Go to Login'
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.href = '/auth/login';
            }
          });
          return;
        }
        
        // Try to parse JSON response
        let data;
        try {
          data = await response.json();
        } catch (error) {
          // If response is not JSON, it might be a redirect or error page
          Swal.fire({
            icon: 'error',
            title: 'Server Error',
            text: 'Server error. Please try again or contact support.',
            confirmButtonColor: '#d97706'
          });
          console.error('Response parsing error:', error);
          return;
        }
        
        if (response.ok && data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Product published successfully!',
            confirmButtonColor: '#d97706',
            confirmButtonText: 'Show Product',
            showCancelButton: true,
            cancelButtonText: 'View All Products',
            cancelButtonColor: '#6b7280'
          }).then((result) => {
            if (result.isConfirmed) {
              // Redirect to individual product page
              window.location.href = `/product/${data.product._id}`;
            } else if (result.dismiss === Swal.DismissReason.cancel) {
              // Redirect to seller dashboard products page
              window.location.href = '/seller-dashboard/products';
            }
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Publish Failed',
            text: 'Failed to publish product: ' + (data.error || 'Unknown error'),
            confirmButtonColor: '#d97706'
          });
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Network Error',
          text: 'An error occurred while publishing the product. Please check your connection and try again.',
          confirmButtonColor: '#d97706'
        });
      }
      this.isPublishing = false;
    }
  }));
});
