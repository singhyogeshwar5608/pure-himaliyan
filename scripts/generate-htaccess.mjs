import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '..', 'dist')

const htaccess = `RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Remove www
RewriteCond %{HTTP_HOST} ^www\\.(.*)$ [NC]
RewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]

# Laravel API routing
RewriteRule ^api/(.*)$ backend/public/index.php [L]

# Dynamic sitemap
RewriteRule ^sitemap.xml$ backend/public/index.php [L]

# Serve existing files/directories directly
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# React SPA fallback — everything else goes to index.html
RewriteRule ^ index.html [L]

# Security: deny access to dot-files
<FilesMatch "^\.">
    Require all denied
</FilesMatch>
`

writeFileSync(resolve(distDir, '.htaccess'), htaccess, 'utf-8')
console.log('✓ .htaccess generated in dist/')
