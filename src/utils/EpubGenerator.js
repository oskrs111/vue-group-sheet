import JSZip from 'jszip'
import { h, render } from 'vue'
import EpubPage from '../components/EpubPage.vue'

export class EpubGenerator {
  constructor(collectionName, songs) {
    this.collectionName = collectionName
    this.songs = songs
    this.zip = new JSZip()
    this.uuid = `urn:uuid:${crypto.randomUUID()}`
  }

  async generateKeyFile(fileType) {
    // Generador de archivos básicos
    if (fileType === 'mimetype') {
      return 'application/epub+zip'
    }
    return ''
  }

  // New method for image-based generation
  async generateFromImages(imageBlobs) {
    // 1. mimetype
    this.zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

    // 2. META-INF/container.xml
    this.zip.folder('META-INF').file('container.xml', `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`)

    // 3. OEBPS folder
    const oebps = this.zip.folder('OEBPS')
    const imgFolder = oebps.folder('images')

    // Styles (minimal for image containment)
    oebps.file('styles.css', `
      @page { margin: 0; }
      body { margin: 0; padding: 0; text-align: center; background-color: white; }
      .page-image { max-width: 100%; height: auto; max-height: 100vh; display: block; margin: 0 auto; }
      .cover { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; }
      .cover-title { font-size: 3em; font-weight: bold; margin-bottom: 20px; }
      .cover-info { font-size: 1.2em; }
    `)

    // Cover Page
    oebps.file('cover.xhtml', this.generateCoverXhtml())

    // Save Images and Generate XHTML wrappers
    imageBlobs.forEach((blob, index) => {
      const filename = `song-${index + 1}.jpg`
      imgFolder.file(filename, blob)

      const xhtml = this.generateImageXhtml(filename, this.songs[index]?.header?.center?.top?.name || `Song ${index + 1}`)
      oebps.file(`song-${index + 1}.xhtml`, xhtml)
    })

    // TOC (ncx)
    oebps.file('toc.ncx', this.generateNCX())

    // CONTENT.OPF (Manifest & Spine) - Special version for images
    oebps.file('content.opf', this.generateOPF(true))

    return await this.zip.generateAsync({ type: 'blob' })
  }

  generateImageXhtml(imageFilename, title) {
    return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${title}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body>
  <div>
    <img src="images/${imageFilename}" alt="${title}" class="page-image"/>
  </div>
</body>
</html>`
  }

  async generate() {
    // 1. mimetype (must be first and uncompressed)
    this.zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

    // 2. META-INF/container.xml
    this.zip.folder('META-INF').file('container.xml', `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`)

    // 3. OEBPS folder
    const oebps = this.zip.folder('OEBPS')

    // Styles
    const cssContent = await this.extractStyles()
    oebps.file('styles.css', cssContent)

    // Cover Page
    oebps.file('cover.xhtml', this.generateCoverXhtml())

    // Generate XHTML for each song
    this.songs.forEach((song, index) => {
      const xhtml = this.renderSongToXhtml(song, index + 1)
      oebps.file(`song-${index + 1}.xhtml`, xhtml)
    })

    // TOC (ncx) for legacy support and convenience
    oebps.file('toc.ncx', this.generateNCX())

    // CONTENT.OPF (Manifest & Spine)
    oebps.file('content.opf', this.generateOPF())

    // Generate ZIP blob
    return await this.zip.generateAsync({ type: 'blob' })
  }

  generateCoverXhtml() {
    const dateStr = new Date().toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric'
    })

    return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Portada</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
  <style>
    .cover {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      text-align: center;
    }
    .cover-title {
      font-size: 3em;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .cover-date {
      font-size: 1.2em;
      margin-bottom: 10px;
    }
    .cover-count {
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="cover">
    <h1 class="cover-title">${this.collectionName}</h1>
    <p class="cover-info">Exportado el ${dateStr}</p>
    <p class="cover-count">${this.songs.length} canciones</p>
  </div>
</body>
</html>`
  }

  async extractStyles() {
    // Basic CSS for EPUB
    // In a real scenario, we might want to extract styles from the component dynamically
    // For now, we manually include critical styles from EpubPage.vue and resets
    return `
      @page { margin: 10px; }
      body { margin: 0; padding: 0; font-family: "Libre Baskerville", serif; background: white; }
      .epub-page-wrapper { width: 100%; }
      .epub-sheet-page { padding: 10px; box-sizing: border-box; }
      
      /* Headers */
      .epub-header { display: flex; justify-content: space-between; border-bottom: 2px solid #ccc; margin-bottom: 20px; padding-bottom: 10px; }
      .header-center { text-align: center; flex: 1; }
      .song-title { font-size: 1.8em; font-weight: bold; margin: 0; }
      .tempo, .signature, .tone { font-weight: bold; font-size: 1.2em; }

      /* Sections & Compass */
      .epub-section { display: flex; margin-bottom: 15px; border: 1px solid #ccc; page-break-inside: avoid; }
      .section-id-container { padding: 10px; border-right: 1px solid #eee; display: flex; align-items: center; justify-content: center; min-width: 50px; }
      .section-id { font-size: 2em; font-weight: bold; }
      .section-content { padding: 5px; flex: 1; }
      .compass-container { display: flex; flex-wrap: wrap; }
      
      .epub-compass { 
        flex: 1 0 calc(12.5% - 4px); /* Max 8 per row */
        border: 1px solid #666; 
        min-width: 50px; 
        margin: 2px; 
        padding: 5px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
      }
      .epub-compass.space-compass { border-color: transparent; }

      .chords-display { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; }
      .epub-chord { display: flex; flex-direction: column; align-items: center; }
      .chord-note { font-weight: bold; font-size: 1.2em; font-family: monospace; }
      .duration-symbol { min-height: 1em; font-size: 0.8em; }
      .repeat-symbol { font-size: 1.5em; font-weight: bold; }
      
      /* Structure */
      .epub-structure { margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; }
      .structure-items { display: flex; gap: 5px; flex-wrap: wrap; }
      .structure-item { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border: 2px solid #333; font-weight: bold; }

      /* Notes */
      .epub-notes { margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; font-style: italic; }
    `
  }

  renderSongToXhtml(song, index) {
    // Crear un contenedor temporal para renderizar el componente Vue
    const container = document.createElement('div')

    // Renderizar EpubPage con los datos de la canción
    const vnode = h(EpubPage, { sheetData: song })
    render(vnode, container)

    // Obtener HTML
    const contentHtml = container.shadowRoot ? container.shadowRoot.innerHTML : container.innerHTML

    // Limpieza (opcional, pero buena práctica)
    render(null, container)

    return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${song.header.center.top.name || 'Canción ' + index}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  ${contentHtml}
</body>
</html>`
  }

  generateOPF(isImageBased = false) {
    let manifestItems = `
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="style" href="styles.css" media-type="text/css"/>
    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>
    `
    let spineItems = `<itemref idref="cover"/>\n`

    this.songs.forEach((song, index) => {
      const id = `song-${index + 1}`
      // Add XHTML item
      manifestItems += `<item id="${id}" href="${id}.xhtml" media-type="application/xhtml+xml"/>\n`

      // Add Image item if valid
      if (isImageBased) {
        manifestItems += `<item id="${id}-img" href="images/${id}.jpg" media-type="image/jpeg"/>\n`
      }

      spineItems += `<itemref idref="${id}"/>\n`
    })

    return `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${this.collectionName}</dc:title>
    <dc:creator opf:role="aut">Group Sheet Editor</dc:creator>
    <dc:language>es</dc:language>
    <dc:identifier id="BookId" opf:scheme="UUID">${this.uuid}</dc:identifier>
  </metadata>
  <manifest>
    ${manifestItems}
  </manifest>
  <spine toc="ncx">
    ${spineItems}
  </spine>
  <guide>
    <reference type="cover" title="Cover" href="cover.xhtml" />
  </guide>
</package>`
  }

  generateNCX() {
    let navPoints = `
    <navPoint id="navPoint-0" playOrder="0">
      <navLabel>
        <text>Portada</text>
      </navLabel>
      <content src="cover.xhtml"/>
    </navPoint>`

    this.songs.forEach((song, index) => {
      const playOrder = index + 1
      navPoints += `
    <navPoint id="navPoint-${playOrder}" playOrder="${playOrder}">
      <navLabel>
        <text>${song.header.center.top.name || 'Canción ' + playOrder}</text>
      </navLabel>
      <content src="song-${playOrder}.xhtml"/>
    </navPoint>`
    })

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${this.uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${this.collectionName}</text>
  </docTitle>
  <navMap>
    ${navPoints}
  </navMap>
</ncx>`
  }
}
