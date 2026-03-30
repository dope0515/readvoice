/**
 * Shared export utilities for PDF, Excel, and Email
 */

/**
 * Export meeting minutes to PDF
 */
export const exportToPdf = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId)
  if (!element) throw new Error('Export element not found')

  const { default: html2canvas } = await import('html2canvas')
  const { jsPDF } = await import('jspdf')

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  })

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  const imgHeight = (canvas.height * contentWidth) / canvas.width

  let y = margin
  let remainHeight = imgHeight
  let srcY = 0

  while (remainHeight > 0) {
    const sliceHeight = Math.min(remainHeight, pageHeight - margin * 2)
    const sliceCanvas = document.createElement('canvas')
    sliceCanvas.width = canvas.width
    sliceCanvas.height = (sliceHeight / contentWidth) * canvas.width
    const ctx = sliceCanvas.getContext('2d')!
    ctx.drawImage(canvas, 0, srcY * (canvas.height / imgHeight), canvas.width, sliceCanvas.height, 0, 0, sliceCanvas.width, sliceCanvas.height)
    pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', margin, y, contentWidth, sliceHeight)
    remainHeight -= sliceHeight
    srcY += sliceHeight
    if (remainHeight > 0) { pdf.addPage(); y = margin }
  }

  pdf.save(`${filename || 'export'}.pdf`)
}

/**
 * Export meeting minutes to Excel (XLS)
 */
export const exportToExcel = (data: any, filename: string) => {
  const rows = [
    { th: '회의 주제', td: data.topic || '' },
    { th: '회의 일시', td: data.date || '' },
    { th: '참석자', td: data.attendees || '' },
    { th: '주요 논의 사항', td: (data.discussions || []).map((s: string) => `• ${s}`).join('\n') },
    { th: '결정 사항', td: (data.decisions || []).map((s: string) => `• ${s}`).join('\n') },
    { th: '추후 진행 사항', td: (data.actionItems || []).map((s: string) => `• ${s}`).join('\n') },
  ]

  const cellStyle = `font-family:Malgun Gothic,Apple SD Gothic Neo,sans-serif;font-size:11pt;vertical-align:top;white-space:pre-wrap;border:1px solid #e0e0e0;padding:8px 12px;`
  const thStyle = `${cellStyle}background:#E8F0FE;font-weight:bold;color:#202124;width:130px;border-color:#c5c5c5;`
  const tdStyle = `${cellStyle}background:#ffffff;color:#202124;`
  const actionTdStyle = `${cellStyle}background:#FFF8E1;color:#5F4C00;`
  const headerStyle = `font-family:Malgun Gothic,Apple SD Gothic Neo,sans-serif;font-size:14pt;font-weight:bold;background:#1a73e8;color:#ffffff;text-align:center;padding:12px;border:1px solid #1a73e8;`

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>회의록</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
    <body>
      <table border="1" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <tr><td colspan="2" style="${headerStyle}">회의록</td></tr>
        ${rows.map((row, i) => `<tr>
          <td style="${thStyle}">${row.th}</td>
          <td style="${i === 5 ? actionTdStyle : tdStyle}">${row.td.replace(/\n/g, '<br/>')}</td>
        </tr>`).join('')}
      </table>
    </body>
    </html>`

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename || 'export'}.xls`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Send content via Email using default mail app (mailto)
 */
export const sendEmail = (subjectLine: string, bodyText: string, data?: any) => {
  let content = bodyText;

  // 만약 정리된 회의록 데이터가 있다면, 텍스트로 보기 좋게 포맷팅
  if (data) {
    const { topic = '제목 없음', date = '-', attendees = '-', discussions = [], decisions = [], actionItems = [] } = data;
    
    content = `[회의 주제]: ${topic}\n`;
    content += `[회의 일시]: ${date}\n`;
    content += `[참석자]: ${attendees}\n\n`;
    
    if (discussions.length > 0) {
      content += `[주요 논의 사항]\n${discussions.map((d: string) => `- ${d}`).join('\n')}\n\n`;
    }
    
    if (decisions.length > 0) {
      content += `[결정 사항]\n${decisions.map((d: string) => `- ${d}`).join('\n')}\n\n`;
    }
    
    if (actionItems.length > 0) {
      content += `[추후 진행 사항]\n${actionItems.map((a: string) => `- ${a}`).join('\n')}\n`;
    }
  }

  const subject = encodeURIComponent(subjectLine)
  const body = encodeURIComponent(content)
  window.location.href = `mailto:?subject=${subject}&body=${body}`
}
