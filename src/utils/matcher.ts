import { PacketTemplate, ProtocolRule } from '../types/rule';
import { PacketGenerator } from './generator';
import { cleanHex } from './hex';

const generator = new PacketGenerator();

export function findMatchingTemplate(
  inputHex: string,
  templates: PacketTemplate[],
  rules: ProtocolRule[]
): { template: PacketTemplate; rule: ProtocolRule } | null {
  const msgHex = cleanHex(inputHex);

  for (const template of templates) {
    const rule = rules.find(r => r.id === template.protocolId);
    if (!rule) continue;

    try {
      let isMatch = false;

      // 1. Check for configured Match Rules (Feature Matching)
      if (template.matchRanges && template.matchRanges.length > 0) {
        let allRangesMatch = true;
        // Generate full hex for the template
        const templateHex = cleanHex(generator.generate(rule, template.values));

        for (const range of template.matchRanges) {
          let targetOffset = range.offset || 0;
          let targetLength = range.length || 1;
          let targetValue = range.value;

          // If field-based match, derive offset/length/value from rule and template
          if (range.type === 'field' && range.fieldId) {
            const field = rule.fields.find(f => f.id === range.fieldId);
            if (field) {
              let currentOffset = 0;
              for (const f of rule.fields) {
                if (f.id === range.fieldId) {
                  targetOffset = currentOffset;
                  targetLength = f.length;
                  break;
                }
                currentOffset += f.length;
              }

              if (templateHex.length >= (targetOffset + targetLength) * 2) {
                targetValue = templateHex.substring(targetOffset * 2, (targetOffset + targetLength) * 2);
              }
            }
          } else {
            // Custom range
            if (!targetValue && templateHex.length >= (targetOffset + targetLength) * 2) {
              targetValue = templateHex.substring(targetOffset * 2, (targetOffset + targetLength) * 2);
            }
          }

          if (!targetValue) {
            allRangesMatch = false;
            break;
          }

          if (msgHex.length < (targetOffset + targetLength) * 2) {
            allRangesMatch = false;
            break;
          }

          const msgPart = msgHex.substring(targetOffset * 2, (targetOffset + targetLength) * 2);

          if (msgPart.toLowerCase() !== targetValue.toLowerCase()) {
            allRangesMatch = false;
            break;
          }
        }

        if (allRangesMatch) {
          isMatch = true;
        }

      } else {
        // 2. Fallback: Full Hex Match
        const templateHex = generator.generate(rule, template.values);
        if (cleanHex(templateHex).toLowerCase() === msgHex.toLowerCase()) {
          isMatch = true;
        }
      }

      if (isMatch) {
        return { template, rule };
      }

    } catch (e) {
      // Ignore errors during generation
      continue;
    }
  }

  return null;
}
