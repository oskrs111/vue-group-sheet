import { defineStore } from 'pinia'
import md5 from 'md5'

export const useCollectionStore = defineStore('collections', {
    state: () => ({
        collections: []
    }),

    actions: {
        loadCollections() {
            const raw = localStorage.getItem('groupSheetCollections')
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
            localStorage.setItem('groupSheetCollections', JSON.stringify(this.collections))
        },

        addCollection(name) {
            const id = md5(new Date().toISOString() + Math.random())
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
                const newId = md5(new Date().toISOString() + Math.random())
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
            const collection = this.collections.find(c => c.id === collectionId)
            if (!collection) throw new Error('Colección no encontrada')

            const rawSongs = localStorage.getItem('groupSheetSongs')
            let songsRegistry = { songs: {} }
            if (rawSongs) {
                try {
                    songsRegistry = JSON.parse(rawSongs)
                } catch (e) {
                    console.error('Error leyendo canciones para exportar', e)
                }
            }

            const songsToExport = []
            collection.songs.forEach(songId => {
                if (songsRegistry.songs && songsRegistry.songs[songId]) {
                    songsToExport.push(songsRegistry.songs[songId])
                }
            })

            return {
                collection: collection,
                songs: songsToExport,
                exportedAt: new Date().toISOString(),
                version: 1
            }
        }
    }
})
