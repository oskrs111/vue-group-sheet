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

const MAX_UNDO_LEVELS = 10

const cloneData = (value) => JSON.parse(JSON.stringify(value))

const createUndoSnapshot = (song) => {
  if (!song?.id) return null

  return {
    id: song.id,
    name: song.name || 'Nueva Canción',
    header: cloneData(song.header),
    body: cloneData(song.body),
    structure: cloneData(song.structure),
    notes: cloneData(song.notes || []),
    settings: { ...defaultSettings, ...(song.settings || {}) },
    createdAt: song.createdAt || new Date().toISOString(),
    updatedAt: song.updatedAt || new Date().toISOString()
  }
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
    copiedStructureItem: null,
    selectedSectionId: null,
    selectedStructureIndex: null,
    selectedCompass: null,
    exportFooterData: null,
    undoHistory: []
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

    getStructureInsertTemplate(index = this.selectedStructureIndex) {
      const firstSection = this.body[0]
      if (!firstSection) return null

      const selectedItem = index !== null ? this.structure[index] : null
      if (selectedItem && !selectedItem.isBreak) {
        const matchingSection = this.body.find(section => section.id === selectedItem.id)
        return {
          id: selectedItem.id,
          b_color: matchingSection?.b_color ?? selectedItem.b_color ?? firstSection.b_color,
          f_color: matchingSection?.f_color ?? selectedItem.f_color ?? firstSection.f_color,
          shape: selectedItem.shape ?? this.settings.shape_default
        }
      }

      const lastItem = [...this.structure].reverse().find(item => !item.isBreak)
      if (lastItem) {
        const matchingSection = this.body.find(section => section.id === lastItem.id)
        return {
          id: lastItem.id,
          b_color: matchingSection?.b_color ?? lastItem.b_color ?? firstSection.b_color,
          f_color: matchingSection?.f_color ?? lastItem.f_color ?? firstSection.f_color,
          shape: lastItem.shape ?? this.settings.shape_default
        }
      }

      return {
        id: firstSection.id,
        b_color: firstSection.b_color,
        f_color: firstSection.f_color,
        shape: this.settings.shape_default
      }
    },

    createStructureItem(template) {
      if (!template) return null

      return {
        id: template.id,
        b_color: template.b_color,
        f_color: template.f_color,
        shape: template.shape ?? this.settings.shape_default,
        lyric: '',
        isBreak: false
      }
    },

    clearUndoHistory() {
      this.undoHistory = []
    },

    pushUndoEntry(songSnapshot, operation = 'Actualizar canción') {
      const snapshot = createUndoSnapshot(songSnapshot)
      if (!snapshot) return

      this.undoHistory.push({
        timestamp: new Date().toISOString(),
        operation,
        snapshot
      })

      if (this.undoHistory.length > MAX_UNDO_LEVELS) {
        this.undoHistory.shift()
      }
    },

    undoLastChange() {
      if (this.undoHistory.length === 0) return null

      const entry = this.undoHistory.pop()
      const snapshot = createUndoSnapshot(entry.snapshot)
      if (!snapshot) return null

      const registry = this.getSongsRegistry()
      registry.songs[snapshot.id] = cloneData(snapshot)
      registry.lastSongId = snapshot.id
      this.saveSongsRegistry(registry)

      this.header = cloneData(snapshot.header)
      this.body = this.migrateDivValues(cloneData(snapshot.body))
      this.structure = cloneData(snapshot.structure)
      this.notes = cloneData(snapshot.notes || [])
      this.settings = { ...defaultSettings, ...(snapshot.settings || {}) }
      this.currentSongId = snapshot.id
      this.selectedSectionId = null
      this.selectedStructureIndex = null
      this.selectedCompass = null

      return entry
    },

    moveStructureItem(fromIndex, toIndex) {
      if (toIndex < 0 || toIndex >= this.structure.length) return

      const [item] = this.structure.splice(fromIndex, 1)
      this.structure.splice(toIndex, 0, item)

      if (this.selectedStructureIndex === fromIndex) {
        this.selectedStructureIndex = toIndex
      } else if (this.selectedStructureIndex !== null) {
        if (fromIndex < toIndex && this.selectedStructureIndex > fromIndex && this.selectedStructureIndex <= toIndex) {
          this.selectedStructureIndex--
        } else if (fromIndex > toIndex && this.selectedStructureIndex >= toIndex && this.selectedStructureIndex < fromIndex) {
          this.selectedStructureIndex++
        }
      }

      this.saveToLocalStorage('Reordenar estructura')
    },

    addStructureItemAt(index, side) { // side: 'left' (before) or 'right' (after)
      const newItem = this.createStructureItem(this.getStructureInsertTemplate(index))
      if (!newItem) return

      const insertIndex = side === 'left' ? index : index + 1
      this.structure.splice(insertIndex, 0, newItem)

      this.selectedStructureIndex = insertIndex
      this.selectedSectionId = null
      this.selectedCompass = null

      this.saveToLocalStorage('Añadir elemento de estructura')
    },

    deleteStructureItem(index) {
      this.structure.splice(index, 1)
      if (this.selectedStructureIndex === index) {
        this.selectedStructureIndex = null
      } else if (this.selectedStructureIndex > index) {
        this.selectedStructureIndex--
      }
      this.saveToLocalStorage('Eliminar elemento de estructura')
    },

    updateTempo(value) {
      this.header.left.top.tempo = value
      this.saveToLocalStorage('Actualizar tempo')
    },

    updateSignature(value) {
      this.header.left.bottom.signature = value
      this.saveToLocalStorage('Actualizar compás')
    },

    updateName(value) {
      this.header.center.top.name = value
      this.saveToLocalStorage('Actualizar título')
    },

    updateAuthor(value) {
      this.header.center.bottom.author = value
      this.saveToLocalStorage('Actualizar autor')
    },

    updateTone(value) {
      this.header.right.top.tone = value
      this.saveToLocalStorage('Actualizar tono')
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
      this.saveToLocalStorage('Añadir sección')
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
      this.saveToLocalStorage('Editar sección')
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

      this.saveToLocalStorage('Eliminar sección')
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
      this.saveToLocalStorage('Pegar sección')
    },

    moveSectionUp(index) {
      if (index > 0) {
        // Crear copia profunda independiente de la sección
        const sectionCopy = JSON.parse(JSON.stringify(this.body[index]))
        this.body.splice(index, 1)
        this.body.splice(index - 1, 0, sectionCopy)
        this.saveToLocalStorage('Reordenar sección')
      }
    },

    moveSectionDown(index) {
      if (index < this.body.length - 1) {
        // Crear copia profunda independiente de la sección
        const sectionCopy = JSON.parse(JSON.stringify(this.body[index]))
        this.body.splice(index, 1)
        this.body.splice(index + 1, 0, sectionCopy)
        this.saveToLocalStorage('Reordenar sección')
      }
    },

    addCompass(sectionIndex) {
      this.body[sectionIndex].compass.push({
        chords: [
          { chord: 'C', div: 1 }
        ]
      })
      this.saveToLocalStorage('Añadir compás')
    },

    deleteCompass(sectionIndex, compassIndex) {
      this.body[sectionIndex].compass.splice(compassIndex, 1)
      if (this.selectedCompass && this.selectedCompass.sIndex === sectionIndex && this.selectedCompass.cIndex === compassIndex) {
        this.selectedCompass = null
      } else if (this.selectedCompass && this.selectedCompass.sIndex === sectionIndex && this.selectedCompass.cIndex > compassIndex) {
        this.selectedCompass.cIndex--;
      }
      this.saveToLocalStorage('Eliminar compás')
    },

    updateCompass(sectionIndex, compassIndex, chords) {
      // Crear copia profunda de los acordes para evitar referencias compartidas
      this.body[sectionIndex].compass[compassIndex].chords = JSON.parse(JSON.stringify(chords))
      this.saveToLocalStorage('Editar compás')
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
      this.saveToLocalStorage('Pegar compás')
    },

    copyStructureItem(index) {
      if (index === null || index < 0 || index >= this.structure.length) return
      this.copiedStructureItem = JSON.parse(JSON.stringify(this.structure[index]))
    },

    pasteStructureItem(index = this.selectedStructureIndex) {
      if (!this.copiedStructureItem) return

      const insertIndex = index === null ? this.structure.length : index + 1
      const newItem = JSON.parse(JSON.stringify(this.copiedStructureItem))
      this.structure.splice(insertIndex, 0, newItem)
      this.selectedStructureIndex = insertIndex
      this.selectedSectionId = null
      this.selectedCompass = null
      this.saveToLocalStorage('Pegar elemento de estructura')
    },

    addStructureItem() {
      const newItem = this.createStructureItem(this.getStructureInsertTemplate())
      if (!newItem) return

      this.structure.push(newItem)
      this.selectedStructureIndex = this.structure.length - 1
      this.selectedSectionId = null
      this.selectedCompass = null
      this.saveToLocalStorage('Añadir elemento de estructura')
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
      this.saveToLocalStorage(data.lyric !== undefined && Object.keys(newData).length === 1 ? 'Editar letra' : 'Editar elemento de estructura')
    },

    addNote() {
      const newId = this.notes.length > 0 ? Math.max(...this.notes.map(n => n.id)) + 1 : 1
      this.notes.push({
        id: newId,
        text: 'Nueva nota'
      })
      this.saveToLocalStorage('Añadir nota')
    },

    updateNote(index, text) {
      this.notes[index].text = text
      this.saveToLocalStorage('Editar nota')
    },

    deleteNote(index) {
      this.notes.splice(index, 1)
      this.saveToLocalStorage('Eliminar nota')
    },

    updateSettings(settings) {
      this.settings = { ...this.settings, ...settings }
      this.saveToLocalStorage('Actualizar ajustes')
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

      if (window.electronAPI) {
        // Enviar a guardar en archivo local si estamos en Electron
        window.electronAPI.saveDatabase(registry)
      } else {
        // Comportamiento normal web
        localStorage.setItem('groupSheetSongs', JSON.stringify(registry))
      }
    },

    saveToLocalStorage(operation = 'Actualizar canción') {
      // Persistir sólo si la canción tiene id asignado
      if (!this.currentSongId) {
        return
      }

      const registry = this.getSongsRegistry()
      const now = new Date().toISOString()
      const existingSong = registry.songs[this.currentSongId] || null
      const createdAt = existingSong.createdAt || now

      if (existingSong?.id) {
        this.pushUndoEntry(existingSong, operation)
      }

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

    exportCompleteDatabase() {
      // Devuelve explícitamente el registro general
      return this.getSongsRegistry()
    },

    importCompleteDatabase(registryData, merge = false) {
      // Validar si el JSON tiene aspecto de una base de datos de GroupSheet (contiene version y songs o collections)
      if (!registryData || typeof registryData !== 'object') {
        throw new Error('El archivo no tiene el formato correcto de base de datos')
      }

      // Una base de datos debe tener version y songs
      if (registryData.version === undefined || !registryData.songs) {
        throw new Error('El archivo no parece ser un backup válido de Vue Group Sheet')
      }

      const currentRegistry = this.getSongsRegistry()

      if (merge) {
        // Combinar datos: sobrescribir conflictos pero mantener lo no existente local
        const mergedSongs = { ...currentRegistry.songs, ...registryData.songs }
        const mergedCollections = { ...(currentRegistry.collections || {}), ...(registryData.collections || {}) }

        currentRegistry.songs = mergedSongs
        currentRegistry.collections = mergedCollections
        // Respetamos la versión del importante si es mayor
        currentRegistry.version = Math.max(currentRegistry.version || 1, registryData.version || 1)
        this.saveSongsRegistry(currentRegistry)
      } else {
        // Reemplazo total destructivo
        this.saveSongsRegistry(registryData)
        // Redirigir a una canción nueva después de purgar para evitar que el store quede colgado en una id fantasma
        this.newFile()
      }

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

    importData(data, options = {}) {
      this.header = cloneData(data.header)
      this.body = cloneData(data.body)
      this.structure = cloneData(data.structure)
      this.notes = cloneData(data.notes || [])
      this.settings = { ...defaultSettings, ...(data.settings || {}) }
      this.saveToLocalStorage(options.operation || 'Importar datos')
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

    saveSongAs(songName, operation = 'Guardar canción') {
      if (!songName || songName.trim() === '') {
        throw new Error('El nombre de la canción no puede estar vacío')
      }

      const trimmedName = songName.trim()
      const registry = this.getSongsRegistry()
      const now = new Date().toISOString()

      let songId = this.currentSongId
      let createdAt
      const existingSong = songId ? registry.songs[songId] || null : null

      if (!songId || !registry.songs[songId]) {
        createdAt = now
        songId = md5(createdAt)
      } else {
        createdAt = registry.songs[songId].createdAt || now
      }

      if (existingSong?.id) {
        this.pushUndoEntry(existingSong, operation)
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
      this.clearUndoHistory()
      this.selectedSectionId = null
      this.selectedStructureIndex = null
      this.selectedCompass = null
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
      this.selectedSectionId = null
      this.selectedStructureIndex = null
      this.selectedCompass = null
      this.clearUndoHistory()

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
