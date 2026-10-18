import JSZip from 'jszip'
import { h, render, nextTick } from 'vue'
import EpubPage from '../components/EpubPage.vue'
import scoreLayoutCSS from '../styles/score-layout.css?raw'
import { prepareScoreExport } from './scoreLayout'
import { localChordFont, chordFontFace } from './localChordFont'
import appLogoUrl from '../asset/gse_logo_256x256.png'
import regularFontUrl from '../asset/fonts/LibreBaskerville-Regular.ttf'
import boldFontUrl from '../asset/fonts/LibreBaskerville-Bold.ttf'
import italicFontUrl from '../asset/fonts/LibreBaskerville-Italic.ttf'

const epubFonts = [
  ['regular', regularFontUrl], ['bold', boldFontUrl], ['italic', italicFontUrl]
]

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
    await this.addAppLogo(imgFolder)

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
    await this.addAppLogo(oebps.folder('images'))
    for (const [name, url] of epubFonts) {
      const response = await fetch(url)
      if (!response.ok) throw new Error('No se pudo cargar la fuente de la partitura')
      oebps.folder('fonts').file(`${name}.ttf`, await response.blob())
    }
    if (localChordFont) {
      const response = await fetch(localChordFont.url)
      if (!response.ok) throw new Error('No se pudo cargar la fuente de acordes')
      oebps.folder('fonts').file(localChordFont.filename, await response.blob())
      oebps.folder('fonts').file('recovered-chords-OFL.txt', localChordFont.license)
    }

    // Styles
    const cssContent = await this.extractStyles()
    oebps.file('styles.css', cssContent)

    // Cover Page
    oebps.file('cover.xhtml', this.generateCoverXhtml())

    // Generate XHTML for each song
    for (const [index, song] of this.songs.entries()) {
      const xhtml = await this.renderSongToXhtml(song, index + 1)
      oebps.file(`song-${index + 1}.xhtml`, xhtml)
    }

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

    // Generate song list HTML
    const songListHtml = this.songs.map((song, index) => {
      const name = song.header?.center?.top?.name || 'Sin Título'
      const author = song.header?.center?.bottom?.author || 'Desconocido'
      return `<li><span class="song-index">${index + 1}.</span><strong>${name}</strong> - ${author}</li>`
    }).join('\n')

    return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Portada</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
  <style>
    .cover {
      box-sizing: border-box;
      min-height: 100vh;
      text-align: center;
      padding: 6vh 7% 3vh;
    }
    .cover-title {
      font-size: 2em;
      font-weight: bold;
      margin: 0 0 0.35em;
    }
    .cover-info, .cover-date {
      font-size: 0.85em;
      margin: 0.35em 0;
    }
    .cover-count {
      font-style: italic;
      margin-bottom: 1.5em;
    }
    .song-list {
      list-style-type: none;
      padding: 0;
      margin: 0;
      text-align: left;
      column-count: 2;
      column-gap: 2em;
    }
    .song-list li {
      break-inside: avoid;
      font-size: 0.76em;
      line-height: 1.35;
      margin-bottom: 0.2em;
    }
    .song-index {
      display: inline-block;
      width: 2.5em;
      margin-right: 0.45em;
      text-align: right;
      font-weight: bold;
    }
    .cover-footer {
      margin-top: 2em;
      padding-top: 0.7em;
      border-top: 1px solid #999;
      color: #444;
      font-size: 0.72em;
    }
    .cover-footer img {
      width: 2.4em;
      height: 2.4em;
      margin-right: 0.55em;
      vertical-align: middle;
    }
  </style>
</head>
<body>
  <div class="cover">
    <h1 class="cover-title">${this.collectionName}</h1>
    <p class="cover-info">Exportado el ${dateStr}</p>
    <p class="cover-count">${this.songs.length} canciones</p>
    
    <ul class="song-list">
      ${songListHtml}
    </ul>
    <div class="cover-footer"><img src="images/group-sheet-logo.png" alt="Group Sheet Editor" />Group Sheet Editor</div>
  </div>
</body>
</html>`
  }

  async addAppLogo(imagesFolder) {
    const response = await fetch(appLogoUrl)
    if (!response.ok) throw new Error('No se pudo cargar el logotipo de Group Sheet Editor')
    imagesFolder.file('group-sheet-logo.png', await response.blob())
  }

  async extractStyles() {
    // Score metrics come from the same stylesheet used by the live renderer.
    return `
      @font-face { font-family: 'Libre Baskerville'; src: url('fonts/regular.ttf'); font-weight: 400; }
      @font-face { font-family: 'Libre Baskerville'; src: url('fonts/bold.ttf'); font-weight: 700; }
      @font-face { font-family: 'Libre Baskerville'; src: url('fonts/italic.ttf'); font-weight: 400; font-style: italic; }
      ${localChordFont ? chordFontFace(`fonts/${localChordFont.filename}`) : ''}
      @page { margin: 10px; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { margin: 0; padding: 0; font-family: "Libre Baskerville", serif; background: white; }
      .epub-page-wrapper { width: 100%; }
      
      /* Headers */
      .epub-header { display: flex; justify-content: space-between; border-bottom: 2px solid #ccc; margin-bottom: 20px; padding-bottom: 10px; }
      .header-center { text-align: center; flex: 1; }
      .song-title { font-size: 1.8em; font-weight: bold; margin: 0; }
      .tempo, .signature, .tone { font-weight: bold; font-size: 1.2em; }

      ${scoreLayoutCSS}

      /* Structure */
      .epub-structure { margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; }
      .structure-items { display: flex; gap: 5px; flex-wrap: wrap; }
      .structure-item { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border: 2px solid #333; font-weight: bold; }

      /* Notes */
      .epub-notes { margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; font-style: italic; }
    `
  }

  async renderSongToXhtml(song, index) {
    // Crear un contenedor temporal para renderizar el componente Vue
    const container = document.createElement('div')

    container.style.cssText = `position:fixed;left:-10000px;top:0;visibility:hidden;width:${song.settings.page_orientation === 'V' ? '210mm' : '297mm'}`
    document.body.append(container)
    let contentHtml
    try {
      render(h(EpubPage, { sheetData: song }), container)
      await nextTick()
      await prepareScoreExport(container)
      contentHtml = container.innerHTML
    } finally {
      render(null, container)
      container.remove()
    }

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
    <item id="app-logo" href="images/group-sheet-logo.png" media-type="image/png"/>
    `
    let spineItems = `<itemref idref="cover"/>\n`

    if (!isImageBased) {
      for (const [name] of epubFonts) {
        manifestItems += `<item id="font-${name}" href="fonts/${name}.ttf" media-type="application/vnd.ms-opentype"/>\n`
      }
      if (localChordFont) manifestItems += `<item id="font-chords" href="fonts/${localChordFont.filename}" media-type="${localChordFont.format === 'woff2' ? 'font/woff2' : 'application/vnd.ms-opentype'}"/>\n<item id="font-chords-license" href="fonts/recovered-chords-OFL.txt" media-type="text/plain"/>\n`
    }

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
