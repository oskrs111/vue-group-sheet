import saveAs from 'file-saver'

export async function saveExport(blob, filename) {
  if (window.electronAPI?.exportFile) {
    await window.electronAPI.exportFile(filename, new Uint8Array(await blob.arrayBuffer()))
  } else {
    saveAs(blob, filename)
  }
}
