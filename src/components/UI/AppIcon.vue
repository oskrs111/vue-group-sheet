<template>
  <svg class="app-icon material-icons" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path :d="paths[name] || paths.music_note" />
  </svg>
</template>

<script setup>
defineProps({ name: { type: String, default: 'music_note' } })
const paths = {
  note_add: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M12 12v6 M9 15h6',
  save: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2Z M7 3v6h10V3 M7 21v-8h10v8',
  folder_open: 'M3 8V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v1 M3 9h18l-3 11H3a1 1 0 0 1-1-1z',
  picture_as_pdf: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h5',
  description: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h8',
  book: 'M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Z M12 5v15',
  print: 'M6 8V3h12v5 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6Z M18 12h1',
  file_upload: 'M12 16V3 M7 8l5-5 5 5 M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4',
  file_download: 'M12 3v13 M7 11l5 5 5-5 M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4',
  download: 'M12 3v13 M7 11l5 5 5-5 M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4',
  cloud_download: 'M7 17a5 5 0 1 1 1-10 6 6 0 0 1 11 2 4 4 0 0 1 0 8 M12 12v10 M8 18l4 4 4-4',
  code: 'm8 6-6 6 6 6 M16 6l6 6-6 6 M14 3l-4 18',
  settings: 'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  help_outline: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M9 8a3 3 0 0 1 6 1c0 2-3 2-3 5 M12 17h.01',
  edit: 'm16 3 5 5 M3 16 16 3a2 2 0 0 1 5 5L8 21H3z',
  edit_note: 'M3 5h12 M3 10h9 M3 15h5 M12 19l7-7 3 3-7 7h-3z',
  close: 'm6 6 12 12 M6 18 18 6',
  add: 'M12 5v14 M5 12h14',
  remove: 'M5 12h14',
  content_copy: 'M8 8h13v13H8Z M16 4V2H2v14h2',
  content_paste: 'M9 4H5v18h14V4h-4 M9 2h6v5H9Z M8 12h8 M8 17h6',
  delete: 'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
  arrow_upward: 'M12 20V4 M5 11l7-7 7 7',
  arrow_downward: 'M12 4v16 M5 13l7 7 7-7',
  arrow_left: 'M20 12H4 M11 5l-7 7 7 7',
  arrow_right: 'M4 12h16 M13 5l7 7-7 7',
  subdirectory_arrow_right: 'M5 4v7a4 4 0 0 0 4 4h11 M15 10l5 5-5 5',
  chevron_left: 'm15 5-7 7 7 7',
  chevron_right: 'm9 5 7 7-7 7',
  playlist_add: 'M3 6h12 M3 11h12 M3 16h7 M18 13v8 M14 17h8',
  zoom_in: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6 M10 7v6 M7 10h6',
  zoom_out: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6 M7 10h6',
  search: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6',
  fit: 'M8 3H3v5 M16 3h5v5 M3 16v5h5 M21 16v5h-5',
  music_note: 'M9 18V5l12-3v14 M9 8l12-3 M9 18c0 2-7 4-7 1s7-4 7-1 M21 16c0 2-7 4-7 1s7-4 7-1',
  lyrics: 'M4 4h16 M12 4v16 M8 20h8 M4 10h3 M17 10h3',
  keyboard: 'M2 5h20v14H2Z M5 9h1 M9 9h1 M13 9h1 M17 9h1 M5 13h1 M9 13h1 M13 13h1 M17 13h1 M7 16h10',
  storage: 'M3 3h18v6H3Z M3 9h18v6H3Z M3 15h18v6H3Z M6 6h.01 M6 12h.01 M6 18h.01',
  drag_indicator: 'M9 5h.01 M15 5h.01 M9 12h.01 M15 12h.01 M9 19h.01 M15 19h.01',
  check_circle: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M7 12l3 3 7-7',
  error: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M12 7v6 M12 17h.01',
  warning: 'm12 2 11 19H1z M12 9v5 M12 18h.01',
  info: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M12 11v6 M12 7h.01',
  hourglass_empty: 'M5 2h14 M5 22h14 M6 2v5l6 5-6 5v5 M18 2v5l-6 5 6 5v5',
  school: 'm1 9 11-6 11 6-11 6z M5 12v6l7 4 7-4v-6 M23 9v8',
  slideshow: 'M3 3h18v14H3Z M8 17l-3 5 M16 17l3 5 M10 7l5 3-5 3z',
  architecture: 'M12 2v5 M9 7h6 M11 7 4 22 M13 7l7 15 M7 15a8 8 0 0 0 10 0',
  monitor_weight: 'M3 4h18v14H3Z M8 22h8 M12 18v4',
}
</script>

<style scoped>
.app-icon { width: 1em; height: 1em; flex-shrink: 0; font-size: 20px; vertical-align: middle; }
</style>
