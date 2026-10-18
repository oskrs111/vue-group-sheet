import { acceptHMRUpdate, defineStore } from 'pinia'
import { getStorageItem, setStorageItem, refreshDesktopStorage, refreshDesktopStorageAsync } from '../utils/persistence'

function readSongs() {
    const raw = getStorageItem('groupSheetSongs')
    return raw ? JSON.parse(raw).songs || {} : {}
}

const missingSongsIn = (collection, songs) => collection.songs
    .map((id, index) => ({ id, position: index + 1 }))
    .filter(song => !Object.hasOwn(songs, song.id))

export const createIntegrityCheck = () => ({
    running: false, phase: 'idle', run: 0, completed: 0, total: 0,
    checkedCollections: 0, totalCollections: 0, checkedReferences: 0, totalReferences: 0,
    missingReferences: 0, detail: '', finishedAt: null, error: ''
})

const yieldToUI = () => new Promise(resolve => setTimeout(resolve, 0))

export const useCollectionStore = defineStore('collections', {
    state: () => ({
        collections: [],
        integrityReportOpen: false,
        integrityCheck: createIntegrityCheck()
    }),

    getters: {
        integrityIssues(state) {
            const songs = readSongs()
            return state.collections.flatMap(collection => {
                const missingSongs = missingSongsIn(collection, songs)
                return missingSongs.length ? [{ collectionId: collection.id, name: collection.name, missingSongs }] : []
            })
        }
    },

    actions: {
        async recheckIntegrity() {
            const previousCheck = this.$state.integrityCheck
            if (previousCheck?.running) return
            this.$state.integrityCheck = {
                ...createIntegrityCheck(), run: (previousCheck?.run ?? 0) + 1,
                running: true, phase: 'refresh',
                detail: window.electronAPI?.storage ? 'Recargando los archivos de Songs y Collections…' : 'Recargando la biblioteca del navegador…'
            }
            const check = this.$state.integrityCheck
            try {
                await yieldToUI()
                await refreshDesktopStorageAsync()
                this.loadCollections()
                const songs = readSongs()
                const collections = this.collections
                check.totalCollections = collections.length
                check.totalReferences = collections.reduce((total, collection) => total + collection.songs.length, 0)
                check.total = Math.max(1, check.totalCollections + check.totalReferences)
                check.phase = 'checking'
                check.detail = 'Preparando la revisión de las referencias…'
                await yieldToUI()
                let lastYield = performance.now()
                const issues = []
                for (const collection of collections) {
                    check.detail = `Revisando «${collection.name}»`
                    const missingSongs = missingSongsIn(collection, songs)
                    if (missingSongs.length) issues.push({ collectionId: collection.id, name: collection.name, missingSongs })
                    check.checkedCollections++
                    check.checkedReferences += collection.songs.length
                    check.missingReferences += missingSongs.length
                    check.completed = check.checkedCollections + check.checkedReferences
                    if (performance.now() - lastYield >= 16) {
                        await yieldToUI()
                        lastYield = performance.now()
                    }
                }
                check.completed = check.total
                check.phase = 'complete'
                check.detail = 'Biblioteca actualizada y referencias revisadas.'
                check.finishedAt = new Date().toISOString()
                return issues
            } catch (error) {
                check.phase = 'error'
                check.detail = 'La comprobación no ha terminado. Vuelve a intentarlo.'
                check.error = error.message
                throw error
            } finally {
                check.running = false
            }
        },

        checkIntegrity() {
            refreshDesktopStorage()
            this.loadCollections()
            return this.integrityIssues
        },

        loadCollections() {
            const raw = getStorageItem('groupSheetCollections')
            if (raw) {
                try {
                    this.collections = JSON.parse(raw)
                } catch (e) {
                    console.error('Error parsing collections from localStorage', e)
                    this.collections = []
                }
            } else {
                this.collections = []
            }
        },

        saveCollections() {
            try {
                setStorageItem('groupSheetCollections', JSON.stringify(this.collections))
            } catch (error) {
                this.loadCollections()
                throw error
            }
        },

        addCollection(name) {
            const id = crypto.randomUUID()
            const newCollection = {
                id,
                name: name || 'Nueva Colección',
                songs: [] // Array of song IDs
            }
            this.collections.push(newCollection)
            this.saveCollections()
            return id
        },

        updateCollection(id, data) {
            const index = this.collections.findIndex(c => c.id === id)
            if (index !== -1) {
                this.collections[index] = { ...this.collections[index], ...data }
                this.saveCollections()
            }
        },

        duplicateCollection(id) {
            const original = this.collections.find(c => c.id === id)
            if (original) {
                const newId = crypto.randomUUID()
                const duplicate = {
                    ...JSON.parse(JSON.stringify(original)),
                    id: newId,
                    name: `${original.name} (Copia)`
                }
                this.collections.push(duplicate)
                this.saveCollections()
                return newId
            }
        },

        deleteCollection(id) {
            this.collections = this.collections.filter(c => c.id !== id)
            this.saveCollections()
        },

        addSongToCollection(collectionId, songId) {
            const collection = this.collections.find(c => c.id === collectionId)
            if (collection && !collection.songs.includes(songId)) {
                collection.songs.push(songId)
                this.saveCollections()
            }
        },

        removeSongFromCollection(collectionId, songId) {
            const collection = this.collections.find(c => c.id === collectionId)
            if (collection) {
                collection.songs = collection.songs.filter(id => id !== songId)
                this.saveCollections()
            }
        },

        moveSongInCollection(collectionId, fromIndex, toIndex) {
            const collection = this.collections.find(c => c.id === collectionId)
            if (collection) {
                const songs = [...collection.songs]
                const [movedSong] = songs.splice(fromIndex, 1)
                songs.splice(toIndex, 0, movedSong)
                collection.songs = songs
                this.saveCollections()
            }
        },

        exportCollection(collectionId) {
            this.checkIntegrity()
            const collection = this.collections.find(c => c.id === collectionId)
            if (!collection) throw new Error('Colección no encontrada')

            const issue = this.integrityIssues.find(item => item.collectionId === collectionId)
            if (issue) {
                this.integrityReportOpen = true
                const count = issue.missingSongs.length
                const error = new Error(`No se puede exportar «${collection.name}»: ${count} ${count === 1 ? 'referencia pendiente' : 'referencias pendientes'}. Revisa la integridad de las colecciones.`)
                error.code = 'MISSING_COLLECTION_SONGS'
                throw error
            }
            const songs = readSongs()

            return {
                collection: collection,
                songs: collection.songs.map(id => songs[id]),
                exportedAt: new Date().toISOString(),
                version: 1
            }
        }
    }
})

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useCollectionStore, import.meta.hot))
}
