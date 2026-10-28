import { catalog, findEntry, signatureLabel } from './catalog.js';
import { contextAt, tokenAt } from './syntax.js';

function documentation(entry) {
  const sections = [
    `\`\`\`genexpr\n${signatureLabel(entry)}\n\`\`\``, entry.description,
    `Domain: ${entry.domain === 'common' ? 'all Gen domains' : 'gen~ (audio)'}.`,
  ];
  if (entry.returns) sections.push(`Returns: ${entry.returns.join(', ')}.`);
  if (entry.attributes.length) sections.push('Attributes:\n' + entry.attributes.map(a =>
    `- \`${a.name}\`${a.default === null ? '' : ` (default \`${JSON.stringify(a.default)}\`)`}: ${a.description}${a.values ? ` Values: ${a.values.map(v => `\`${JSON.stringify(v)}\``).join(', ')}.` : ''}`,
  ).join('\n'));
  sections.push(`[Cycling ’74 reference](${entry.url})`);
  return { kind: 'markdown', value: sections.join('\n\n') };
}

function allowed(entry, domain) {
  return entry.domain === 'common' || domain === 'dsp';
}

function callEntry(context, domain) {
  const frame = context.call;
  if (!frame || frame.receiverName && !frame.receiver) return undefined;
  const entry = findEntry(frame.entryName, frame.receiver);
  return entry && allowed(entry, domain) ? entry : undefined;
}

export function completions(document, position, { domain = 'dsp' } = {}) {
  const text = document.getText();
  const offset = document.offsetAt(position);
  const context = contextAt(text, offset);
  if (context.suppressed) return [];
  const entry = callEntry(context, domain);
  const range = { start: document.positionAt(context.prefixStart), end: document.positionAt(context.prefixEnd) };

  // Enum values are only offered in a known attribute's value position.
  if (entry && context.attribute) {
    const attribute = entry.attributes.find(a => a.name === context.attribute);
    if (!attribute?.values) return [];
    const string = context.containing?.kind === 'string' ? context.containing : undefined;
    const valueStart = string ? string.start : context.segment[2]?.start ?? offset;
    const replaceEnd = string?.closed ? string.end : offset;
    return attribute.values.map(value => ({
      label: JSON.stringify(value), kind: 20,
      detail: `${entry.name}.${attribute.name}${attribute.default === value ? ' (default)' : ''}`,
      documentation: attribute.description,
      textEdit: { range: { start: document.positionAt(valueStart), end: document.positionAt(replaceEnd) }, newText: JSON.stringify(value) },
    }));
  }
  if (context.containing?.kind === 'string') return [];

  if (context.member) {
    return catalog.filter(e => e.kind === 'method' && e.receiver === context.memberType && allowed(e, domain))
      .filter(e => e.name.startsWith(context.prefix))
      .map(e => completion(e, range));
  }
  const items = catalog.filter(e => e.kind !== 'method' && allowed(e, domain))
    .filter(e => e.name.toLowerCase().startsWith(context.prefix.toLowerCase()))
    .map(e => completion(e, range));
  // Do not offer attribute keys in an argument expression or nested call.
  if (entry && (context.segment.length === 0 || context.segment.length === 1 && context.segment[0].kind === 'identifier')) {
    items.unshift(...entry.attributes.filter(a => !context.call.usedAttributes.has(a.name) && a.name.startsWith(context.prefix)).map(a => ({
      label: `${a.name}=`, filterText: a.name, sortText: `0-${a.name}`, kind: 10,
      detail: `Attribute of ${entry.name}`, documentation: a.description,
      textEdit: { range, newText: `${a.name}=` },
    })));
  }
  return items;
}

function completion(entry, range) {
  // Leave the call punctuation to the user so optional/default arguments are
  // never inserted blindly. Snippets provide full templates separately.
  return {
    label: entry.name, kind: entry.kind === 'constant' ? 21 : entry.kind === 'variable' ? 6 : entry.kind === 'declaration' ? 7 : entry.kind === 'method' ? 2 : 3,
    detail: signatureLabel(entry), documentation: documentation(entry),
    textEdit: { range, newText: entry.name },
  };
}

export function hover(document, position, { domain = 'dsp' } = {}) {
  const text = document.getText();
  const offset = document.offsetAt(position);
  const { token, previous } = tokenAt(text, offset);
  if (!token || token.kind !== 'identifier') return null;
  const context = contextAt(text, token.start);
  let entry;
  if (previous?.value === '.') {
    const receiverContext = contextAt(text, token.start);
    if (!receiverContext.memberType) return null;
    entry = findEntry(token.value, receiverContext.memberType);
  } else {
    const call = callEntry(context, domain);
    const attribute = call?.attributes.find(a => a.name === token.value);
    const next = context.all.find(t => t.start >= token.end && t.kind !== 'comment');
    if (attribute && next?.value === '=') {
      return { contents: { kind: 'markdown', value: `**${call.name}.${attribute.name}**\n\n${attribute.description}\n\n${attribute.default === null ? '' : `Default: \`${JSON.stringify(attribute.default)}\`.\n\n`}${attribute.values ? `Values: ${attribute.values.map(v => `\`${JSON.stringify(v)}\``).join(', ')}.\n\n` : ''}[Cycling ’74 reference](${call.url})` }, range: { start: document.positionAt(token.start), end: document.positionAt(token.end) } };
    }
    entry = findEntry(token.value);
    // A declaration's identifier can be named like a built-in; don't mislabel it.
    if (previous?.kind === 'identifier' && findEntry(previous.value)?.kind === 'declaration') return null;
  }
  if (!entry || !allowed(entry, domain)) return null;
  return { contents: documentation(entry), range: { start: document.positionAt(token.start), end: document.positionAt(token.end) } };
}

export function signatureHelp(document, position, { domain = 'dsp' } = {}) {
  const context = contextAt(document.getText(), document.offsetAt(position));
  if (context.suppressed || context.containing?.kind === 'string' && !context.attribute) return null;
  const entry = callEntry(context, domain);
  if (!entry || ['constant', 'variable'].includes(entry.kind)) return null;
  const parameters = [
    ...entry.parameters.map(label => ({ label })),
    ...entry.attributes.map(a => ({ label: `${a.name}=${a.default === null ? '…' : JSON.stringify(a.default)}`, documentation: a.description })),
  ];
  const attributeIndex = entry.attributes.findIndex(a => a.name === context.attribute);
  const variadic = entry.parameters.indexOf('...');
  const positionalCount = entry.parameters.length;
  const activeParameter = attributeIndex >= 0 ? positionalCount + attributeIndex :
    Math.min(context.call.commas, variadic >= 0 ? variadic : Math.max(0, positionalCount - 1));
  return {
    signatures: [{ label: signatureLabel(entry, context.call.declaration ? context.call.callee : entry.name), documentation: documentation(entry), parameters }],
    activeSignature: 0,
    ...(parameters.length ? { activeParameter } : {}),
  };
}
