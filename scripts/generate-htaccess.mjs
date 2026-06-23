import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '..', 'dist')

const htaccess = `RewriteEngine On
RewriteBase /

# Redirect trailing slashes
RewriteRule ^(.+)/$ /$1 [L,R=301]

# Serve existing files/directories directly
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Rewrite everything else to index.html (SPA)
RewriteRule . /index.html [L]

# Security
<FilesMatch "^\.">
    Require all denied
</FilesMatch>
`

writeFileSync(resolve(distDir, '.htaccess'), htaccess, 'utf-8')
console.log('✓ .htaccess generated in dist/')
