export const lyricsExportOptions = {
  title: 'Contenido de la exportación',
  message: 'Puedes exportar solo las partituras o incluir también las letras disponibles.',
  confirmText: 'Exportar con letras',
  alternativeText: 'Exportar sin letras'
}

export async function chooseBackupImport(askConfirm) {
  const merge = await askConfirm({
    title: 'Importar copia de seguridad',
    message: 'Fusionar añade las canciones y colecciones del backup a tu biblioteca. Si coinciden los IDs, se usa la versión del backup.\n\nReemplazar sustituye toda la biblioteca actual por el contenido del backup.',
    confirmText: 'Fusionar bibliotecas',
    alternativeText: 'Reemplazar biblioteca…',
    alternativeDanger: true
  })
  if (merge !== false) return merge

  const replace = await askConfirm({
    title: 'Reemplazar biblioteca',
    message: 'Se sustituirán todas las canciones y colecciones actuales por las del backup. Los elementos actuales que no estén en el backup se eliminarán.',
    confirmText: 'Reemplazar biblioteca',
    isDanger: true
  })
  return replace === true ? false : null
}
