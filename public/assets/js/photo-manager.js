/**
 * Recipe Photo Management System
 * Handles photo uploads, storage, galleries for recipes, ingredients, tools, and steps
 */

class PhotoManager {
  constructor() {
    this.storageKey = 'recipe_photos';
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    this.compressionQuality = 0.8;
    this.init();
  }

  init() {
    console.log('📸 Photo Manager initialized');
  }

  /**
   * Upload photo(s) with drag & drop support
   */
  async uploadPhotos(files, options = {}) {
    const {
      recipeId,
      stepNumber,
      ingredientId,
      equipmentId,
      type = 'recipe' // 'recipe', 'step', 'ingredient', 'equipment'
    } = options;

    const uploadedPhotos = [];

    for (const file of files) {
      try {
        // Validate file
        if (!this.validateFile(file)) {
          console.warn('Invalid file:', file.name);
          continue;
        }

        // Compress and convert to base64
        const compressedPhoto = await this.compressImage(file);

        // Create photo object
        const photo = {
          id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: type,
          recipeId: recipeId,
          stepNumber: stepNumber,
          ingredientId: ingredientId,
          equipmentId: equipmentId,
          filename: file.name,
          dataUrl: compressedPhoto,
          mimeType: file.type,
          size: file.size,
          caption: '',
          uploadedAt: new Date().toISOString()
        };

        // Save photo
        await this.savePhoto(photo);
        uploadedPhotos.push(photo);

        console.log('✅ Photo uploaded:', photo.id);

      } catch (error) {
        console.error('❌ Error uploading photo:', error);
      }
    }

    // Track analytics
    if (window.analyticsTracker && uploadedPhotos.length > 0) {
      window.analyticsTracker.trackCustomEvent('photos_uploaded', {
        count: uploadedPhotos.length,
        type: type,
        recipe_id: recipeId
      });
    }

    return uploadedPhotos;
  }

  /**
   * Validate file
   */
  validateFile(file) {
    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      alert(`File type not supported: ${file.type}\nAllowed: JPG, PNG, WebP, GIF`);
      return false;
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      alert(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB\nMaximum: ${this.maxFileSize / 1024 / 1024}MB`);
      return false;
    }

    return true;
  }

  /**
   * Compress image to reduce storage
   */
  async compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if too large (max 1200px width)
          const maxWidth = 1200;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64
          const dataUrl = canvas.toDataURL(file.type, this.compressionQuality);
          resolve(dataUrl);
        };

        img.onerror = reject;
        img.src = e.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Save photo to storage
   */
  async savePhoto(photo) {
    const photos = this.getAllPhotos();
    photos.push(photo);
    localStorage.setItem(this.storageKey, JSON.stringify(photos));
    console.log('💾 Photo saved:', photo.id);
  }

  /**
   * Get all photos
   */
  getAllPhotos() {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Get photos for a specific recipe
   */
  getRecipePhotos(recipeId) {
    const allPhotos = this.getAllPhotos();
    return allPhotos.filter(p => p.recipeId === recipeId && p.type === 'recipe');
  }

  /**
   * Get photos for a specific step
   */
  getStepPhotos(recipeId, stepNumber) {
    const allPhotos = this.getAllPhotos();
    return allPhotos.filter(p => 
      p.recipeId === recipeId && 
      p.type === 'step' && 
      p.stepNumber === stepNumber
    );
  }

  /**
   * Get photo for ingredient
   */
  getIngredientPhoto(ingredientId) {
    const allPhotos = this.getAllPhotos();
    return allPhotos.find(p => p.ingredientId === ingredientId && p.type === 'ingredient');
  }

  /**
   * Get photo for equipment
   */
  getEquipmentPhoto(equipmentId) {
    const allPhotos = this.getAllPhotos();
    return allPhotos.find(p => p.equipmentId === equipmentId && p.type === 'equipment');
  }

  /**
   * Delete photo
   */
  deletePhoto(photoId) {
    const photos = this.getAllPhotos();
    const filtered = photos.filter(p => p.id !== photoId);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    console.log('🗑️ Photo deleted:', photoId);
  }

  /**
   * Update photo caption
   */
  updateCaption(photoId, caption) {
    const photos = this.getAllPhotos();
    const photo = photos.find(p => p.id === photoId);
    if (photo) {
      photo.caption = caption;
      localStorage.setItem(this.storageKey, JSON.stringify(photos));
      console.log('✏️ Caption updated:', photoId);
    }
  }

  /**
   * Set primary photo for recipe
   */
  setPrimaryPhoto(recipeId, photoId) {
    const photos = this.getAllPhotos();
    
    // Clear any existing primary
    photos.forEach(p => {
      if (p.recipeId === recipeId && p.type === 'recipe') {
        p.isPrimary = false;
      }
    });

    // Set new primary
    const photo = photos.find(p => p.id === photoId);
    if (photo) {
      photo.isPrimary = true;
      localStorage.setItem(this.storageKey, JSON.stringify(photos));
      console.log('⭐ Primary photo set:', photoId);
    }
  }

  /**
   * Get primary photo for recipe
   */
  getPrimaryPhoto(recipeId) {
    const photos = this.getRecipePhotos(recipeId);
    return photos.find(p => p.isPrimary) || photos[0];
  }

  /**
   * Create photo upload UI
   */
  createUploadUI(options = {}) {
    const {
      recipeId,
      stepNumber,
      ingredientId,
      equipmentId,
      type = 'recipe',
      multiple = true,
      onUpload = null
    } = options;

    const uploadId = `upload_${Date.now()}`;

    const html = `
      <div class="photo-upload-zone" id="${uploadId}">
        <input type="file" 
               id="${uploadId}_input" 
               accept="image/*" 
               ${multiple ? 'multiple' : ''}
               style="display: none;">
        
        <div class="upload-dropzone" id="${uploadId}_dropzone">
          <div class="upload-icon">📸</div>
          <div class="upload-text">
            <div class="upload-title">Drop photos here or click to browse</div>
            <div class="upload-subtitle">JPG, PNG, WebP, GIF - Max 5MB each</div>
          </div>
          <button type="button" class="btn btn-primary" onclick="document.getElementById('${uploadId}_input').click()">
            Choose Photos
          </button>
        </div>

        <div class="upload-preview" id="${uploadId}_preview"></div>
      </div>
    `;

    // Setup event listeners after DOM insertion
    setTimeout(() => {
      const input = document.getElementById(`${uploadId}_input`);
      const dropzone = document.getElementById(`${uploadId}_dropzone`);
      const preview = document.getElementById(`${uploadId}_preview`);

      if (input && dropzone) {
        // File input change
        input.addEventListener('change', async (e) => {
          const files = Array.from(e.target.files);
          const uploaded = await this.uploadPhotos(files, {
            recipeId, stepNumber, ingredientId, equipmentId, type
          });
          
          if (onUpload) onUpload(uploaded);
          this.showPreview(uploaded, preview);
        });

        // Drag & drop
        dropzone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
          dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', async (e) => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
          
          const files = Array.from(e.dataTransfer.files);
          const uploaded = await this.uploadPhotos(files, {
            recipeId, stepNumber, ingredientId, equipmentId, type
          });
          
          if (onUpload) onUpload(uploaded);
          this.showPreview(uploaded, preview);
        });
      }
    }, 100);

    return html;
  }

  /**
   * Show photo preview
   */
  showPreview(photos, container) {
    if (!container) return;

    const html = photos.map(photo => `
      <div class="photo-preview-item" data-photo-id="${photo.id}">
        <img src="${photo.dataUrl}" alt="${photo.filename}">
        <div class="photo-preview-overlay">
          <button class="btn-sm btn-danger" onclick="window.photoManager.deletePhoto('${photo.id}')">
            🗑️
          </button>
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  /**
   * Create photo gallery
   */
  createGallery(photos, options = {}) {
    const { showCaptions = true, allowDelete = true, allowPrimary = true } = options;

    if (!photos || photos.length === 0) {
      return '<div class="empty-gallery"><p>No photos yet</p></div>';
    }

    return `
      <div class="photo-gallery">
        ${photos.map(photo => `
          <div class="gallery-item ${photo.isPrimary ? 'primary' : ''}" data-photo-id="${photo.id}">
            <img src="${photo.dataUrl}" alt="${photo.caption || photo.filename}" 
                 onclick="window.photoManager.viewFullScreen('${photo.id}')">
            ${photo.isPrimary ? '<div class="primary-badge">⭐ Primary</div>' : ''}
            ${showCaptions ? `
              <div class="photo-caption">
                <input type="text" 
                       value="${photo.caption || ''}" 
                       placeholder="Add caption..."
                       onchange="window.photoManager.updateCaption('${photo.id}', this.value)">
              </div>
            ` : ''}
            <div class="photo-actions">
              ${allowPrimary && !photo.isPrimary ? `
                <button class="btn-sm btn-secondary" onclick="window.photoManager.setPrimaryPhoto('${photo.recipeId}', '${photo.id}')">
                  ⭐ Set Primary
                </button>
              ` : ''}
              ${allowDelete ? `
                <button class="btn-sm btn-danger" onclick="window.photoManager.deletePhoto('${photo.id}')">
                  🗑️ Delete
                </button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * View photo in fullscreen
   */
  viewFullScreen(photoId) {
    const photos = this.getAllPhotos();
    const photo = photos.find(p => p.id === photoId);

    if (!photo) return;

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'photo-fullscreen-modal';
    modal.innerHTML = `
      <div class="fullscreen-backdrop" onclick="this.parentElement.remove()"></div>
      <div class="fullscreen-content">
        <button class="fullscreen-close" onclick="this.parentElement.parentElement.remove()">✕</button>
        <img src="${photo.dataUrl}" alt="${photo.caption || photo.filename}">
        ${photo.caption ? `<div class="fullscreen-caption">${photo.caption}</div>` : ''}
      </div>
    `;

    document.body.appendChild(modal);
  }

  /**
   * Create step photo integration
   */
  createStepPhotoUI(recipeId, stepNumber) {
    const photos = this.getStepPhotos(recipeId, stepNumber);

    return `
      <div class="step-photo-section">
        <div class="step-photo-header">
          <h4>📸 Step Photos</h4>
          <button class="btn btn-sm btn-primary" onclick="window.photoManager.showStepPhotoUpload('${recipeId}', ${stepNumber})">
            ➕ Add Photo
          </button>
        </div>
        ${photos.length > 0 ? `
          <div class="step-photo-gallery">
            ${photos.map(photo => `
              <div class="step-photo-item">
                <img src="${photo.dataUrl}" alt="Step ${stepNumber}" onclick="window.photoManager.viewFullScreen('${photo.id}')">
                <button class="btn-delete-mini" onclick="window.photoManager.deletePhoto('${photo.id}')">✕</button>
              </div>
            `).join('')}
          </div>
        ` : '<p class="text-muted">No photos for this step yet</p>'}
      </div>
    `;
  }

  /**
   * Show upload modal for step photo
   */
  showStepPhotoUpload(recipeId, stepNumber) {
    const modal = document.createElement('div');
    modal.className = 'photo-upload-modal';
    modal.innerHTML = `
      <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>📸 Add Photo to Step ${stepNumber}</h3>
          <button class="modal-close" onclick="this.parentElement.parentElement.remove()">✕</button>
        </div>
        <div class="modal-body">
          ${this.createUploadUI({
            recipeId,
            stepNumber,
            type: 'step',
            multiple: true,
            onUpload: (photos) => {
              console.log('Photos uploaded for step:', photos);
              modal.remove();
              // Refresh the recipe view
              if (typeof refreshRecipeView === 'function') {
                refreshRecipeView();
              }
            }
          })}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  /**
   * Get storage usage
   */
  getStorageInfo() {
    const photos = this.getAllPhotos();
    const totalSize = photos.reduce((sum, p) => sum + (p.dataUrl?.length || 0), 0);
    
    return {
      photoCount: photos.length,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      byType: {
        recipe: photos.filter(p => p.type === 'recipe').length,
        step: photos.filter(p => p.type === 'step').length,
        ingredient: photos.filter(p => p.type === 'ingredient').length,
        equipment: photos.filter(p => p.type === 'equipment').length
      }
    };
  }

  /**
   * Clear all photos for a recipe
   */
  clearRecipePhotos(recipeId) {
    if (!confirm('Delete all photos for this recipe?')) {
      return;
    }

    const photos = this.getAllPhotos();
    const filtered = photos.filter(p => p.recipeId !== recipeId);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    console.log('🗑️ Cleared photos for recipe:', recipeId);
  }

  /**
   * Export photos as ZIP (future enhancement)
   */
  async exportPhotos(recipeId) {
    const photos = this.getRecipePhotos(recipeId);
    
    if (photos.length === 0) {
      alert('No photos to export');
      return;
    }

    // For now, just download individually
    for (const photo of photos) {
      const link = document.createElement('a');
      link.href = photo.dataUrl;
      link.download = photo.filename;
      link.click();
    }

    console.log('📥 Exported', photos.length, 'photos');
  }
}

// Initialize global instance
window.photoManager = new PhotoManager();

console.log('📸 Photo Manager loaded');

