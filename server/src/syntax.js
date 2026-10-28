// Tolerant lexical context for interactive help. This is deliberately not a
// validator or a replacement for Tree-sitter/Max's compiler. Offsets are UTF-16,
// matching JavaScript strings and the LSP's default position encoding.
export function tokenize(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const start = i;
    const char = text[i];
    if (/\s/.test(char)) { i++; continue; }
    if (text.startsWith('//', i)) {
      while (i < text.length && !/[\r\n]/.test(text[i])) i++;
      tokens.push({ kind: 'comment', value: text.slice(start, i), start, end: i });
    } else if (text.startsWith('/*', i)) {
      const end = text.indexOf('*/', i + 2);
      i = end < 0 ? text.length : end + 2;
      tokens.push({ kind: 'comment', value: text.slice(start, i), start, end: i });
    } else if (char === '"') {
      i++;
      while (i < text.length && text[i] !== '"' && !/[\r\n]/.test(text[i])) i++;
      const closed = text[i] === '"';
      if (closed) i++;
      tokens.push({ kind: 'string', value: text.slice(start, i), start, end: i, closed });
    } else if (/[a-zA-Z_]/.test(char)) {
      while (i < text.length && /[a-zA-Z_0-9]/.test(text[i])) i++;
      tokens.push({ kind: 'identifier', value: text.slice(start, i), start, end: i });
    } else if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(text[i + 1] ?? ''))) {
      const match = /^(?:0x[\da-f]+|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)/i.exec(text.slice(i));
      i += match[0].length;
      tokens.push({ kind: 'number', value: text.slice(start, i), start, end: i });
    } else {
      const operator = /^(?:==p|!=p|<=p|>=p|==|!=|<=|>=|&&|\|\||\^\^|\+=|-=|\*=|\/=|%=)/.exec(text.slice(i));
      i += operator ? operator[0].length : 1;
      tokens.push({ kind: 'punctuation', value: text.slice(start, i), start, end: i });
    }
  }
  return tokens;
}

const declarationTypes = new Map(['Param', 'History', 'Buffer', 'Data', 'Delay'].map(name => [name.toLowerCase(), name]));

export function contextAt(text, offset) {
  const all = tokenize(text);
  const containing = all.find(t => t.start < offset &&
    (offset < t.end || (offset === t.end && (t.kind === 'comment' || (t.kind === 'string' && !t.closed)))));
  const tokens = all.filter(t => t.start < offset && t.kind !== 'comment');
  const frames = [];
  const scopes = [new Map()];
  let declaration;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const previous = tokens[i - 1];
    if (token.kind === 'identifier' && declarationTypes.has(token.value.toLowerCase()) &&
        (!previous || [';', '{', '}'].includes(previous.value))) {
      declaration = declarationTypes.get(token.value.toLowerCase());
    } else if (declaration && token.kind === 'identifier' &&
               (declarationTypes.has(previous?.value.toLowerCase()) || previous?.value === ',' && (!frames.length || frames.at(-1).delimiter === '{'))) {
      scopes.at(-1).set(token.value, declaration);
    }
    if (token.value === ';') declaration = undefined;
    if (token.value === '{') scopes.push(new Map());
    if (token.value === '}' && scopes.length > 1) scopes.pop();

    if (['(', '[', '{'].includes(token.value)) {
      const call = token.value === '(' && previous?.kind === 'identifier';
      const receiverName = tokens[i - 2]?.value === '.' ? tokens[i - 3]?.value : undefined;
      let receiver;
      if (receiverName) {
        for (let s = scopes.length - 1; s >= 0; s--) {
          if (scopes[s].has(receiverName)) { receiver = scopes[s].get(receiverName); break; }
        }
      }
      const type = declarationTypes.get(tokens[i - 2]?.value.toLowerCase());
      frames.push({
        delimiter: token.value, start: token.start, commas: 0, segmentStart: i + 1,
        callee: call ? previous.value : undefined, receiverName, receiver,
        entryName: call ? type ?? previous.value : undefined,
        declaration: Boolean(type), usedAttributes: new Set(),
      });
    } else if ([')', ']', '}'].includes(token.value)) {
      const expected = { ')': '(', ']': '[', '}': '{' }[token.value];
      if (frames.at(-1)?.delimiter === expected) frames.pop();
    } else if (token.value === ',' && frames.length) {
      const frame = frames.at(-1);
      frame.commas++;
      frame.segmentStart = i + 1;
    } else if (token.value === '=' && frames.at(-1)?.delimiter === '(' && previous?.kind === 'identifier') {
      frames.at(-1).usedAttributes.add(previous.value);
    }
  }

  const frame = frames.at(-1);
  const call = frame?.delimiter === '(' && frame.callee ? frame : undefined;
  const segment = call ? tokens.slice(call.segmentStart) : [];
  const attribute = segment[0]?.kind === 'identifier' && segment[1]?.value === '=' ? segment[0].value : undefined;
  const before = all.filter(t => t.end <= offset && t.kind !== 'comment');
  const last = before.at(-1);
  const partial = all.find(t => t.kind === 'identifier' && t.start <= offset && t.end >= offset);
  const prefixStart = partial?.start ?? offset;
  const beforePrefix = all.filter(t => t.end <= prefixStart && t.kind !== 'comment');
  const dot = beforePrefix.at(-1)?.value === '.' ? beforePrefix.at(-2) : undefined;
  let memberType;
  if (dot) for (let s = scopes.length - 1; s >= 0; s--) {
    if (scopes[s].has(dot.value)) { memberType = scopes[s].get(dot.value); break; }
  }
  return {
    all, tokens, containing, call, attribute, segment,
    prefix: text.slice(prefixStart, offset), prefixStart, prefixEnd: partial?.end ?? offset,
    member: Boolean(dot || last?.value === '.'), memberType,
    suppressed: containing?.kind === 'comment',
  };
}

export function tokenAt(text, offset) {
  const all = tokenize(text);
  // Prefer the token starting here over one ending here.
  const index = all.findIndex(t => t.start <= offset && offset < t.end);
  const resolved = index >= 0 ? index : all.findIndex(t => t.end === offset);
  return { token: all[resolved], previous: all[resolved - 1], beforePrevious: all[resolved - 2] };
}
