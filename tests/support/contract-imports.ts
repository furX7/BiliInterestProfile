import { isAbsolute, relative, posix } from 'node:path'
import ts from 'typescript'

const rawNames = new Set(['RawSourceResult', 'SourceAdapter'])
function repositoryPath(path: string) {
  return (isAbsolute(path) ? relative(process.cwd(), path) : path).replaceAll('\\', '/')
}
function modulePath(specifier: string, owner: string) {
  if (specifier.startsWith('.')) return posix.normalize(posix.join(posix.dirname(owner), specifier))
  if (/^(@|~)\//.test(specifier)) return posix.normalize(`src/${specifier.slice(2)}`)
  if (/^(@@|~~)\//.test(specifier)) return posix.normalize(specifier.slice(3))
  return posix.normalize(repositoryPath(specifier))
}
function exactAssemblyEdge(node: ts.Node, owner: string, target: string): boolean {
  if (
    owner !== 'src/core/pipeline/collect-approved-sources.ts' ||
    target !== 'src/sources/bilibili/registry' ||
    !ts.isImportDeclaration(node)
  )
    return false
  const clause = node.importClause
  const binding = clause?.namedBindings
  return (
    !!clause &&
    !clause.isTypeOnly &&
    !clause.name &&
    !!binding &&
    ts.isNamedImports(binding) &&
    binding.elements.length === 1 &&
    !binding.elements[0].isTypeOnly &&
    !binding.elements[0].propertyName &&
    binding.elements[0].name.text === 'approvedSourceRegistry'
  )
}

/** Test-only AST guard. Raw owning layers may import one another; consumers may not. */
export function findForbiddenRawImports(sourceText: string, ownerPath: string): string[] {
  const owner = posix.normalize(repositoryPath(ownerPath))
  if (/^src\/(sources|normalize)\//.test(owner)) return []
  const source = ts.createSourceFile(
    owner,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const violations: string[] = []
  function check(node: ts.Node, specifier: string) {
    const target = modulePath(specifier, owner)
    let rawSymbol = false
    function names(child: ts.Node) {
      if (
        (ts.isImportSpecifier(child) || ts.isExportSpecifier(child)) &&
        rawNames.has((child.propertyName ?? child.name).text)
      )
        rawSymbol = true
      ts.forEachChild(child, names)
    }
    names(node)
    if (
      (/^src\/(sources|normalize)(\/|$)/.test(target) || rawSymbol) &&
      !exactAssemblyEdge(node, owner, target)
    )
      violations.push(specifier)
  }
  function visit(node: ts.Node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    )
      check(node, node.moduleSpecifier.text)
    else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression &&
      ts.isStringLiteralLike(node.moduleReference.expression)
    )
      check(node, node.moduleReference.expression.text)
    else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteralLike(node.argument.literal)
    )
      check(node, node.argument.literal.text)
    else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require')) &&
      node.arguments[0] &&
      ts.isStringLiteralLike(node.arguments[0])
    )
      check(node, node.arguments[0].text)
    ts.forEachChild(node, visit)
  }
  visit(source)
  return violations
}
