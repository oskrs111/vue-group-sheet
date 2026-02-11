import { defineStore } from 'pinia'
import md5 from 'md5'

const defaultSettings = {
  b_color_default: '#f0f0f0',
  f_color_default: '#000000',
  shape_default: 'S',
  page_orientation: 'V',
  font_family: 'Libre Baskerville',
  show_notes: false,
  show_lyrics: false,
  zoom_sections: 100,
  zoom_structure: 100
}

export const useSheetStore = defineStore('sheet', {
  state: () => ({
    currentSongId: null,
    header: {
      left: {
        top: { tempo: '120' },
        bottom: { signature: '4/4' }
      },
      center: {
        top: { name: '' },
        bottom: { author: '' }
      },
      right: {
        top: { tone: 'C' }
      }
    },
    body: [
      {
        id: 'A',
        b_color: '#f0f0f0',
        f_color: '#000000',
        compass: [
          {
            chords: [
              { chord: 'C', div: 3 }
            ]
          }
        ]
      }
    ],
    structure: [
      { id: 'A', b_color: '#f0f0f0', f_color: '#000000', shape: 'S' }
    ],
    notes: [],
    settings: { ...defaultSettings },
    copiedSection: null,
    copiedCompass: null,
    selectedSectionId: null,
    selectedStructureIndex: null,
    selectedCompass: null,
    exportFooterData: null
  }),

  actions: {
    updateExportFooter(data) {
      this.exportFooterData = data
    },

    setSelectedStructureIndex(index) {
      this.selectedStructureIndex = index
      if (index !== null) {
        this.selectedSectionId = null
        this.selectedCompass = null
      }
    },

    moveStructureItem(fromIndex, toIndex) {
      if (toIndex < 0 || toIndex >= this.structure.length) return

      const item = this.structure[fromIndex]
      this.structure.splice(fromIndex, 1)
      this.structure.splice(toIndex, 0, item)

      // Update selection if needed
      if (this.selectedStructureIndex === fromIndex) {
        this.selectedStructureIndex = toIndex
      } else if (this.selectedStructureIndex === toIndex) {
        this.selectedStructureIndex = fromIndex // Swapped logic roughly
      }

      this.saveToLocalStorage()
    },

    addStructureItemAt(index, side) { // side: 'left' (before) or 'right' (after)
      if (this.body.length === 0) return

      const firstSection = this.body[0]
      const newItem = {
        id: firstSection.id,
        b_color: firstSection.b_color,
        f_color: firstSection.f_color,
        shape: this.settings.shape_default,
        lyric: '',
        isBreak: false
      }

      const insertIndex = side === 'left' ? index : index + 1
      this.structure.splice(insertIndex, 0, newItem)

      // Select the new item
      this.selectedStructureIndex = insertIndex
      this.selectedSectionId = null
      this.selectedCompass = null

      this.saveToLocalStorage()
    },

    deleteStructureItem(index) {
      this.structure.splice(index, 1)
      if (this.selectedStructureIndex === index) {
        this.selectedStructureIndex = null
      } else if (this.selectedStructureIndex > index) {
        this.selectedStructureIndex--
      }
      this.saveToLocalStorage()
    },

    updateTempo(value) {
      this.header.left.top.tempo = value
      this.saveToLocalStorage()
    },

    updateSignature(value) {
      this.header.left.bottom.signature = value
      this.saveToLocalStorage()
    },

    updateName(value) {
      this.header.center.top.name = value
      this.saveToLocalStorage()
    },

    updateAuthor(value) {
      this.header.center.bottom.author = value
      this.saveToLocalStorage()
    },

    updateTone(value) {
      this.header.right.top.tone = value
      this.saveToLocalStorage()
    },

    addSection() {
      const existingIds = this.body.map(s => s.id)
      let candidate = ''
      let counter = 0

      // Buscar el primer ID disponible: A, B, C... Z, A1, B1...
      while (true) {
        if (counter < 26) {
          candidate = String.fromCharCode(65 + counter)
        } else {
          const char = String.fromCharCode(65 + (counter % 26))
          const num = Math.floor(counter / 26)
          candidate = char + num
        }

        if (!existingIds.includes(candidate)) {
          break
        }
        counter++
      }

      this.body.push({
        id: candidate,
        b_color: this.settings.b_color_default,
        f_color: this.settings.f_color_default,
        turns: 1,
        compass: [
          {
            chords: [
              { chord: 'C', div: 3 }
            ]
          }
        ]
      })
      this.saveToLocalStorage()
    },

    updateSection(index, data) {
      // Validar unicidad del ID si se está cambiando
      if (data.id && data.id !== this.body[index].id) {
        const idExists = this.body.some((s, i) => i !== index && s.id === data.id)
        if (idExists) {
          console.warn(`ID ${data.id} ya existe. Cancelando actualización de ID.`)
          // Eliminamos el ID de la data para que no se actualice, pero permitimos el resto
          delete data.id
        }
      }

      // Crear copia profunda para evitar referencias compartidas
      const currentSection = JSON.parse(JSON.stringify(this.body[index]))
      const newData = JSON.parse(JSON.stringify(data))
      this.body[index] = { ...currentSection, ...newData }

      // Update structure references
      this.structure.forEach(item => {
        if (item.id === currentSection.id) { // Use original ID to find items
          // If ID changed, update it
          if (newData.id) {
            item.id = newData.id
          }
          item.b_color = data.b_color || item.b_color
          item.f_color = data.f_color || item.f_color
        }
      })
      this.saveToLocalStorage()
    },

    deleteSection(index) {
      const sectionId = this.body[index].id
      this.body.splice(index, 1)
      // Remove from structure
      this.structure = this.structure.filter(item => item.id !== sectionId)

      // Clear selections if necessary
      if (this.selectedSectionId === sectionId) {
        this.selectedSectionId = null
      }
      if (this.selectedCompass && this.selectedCompass.sIndex === index) {
        this.selectedCompass = null
      } else if (this.selectedCompass && this.selectedCompass.sIndex > index) {
        this.selectedCompass.sIndex--;
      }

      this.saveToLocalStorage()
    },

    copySection(index) {
      // Copiar la sección al portapapeles
      this.copiedSection = JSON.parse(JSON.stringify(this.body[index]))
    },

    pasteSection(afterIndex) {
      if (!this.copiedSection) return

      // Crear una copia profunda de la sección
      const newSection = JSON.parse(JSON.stringify(this.copiedSection))

      // Generar un nuevo ID único
      const existingIds = this.body.map(s => s.id)
      let newId = newSection.id
      let counter = 1

      // Si el ID ya existe, añadir un número
      while (existingIds.includes(newId)) {
        newId = newSection.id + counter
        counter++
      }

      newSection.id = newId

      // Insertar después de la sección indicada
      this.body.splice(afterIndex + 1, 0, newSection)
      this.saveToLocalStorage()
    },

    moveSectionUp(index) {
      if (index > 0) {
        // Crear copia profunda independiente de la sección
        const sectionCopy = JSON.parse(JSON.stringify(this.body[index]))
        this.body.splice(index, 1)
        this.body.splice(index - 1, 0, sectionCopy)
        this.saveToLocalStorage()
      }
    },

    moveSectionDown(index) {
      if (index < this.body.length - 1) {
        // Crear copia profunda independiente de la sección
        const sectionCopy = JSON.parse(JSON.stringify(this.body[index]))
        this.body.splice(index, 1)
        this.body.splice(index + 1, 0, sectionCopy)
        this.saveToLocalStorage()
      }
    },

    addCompass(sectionIndex) {
      this.body[sectionIndex].compass.push({
        chords: [
          { chord: 'C', div: 1 }
        ]
      })
      this.saveToLocalStorage()
    },

    deleteCompass(sectionIndex, compassIndex) {
      this.body[sectionIndex].compass.splice(compassIndex, 1)
      if (this.selectedCompass && this.selectedCompass.sIndex === sectionIndex && this.selectedCompass.cIndex === compassIndex) {
        this.selectedCompass = null
      } else if (this.selectedCompass && this.selectedCompass.sIndex === sectionIndex && this.selectedCompass.cIndex > compassIndex) {
        this.selectedCompass.cIndex--;
      }
      this.saveToLocalStorage()
    },

    updateCompass(sectionIndex, compassIndex, chords) {
      // Crear copia profunda de los acordes para evitar referencias compartidas
      this.body[sectionIndex].compass[compassIndex].chords = JSON.parse(JSON.stringify(chords))
      this.saveToLocalStorage()
    },

    copyCompass(sectionIndex, compassIndex) {
      console.log('Copying compass', sectionIndex, compassIndex)
      this.copiedCompass = JSON.parse(JSON.stringify(this.body[sectionIndex].compass[compassIndex]))
    },

    pasteCompass(sectionIndex) {
      console.log('Pasting compass to section', sectionIndex)
      if (!this.copiedCompass) return

      const newCompass = JSON.parse(JSON.stringify(this.copiedCompass))
      this.body[sectionIndex].compass.push(newCompass)
      this.saveToLocalStorage()
    },

    addStructureItem() {
      if (this.body.length > 0) {
        const firstSection = this.body[0]
        this.structure.push({
          id: firstSection.id,
          b_color: firstSection.b_color,
          f_color: firstSection.f_color,
          shape: this.settings.shape_default,
          lyric: '',
          isBreak: false
        })
        this.saveToLocalStorage()
      }
    },

    updateStructureItem(index, data) {
      // Crear copia profunda para evitar referencias compartidas
      const currentItem = JSON.parse(JSON.stringify(this.structure[index]))
      const newData = JSON.parse(JSON.stringify(data))
      this.structure[index] = { ...currentItem, ...newData }
      // Ensure lyric is preserved if not in data, or updated if in data
      if (data.lyric !== undefined) {
        this.structure[index].lyric = data.lyric
      }
      this.saveToLocalStorage()
    },

    deleteStructureItem(index) {
      this.structure.splice(index, 1)
      this.saveToLocalStorage()
    },

    addNote() {
      const newId = this.notes.length > 0 ? Math.max(...this.notes.map(n => n.id)) + 1 : 1
      this.notes.push({
        id: newId,
        text: 'Nueva nota'
      })
      this.saveToLocalStorage()
    },

    updateNote(index, text) {
      this.notes[index].text = text
      this.saveToLocalStorage()
    },

    deleteNote(index) {
      this.notes.splice(index, 1)
      this.saveToLocalStorage()
    },

    updateSettings(settings) {
      this.settings = { ...this.settings, ...settings }
      this.saveToLocalStorage()
    },

    getSongsRegistry() {
      const raw = localStorage.getItem('groupSheetSongs')
      if (!raw) {
        return { version: 1, songs: {}, collections: {} }
      }

      let parsed
      try {
        parsed = JSON.parse(raw)
      } catch (e) {
        return { version: 1, songs: {}, collections: {} }
      }

      // Formato nuevo
      if (parsed && (parsed.version === 1 || parsed.version === 2 || parsed.version === 3 || parsed.version === 4) && parsed.songs) {
        if (!parsed.collections) {
          parsed.collections = {}
        }
        // Auto-upgrade in memory if needed
        if (parsed.version === 1) {
          parsed.version = 2
          Object.values(parsed.songs).forEach(song => {
            if (song.structure) {
              song.structure = song.structure.map(item => ({
                ...item,
                lyric: item.lyric !== undefined ? item.lyric : ''
              }))
            }
          })
          // We don't save immediately here, but it will be saved on next write
        }
        if (parsed.version === 2) {
          parsed.version = 3
          // Set turns = 1 for all sections if missing
          Object.values(parsed.songs).forEach(song => {
            if (song.body) {
              song.body = song.body.map(section => ({
                ...section,
                turns: section.turns !== undefined ? section.turns : 1
              }))
            }
          })
        }
        if (parsed.version === 3) {
          parsed.version = 4
          // Initialize isBreak for structure items
          Object.values(parsed.songs).forEach(song => {
            if (song.structure) {
              song.structure = song.structure.map(item => ({
                ...item,
                isBreak: item.isBreak !== undefined ? item.isBreak : false
              }))
            }
          })
        }
        return parsed
      }

      // Formato antiguo: { [nombreCancion]: songData }
      const songs = {}
      if (parsed && typeof parsed === 'object') {
        Object.keys(parsed).forEach(name => {
          const song = parsed[name]
          if (!song || typeof song !== 'object' || !song.header || !song.body) return

          const createdAt = song.savedAt || new Date().toISOString()
          const id = md5(createdAt)

          songs[id] = {
            id,
            name,
            header: song.header,
            body: song.body,
            structure: song.structure,
            notes: song.notes,
            settings: song.settings || { ...defaultSettings },
            createdAt,
            updatedAt: song.savedAt || createdAt
          }
        })
      }

      const registry = { version: 4, songs, collections: {} }
      localStorage.setItem('groupSheetSongs', JSON.stringify(registry))
      return registry
    },

    saveSongsRegistry(registry) {
      if (!registry.version) {
        registry.version = 2
      } else if (registry.version === 1) {
        // Upgrade from v1 to v2
        registry.version = 2
        // Iterate all songs and add 'lyric' to structure items if missing
        if (registry.songs) {
          Object.values(registry.songs).forEach(song => {
            if (song.structure) {
              song.structure = song.structure.map(item => ({
                ...item,
                lyric: item.lyric !== undefined ? item.lyric : '' // Base64 empty
              }))
            }
          })
        }
      }

      if (registry.version === 2) {
        // Upgrade from v2 to v3
        registry.version = 3
        if (registry.songs) {
          Object.values(registry.songs).forEach(song => {
            if (song.body) {
              song.body = song.body.map(section => ({
                ...section,
                turns: section.turns !== undefined ? section.turns : 1
              }))
            }
          })
        }
      }

      if (registry.version === 3) {
        // Upgrade from v3 to v4
        registry.version = 4
        if (registry.songs) {
          Object.values(registry.songs).forEach(song => {
            if (song.structure) {
              song.structure = song.structure.map(item => ({
                ...item,
                isBreak: item.isBreak !== undefined ? item.isBreak : false
              }))
            }
          })
        }
      }

      if (!registry.collections) {
        registry.collections = {}
      }
      localStorage.setItem('groupSheetSongs', JSON.stringify(registry))
    },

    saveToLocalStorage() {
      // Persistir sólo si la canción tiene id asignado
      if (!this.currentSongId) {
        return
      }

      const registry = this.getSongsRegistry()
      const now = new Date().toISOString()
      const existingSong = registry.songs[this.currentSongId] || {}
      const createdAt = existingSong.createdAt || now

      registry.songs[this.currentSongId] = this.constructSongObject(createdAt, now)

      registry.lastSongId = this.currentSongId
      this.saveSongsRegistry(registry)
    },

    constructSongObject(createdAt, updatedAt) {
      return {
        id: this.currentSongId,
        name: this.header.center.top.name || 'Nueva Canción',
        header: this.header,
        body: this.body,
        structure: this.structure,
        notes: this.notes,
        settings: this.settings,
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: updatedAt || new Date().toISOString()
      }
    },

    importJSONSong(songData, overwrite = false) {
      const registry = this.getSongsRegistry()
      if (!registry.songs) registry.songs = {}

      if (registry.songs[songData.id] && !overwrite) {
        return { success: false, reason: 'exists' }
      }

      // Ensure minimal structure
      if (!songData.id || !songData.header || !songData.body) {
        throw new Error('Formato de canción inválido')
      }

      registry.songs[songData.id] = songData
      this.saveSongsRegistry(registry)
      return { success: true }
    },

    migrateDivValues(body) {
      // Convert old div values: 4 (old negra) -> 3 (new negra), 8 (corchea) -> 3 (negra)
      return body.map(section => ({
        ...section,
        compass: section.compass.map(compass => ({
          ...compass,
          chords: compass.chords.map(chord => {
            if (chord.div === 4 || chord.div === 8) {
              return { ...chord, div: 3 }
            }
            return chord
          })
        }))
      }))
    },

    exportData() {
      return {
        header: this.header,
        body: this.body,
        structure: this.structure,
        notes: this.notes,
        settings: this.settings
      }
    },

    importData(data) {
      // Crear copias profundas para evitar referencias compartidas
      this.header = JSON.parse(JSON.stringify(data.header))
      this.body = JSON.parse(JSON.stringify(data.body))
      this.structure = JSON.parse(JSON.stringify(data.structure))
      this.notes = JSON.parse(JSON.stringify(data.notes))
      this.settings = { ...defaultSettings, ...(data.settings || {}) }
      this.saveToLocalStorage()
    },

    // Sistema de gestión de múltiples canciones
    getSongsList() {
      const registry = this.getSongsRegistry()
      const songs = registry.songs || {}
      return Object.values(songs).sort((a, b) => {
        const dateA = a.updatedAt || a.createdAt || ''
        const dateB = b.updatedAt || b.createdAt || ''
        return dateB.localeCompare(dateA)
      })
    },

    saveSongAs(songName) {
      if (!songName || songName.trim() === '') {
        throw new Error('El nombre de la canción no puede estar vacío')
      }

      const trimmedName = songName.trim()
      const registry = this.getSongsRegistry()
      const now = new Date().toISOString()

      let songId = this.currentSongId
      let createdAt

      if (!songId || !registry.songs[songId]) {
        createdAt = now
        songId = md5(createdAt)
      } else {
        createdAt = registry.songs[songId].createdAt || now
      }

      registry.songs[songId] = {
        id: songId,
        name: trimmedName,
        header: this.header,
        body: this.body,
        structure: this.structure,
        notes: this.notes,
        settings: this.settings,
        createdAt,
        updatedAt: now
      }

      registry.lastSongId = songId
      this.currentSongId = songId
      this.saveSongsRegistry(registry)

      return songId
    },

    loadSong(songId) {
      const registry = this.getSongsRegistry()
      const song = registry.songs[songId]

      if (!song) {
        throw new Error('Canción no encontrada')
      }

      this.header = JSON.parse(JSON.stringify(song.header))
      this.body = this.migrateDivValues(JSON.parse(JSON.stringify(song.body)))
      this.structure = JSON.parse(JSON.stringify(song.structure))
      this.notes = JSON.parse(JSON.stringify(song.notes || []))
      this.settings = { ...defaultSettings, ...(song.settings || {}) }
      this.currentSongId = song.id
    },

    deleteSong(songId) {
      const registry = this.getSongsRegistry()
      if (registry.songs && registry.songs[songId]) {
        delete registry.songs[songId]
        if (registry.lastSongId === songId) {
          registry.lastSongId = Object.keys(registry.songs)[0] || null
        }
        this.saveSongsRegistry(registry)
      }

      if (this.currentSongId === songId) {
        this.newFile()
      }
    },

    newFile() {
      // Inicializar con una sola parte 'A' y un compás 'C' sin anotaciones
      this.currentSongId = null
      this.settings = { ...defaultSettings }
      this.header = {
        left: {
          top: { tempo: '120' },
          bottom: { signature: '4/4' }
        },
        center: {
          top: { name: 'Nueva Canción' },
          bottom: { author: '' }
        },
        right: {
          top: { tone: 'C' }
        }
      }

      this.body = [
        {
          id: 'A',
          b_color: this.settings.b_color_default,
          f_color: this.settings.f_color_default,
          turns: 1,
          compass: [
            {
              chords: [
                { chord: 'C', div: 3 }
              ]
            }
          ]
        }
      ]

      this.structure = [
        { id: 'A', b_color: this.settings.b_color_default, f_color: this.settings.f_color_default, shape: 'S' }
      ]

      this.notes = []

      // No guardar automáticamente para evitar sobrescribir
    },

    initializeApp() {
      // Siempre arrancar con un archivo nuevo limpio
      // Esto evita problemas de datos corruptos o anidados
      this.newFile()
    },

    setSelectedSection(sectionId) {
      this.selectedSectionId = sectionId
      if (sectionId !== null) {
        this.selectedStructureIndex = null
        this.selectedCompass = null
      }
      this.saveToLocalStorage()
    },

    setSelectedCompass(sectionIndex, compassIndex) {
      if (this.selectedCompass && this.selectedCompass.sIndex === sectionIndex && this.selectedCompass.cIndex === compassIndex) {
        // Deselect if already selected
        this.selectedCompass = null
      } else {
        this.selectedCompass = { sIndex: sectionIndex, cIndex: compassIndex }
        this.selectedSectionId = null
        this.selectedStructureIndex = null
      }
    }
  }
})
