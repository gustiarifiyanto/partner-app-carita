// Snapshot a rendered DOM node to JPEG or a (multi-page) A4 PDF.
// Libraries are loaded on demand so they don't weigh down the initial bundle.

const BACKGROUND = '#F8FAFF'

async function renderToDataUrl(node) {
  const { toJpeg } = await import('html-to-image')
  return toJpeg(node, {
    quality: 0.95,
    pixelRatio: 2,
    backgroundColor: BACKGROUND,
    cacheBust: true,
    // Skip anything marked as UI-only (buttons, filters) in the snapshot.
    filter: (el) => !(el.dataset && el.dataset.exportIgnore !== undefined),
  })
}

function triggerDownload(href, filename) {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function exportNodeAsJpeg(node, filename) {
  const dataUrl = await renderToDataUrl(node)
  triggerDownload(dataUrl, filename)
}

// Bottom edges (in CSS px from the node's top) of blocks a page may end after:
// table rows, cards, headings. Used to avoid slicing through a row.
function collectBreakPoints(node) {
  const top = node.getBoundingClientRect().top
  const blocks = node.querySelectorAll('tr, section, h2, h3, [class*="rounded-2xl"], [class*="rounded-xl"]')
  const points = new Set()
  blocks.forEach((el) => {
    const rect = el.getBoundingClientRect()
    if (rect.height > 0) points.add(Math.round(rect.bottom - top))
  })
  return [...points].sort((a, b) => a - b)
}

export async function exportNodeAsPdf(node, filename) {
  const cssWidth = node.getBoundingClientRect().width
  const breakPointsCss = collectBreakPoints(node)
  const [{ jsPDF }, dataUrl] = await Promise.all([import('jspdf'), renderToDataUrl(node)])
  const img = await loadImage(dataUrl)

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10
  const contentWidth = pageWidth - margin * 2
  const contentHeight = pageHeight - margin * 2

  // How many source pixels fit on one PDF page at this scale.
  const pxPerMm = img.width / contentWidth
  const sliceHeightPx = Math.floor(contentHeight * pxPerMm)

  // Snapshot pixels per CSS pixel (html-to-image renders at pixelRatio 2).
  const scale = img.width / cssWidth
  const breakPoints = breakPointsCss.map((y) => Math.round(y * scale) + Math.round(4 * scale))

  // Slice the tall snapshot into page-sized strips, ending each page on the
  // lowest block boundary that fits so rows and cards aren't cut in half.
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = img.width

  for (let offset = 0, page = 0; offset < img.height; page++) {
    let height = Math.min(sliceHeightPx, img.height - offset)
    if (offset + height < img.height) {
      const limit = offset + sliceHeightPx
      const fit = breakPoints.filter((y) => y > offset + sliceHeightPx * 0.5 && y <= limit).pop()
      if (fit) height = fit - offset
    }
    canvas.height = height
    ctx.fillStyle = BACKGROUND
    ctx.fillRect(0, 0, canvas.width, height)
    ctx.drawImage(img, 0, offset, img.width, height, 0, 0, img.width, height)

    if (page > 0) pdf.addPage()
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', margin, margin, contentWidth, height / pxPerMm)
    offset += height
  }

  pdf.save(filename)
}
