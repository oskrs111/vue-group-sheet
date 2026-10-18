const copyButton = document.querySelector('#copy-script')
const copyStatus = document.querySelector('#copy-status')
const example = document.querySelector('#example-script')

if (new URLSearchParams(window.location.search).has('desktop')) {
  document.querySelectorAll('[data-return-editor]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault()
      window.close()
    })
  })
}

const imageDialog = document.querySelector('#screenshot-dialog')
const enlargedImage = document.querySelector('#screenshot-image')
document.querySelector('#close-screenshot').addEventListener('click', () => imageDialog.close())
document.querySelectorAll('.screenshot > a').forEach(link => {
  link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey) return
    event.preventDefault()
    const image = link.querySelector('img')
    enlargedImage.src = link.href
    enlargedImage.alt = image.alt
    document.querySelector('#screenshot-caption').textContent = link.closest('figure').querySelector('figcaption').textContent
    imageDialog.showModal()
  })
})

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(`${example.textContent.trimEnd()}\n`)
    copyStatus.textContent = 'Script copiado. Abre Script en el editor, pega el texto y pulsa Aplicar script.'
  } catch {
    example.closest('details').open = true
    copyStatus.textContent = 'Selecciona el texto del ejemplo para copiarlo, o utiliza Descargar TXT.'
    example.closest('pre').focus()
  }
})

const indexLinks = [...document.querySelectorAll('.guide-index nav a')]
if ('IntersectionObserver' in window) {
  const sections = [...document.querySelectorAll('main section[id]')]
  const visibleSections = new Set()
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) visibleSections.add(entry.target.id)
      else visibleSections.delete(entry.target.id)
    }
    const current = sections.find(section => visibleSections.has(section.id))
    for (const link of indexLinks) {
      if (current && link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location')
      else link.removeAttribute('aria-current')
    }
  }, { rootMargin: '-15% 0px -65% 0px' })
  sections.forEach(section => observer.observe(section))
}
