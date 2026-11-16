import { writeStetDeliveryModeReport } from '../shared/delivery-mode-report'

const output = await writeStetDeliveryModeReport()

console.log(`Wrote StetCSS delivery modes report JSON to ${output.jsonFile}`)
console.log(`Wrote StetCSS delivery modes report Markdown to ${output.markdownFile}`)
