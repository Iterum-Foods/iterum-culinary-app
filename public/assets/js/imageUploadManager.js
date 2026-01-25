/**
 * Image Upload Manager for Iterum R&D Chef Notebook
 * Handles image uploads for recipes, ingredients, and recipe development
 */

class ImageUploadManager {
    constructor(options = {}) {
        this.apiBaseUrl = options.apiBaseUrl || '/api';
        this.defaultImageUrl = options.defaultImageUrl || '/static/images/default-placeholder.jpg';
        this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
        this.allowedTypes = options.allowedTypes || ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        this.compressionQuality = options.compressionQuality || 0.8;
        this.token = this.getAuthToken();
    }

    getAuthToken() {
        return localStorage.getItem('authToken') || '';
    }

    /**
     * Validate image file
     */
    validateFile(file) {
        const errors = [];
        
        if (!file) {
            errors.push('No file selected');
            return errors;
        }

        if (!this.allowedTypes.includes(file.type)) {
            errors.push(`File type ${file.type} not allowed. Supported types: ${this.allowedTypes.join(', ')}`);
        }

        if (file.size > this.maxFileSize) {
            errors.push(`File size ${this.formatFileSize(file.size)} exceeds maximum allowed size of ${this.formatFileSize(this.maxFileSize)}`);
        }

        return errors;
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Compress image before upload
     */
    async compressImage(file) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions while maintaining aspect ratio
                const maxWidth = 1920;
                const maxHeight = 1080;
                let { width, height } = img;

                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, 'image/jpeg', this.compressionQuality);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Create image upload interface
     */
    createUploadInterface(container, options = {}) {
        const {
            multiple = false,
            showPreview = true,
            showProgress = true,
            acceptedTypes = this.allowedTypes.join(','),
            placeholder = 'Drag & drop images here or click to browse'
        } = options;

        const html = `
            <div class="image-upload-container" data-multiple="${multiple}">
                <div class="upload-dropzone" ondrop="event.preventDefault(); handleDrop(event, this)" 
                     ondragover="event.preventDefault()" ondragenter="event.preventDefault()">
                    <div class="upload-content">
                        <div class="upload-icon">📷</div>
                        <p class="upload-text">${placeholder}</p>
                        <button type="button" class="upload-button">Choose Files</button>
                        <input type="file" class="upload-input" 
                               accept="${acceptedTypes}" 
                               ${multiple ? 'multiple' : ''} 
                               style="display: none">
                    </div>
                </div>
                ${showProgress ? '<div class="upload-progress" style="display: none;"><div class="progress-bar"></div></div>' : ''}
                ${showPreview ? '<div class="image-preview-container"></div>' : ''}
                <div class="upload-messages"></div>
            </div>
        `;

        container.innerHTML = html;
        this.bindUploadEvents(container);
        return container.querySelector('.image-upload-container');
    }

    /**
     * Bind upload events
     */
    bindUploadEvents(container) {
        const uploadContainer = container.querySelector('.image-upload-container');
        const dropzone = container.querySelector('.upload-dropzone');
        const button = container.querySelector('.upload-button');
        const input = container.querySelector('.upload-input');

        // Button click
        button.addEventListener('click', () => input.click());

        // File input change
        input.addEventListener('change', (e) => {
            this.handleFiles(Array.from(e.target.files), uploadContainer);
        });

        // Drag and drop
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-over');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('drag-over');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files).filter(file => 
                this.allowedTypes.includes(file.type)
            );
            this.handleFiles(files, uploadContainer);
        });
    }

    /**
     * Handle selected files
     */
    async handleFiles(files, container) {
        const multiple = container.dataset.multiple === 'true';
        const previewContainer = container.querySelector('.image-preview-container');
        const messagesContainer = container.querySelector('.upload-messages');

        if (!multiple && files.length > 1) {
            this.showMessage(messagesContainer, 'Only one file allowed', 'error');
            return;
        }

        for (const file of files) {
            const errors = this.validateFile(file);
            if (errors.length > 0) {
                this.showMessage(messagesContainer, errors.join(', '), 'error');
                continue;
            }

            // Show preview
            if (previewContainer) {
                this.showImagePreview(file, previewContainer, !multiple);
            }
        }

        // Store files for upload
        container.pendingFiles = files;
    }

    /**
     * Show image preview
     */
    showImagePreview(file, container, replace = false) {
        if (replace) {
            container.innerHTML = '';
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.createElement('div');
            preview.className = 'image-preview';
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <div class="preview-overlay">
                    <span class="preview-filename">${file.name}</span>
                    <button type="button" class="remove-preview" onclick="this.closest('.image-preview').remove()">×</button>
                </div>
            `;
            container.appendChild(preview);
        };
        reader.readAsDataURL(file);
    }

    /**
     * Show message
     */
    showMessage(container, message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `upload-message upload-message-${type}`;
        messageEl.textContent = message;
        container.appendChild(messageEl);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, 5000);
    }

    /**
     * Upload recipe primary image
     */
    async uploadRecipePrimaryImage(recipeId, file, progressCallback) {
        return this.uploadImage(`${this.apiBaseUrl}/images/recipe/${recipeId}/primary`, file, progressCallback);
    }

    /**
     * Upload recipe gallery images
     */
    async uploadRecipeGalleryImages(recipeId, files, progressCallback) {
        const formData = new FormData();
        for (const file of files) {
            formData.append('files', file);
        }
        return this.uploadFormData(`${this.apiBaseUrl}/images/recipe/${recipeId}/gallery`, formData, progressCallback);
    }

    /**
     * Upload recipe step image
     */
    async uploadRecipeStepImage(recipeId, stepNumber, file, progressCallback) {
        return this.uploadImage(`${this.apiBaseUrl}/images/recipe/${recipeId}/step/${stepNumber}`, file, progressCallback);
    }

    /**
     * Upload ingredient image
     */
    async uploadIngredientImage(ingredientId, file, progressCallback) {
        return this.uploadImage(`${this.apiBaseUrl}/images/ingredient/${ingredientId}/primary`, file, progressCallback);
    }

    /**
     * Generic image upload
     */
    async uploadImage(url, file, progressCallback) {
        const formData = new FormData();
        formData.append('file', file);
        return this.uploadFormData(url, formData, progressCallback);
    }

    /**
     * Upload form data with progress
     */
    async uploadFormData(url, formData, progressCallback) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            if (progressCallback) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        progressCallback(percentComplete);
                    }
                });
            }

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        resolve(xhr.responseText);
                    }
                } else {
                    try {
                        const error = JSON.parse(xhr.responseText);
                        reject(new Error(error.detail || `HTTP ${xhr.status}`));
                    } catch (e) {
                        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                    }
                }
            };

            xhr.onerror = () => reject(new Error('Network error'));

            xhr.open('POST', url);
            if (this.token) {
                xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
            }
            xhr.send(formData);
        });
    }

    /**
     * Get recipe images
     */
    async getRecipeImages(recipeId) {
        const response = await fetch(`${this.apiBaseUrl}/images/recipe/${recipeId}/images`, {
            headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Delete recipe gallery image
     */
    async deleteRecipeGalleryImage(recipeId, filename) {
        const response = await fetch(`${this.apiBaseUrl}/images/recipe/${recipeId}/gallery/${filename}`, {
            method: 'DELETE',
            headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Show progress
     */
    showProgress(container, percent) {
        const progressContainer = container.querySelector('.upload-progress');
        const progressBar = container.querySelector('.progress-bar');
        
        if (progressContainer && progressBar) {
            progressContainer.style.display = 'block';
            progressBar.style.width = `${percent}%`;
            
            if (percent >= 100) {
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                }, 1000);
            }
        }
    }

    /**
     * Create image gallery display
     */
    createImageGallery(container, images, options = {}) {
        const {
            editable = false,
            showThumbnails = true,
            onImageClick = null,
            onImageDelete = null
        } = options;

        const gallery = document.createElement('div');
        gallery.className = 'image-gallery';

        images.forEach((image, index) => {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'gallery-image';
            
            const img = document.createElement('img');
            img.src = showThumbnails && image.thumbnail_url ? image.thumbnail_url : image.url;
            img.alt = `Image ${index + 1}`;
            img.loading = 'lazy';
            
            if (onImageClick) {
                img.addEventListener('click', () => onImageClick(image, index));
                img.style.cursor = 'pointer';
            }

            imageContainer.appendChild(img);

            if (editable && onImageDelete) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-image-btn';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = 'Delete image';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onImageDelete(image, index);
                });
                imageContainer.appendChild(deleteBtn);
            }

            gallery.appendChild(imageContainer);
        });

        container.innerHTML = '';
        container.appendChild(gallery);
        return gallery;
    }
}

// Global instance
window.imageUploadManager = new ImageUploadManager();

// CSS styles for image upload components
const imageUploadStyles = `
<style>
.image-upload-container {
    margin: 1rem 0;
}

.upload-dropzone {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    transition: all 0.3s ease;
    background: #fafafa;
}

.upload-dropzone:hover,
.upload-dropzone.drag-over {
    border-color: #4a90e2;
    background: #f0f7ff;
}

.upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.upload-icon {
    font-size: 3rem;
    color: #666;
}

.upload-text {
    margin: 0;
    color: #666;
    font-size: 1.1rem;
}

.upload-button {
    background: #4a90e2;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.3s ease;
}

.upload-button:hover {
    background: #357abd;
}

.upload-progress {
    margin: 1rem 0;
    background: #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
}

.progress-bar {
    height: 4px;
    background: #4a90e2;
    transition: width 0.3s ease;
    width: 0%;
}

.image-preview-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin: 1rem 0;
}

.image-preview {
    position: relative;
    width: 120px;
    height: 120px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.preview-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.8));
    color: white;
    padding: 0.5rem;
    font-size: 0.8rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}

.preview-filename {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.remove-preview {
    background: none;
    border: none;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0;
    margin-left: 0.5rem;
}

.upload-messages {
    margin: 1rem 0;
}

.upload-message {
    padding: 0.75rem;
    border-radius: 4px;
    margin: 0.5rem 0;
    font-size: 0.9rem;
}

.upload-message-info {
    background: #e3f2fd;
    color: #1565c0;
    border: 1px solid #bbdefb;
}

.upload-message-success {
    background: #e8f5e8;
    color: #2e7d32;
    border: 1px solid #c8e6c9;
}

.upload-message-error {
    background: #ffebee;
    color: #c62828;
    border: 1px solid #ffcdd2;
}

.image-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    margin: 1rem 0;
}

.gallery-image {
    position: relative;
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}

.gallery-image:hover {
    transform: scale(1.05);
}

.gallery-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.delete-image-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: rgba(0,0,0,0.7);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.gallery-image:hover .delete-image-btn {
    opacity: 1;
}

.delete-image-btn:hover {
    background: rgba(220, 53, 69, 0.9);
}
</style>
`;

// Inject styles
if (!document.querySelector('#image-upload-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'image-upload-styles';
    styleElement.innerHTML = imageUploadStyles;
    document.head.appendChild(styleElement);
} 