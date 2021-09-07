import type { TSESTree } from '../typescript-estree-import';
import { NewPlugin } from 'pretty-format';
import { AST_NODE_TYPES } from '../../../src';

function sortKeys(node: Record<string, unknown>): string[] {
  const keySet = new Set(Object.keys(node));

  // type place as first key
  keySet.delete('type');
  // range and loc we place after all properties
  keySet.delete('range');
  keySet.delete('loc');

  // babel keys
  keySet.delete('start');
  keySet.delete('end');
  if (node.type === AST_NODE_TYPES.Program) {
    keySet.delete('interpreter');
  }

  return Array.from(keySet).sort((a, b) => a.localeCompare(b));
}

function stringifyLineAndColumn(loc: TSESTree.LineAndColumnData): string {
  return `{ column: ${loc.column}, line: ${loc.line} }`;
}

function isObject(val: unknown): val is Record<string, unknown> {
  return val != null && typeof val === 'object';
}
function hasValidType(type: unknown): type is string {
  return typeof type === 'string';
}

const serializer: NewPlugin = {
  test(val: unknown) {
    return isObject(val) && hasValidType(val.type);
  },
  serialize(
    node: Record<string, unknown>,
    config,
    indentation,
    depth,
    refs,
    printer,
  ) {
    const keys = sortKeys(node);
    const type = node.type;
    const loc = node.loc as TSESTree.SourceLocation;
    const range = node.range as TSESTree.Range;

    const outputLines = [];
    const childIndentation = indentation + config.indent;

    const printValue = (value: unknown): string =>
      printer(value, config, childIndentation, depth, refs);

    outputLines.push(`${type} {`);
    outputLines.push(`${childIndentation}type: ${printValue(type)},`);

    for (const key of keys) {
      const value = node[key];
      if (value === undefined) {
        continue;
      }

      outputLines.push(`${childIndentation}${key}: ${printValue(value)},`);
    }

    outputLines.push('');
    outputLines.push(`${childIndentation}range: [${range.join(', ')}],`);
    outputLines.push(
      `${childIndentation}loc: {`,
      `${childIndentation}${config.indent}start: ${stringifyLineAndColumn(
        loc.start,
      )},`,
      `${childIndentation}${config.indent}end: ${stringifyLineAndColumn(
        loc.end,
      )},`,
      `${childIndentation}},`,
    );
    outputLines.push(`${indentation}}`);

    return outputLines.join('\n');
  },
};

export { serializer };