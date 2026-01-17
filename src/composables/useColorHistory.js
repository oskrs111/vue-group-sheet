import { ref, watch } from 'vue'

const STORAGE_KEY = 'colorHistory'
const MAX_COLORS = 5

// Estado reactivo compartido globalmente
const colorHistory = ref([])

// Cargar historial desde localStorage
const loadHistory = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            colorHistory.value = JSON.parse(stored)
        }
    } catch (e) {
        console.error('Error loading color history:', e)
    }
}

// Guardar historial en localStorage
const saveHistory = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(colorHistory.value))
    } catch (e) {
        console.error('Error saving color history:', e)
    }
}

// Inicializar al cargar el módulo
loadHistory()

export function useColorHistory() {
    const addColor = (color) => {
        if (!color) return

        // Normalizar el color a formato hexadecimal
        const normalizedColor = color.toLowerCase()

        // Eliminar el color si ya existe
        const index = colorHistory.value.indexOf(normalizedColor)
        if (index !== -1) {
            colorHistory.value.splice(index, 1)
        }

        // Añadir al principio
        colorHistory.value.unshift(normalizedColor)

        // Mantener solo los últimos MAX_COLORS colores
        if (colorHistory.value.length > MAX_COLORS) {
            colorHistory.value = colorHistory.value.slice(0, MAX_COLORS)
        }

        saveHistory()
    }

    return {
        colorHistory,
        addColor
    }
}
