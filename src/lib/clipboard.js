// Copy text to the clipboard. navigator.clipboard only exists on secure
// origins (https / localhost), so fall back to a hidden textarea +
// execCommand when the app is opened over plain http on the LAN.
export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    if (!document.execCommand('copy')) throw new Error('Copy command was rejected')
  } finally {
    document.body.removeChild(textarea)
  }
}
