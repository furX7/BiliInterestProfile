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
  const rawBindings = new Set<string>()
  function addBinding(name: ts.BindingName) {
    if (ts.isIdentifier(name)) rawBindings.add(name.text)
    else
      for (const element of name.elements)
        if (ts.isBindingElement(element)) addBinding(element.name)
  }
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteralLike(statement.moduleSpecifier))
      continue
    const target = modulePath(statement.moduleSpecifier.text, owner)
    const clause = statement.importClause
    const fromRawLayer = /^src\/(sources|normalize)(\/|$)/.test(target)
    if (fromRawLayer && clause?.name) rawBindings.add(clause.name.text)
    const bindings = clause?.namedBindings
    if (bindings && ts.isNamespaceImport(bindings) && fromRawLayer)
      rawBindings.add(bindings.name.text)
    if (bindings && ts.isNamedImports(bindings)) {
      for (const binding of bindings.elements) {
        if (fromRawLayer || rawNames.has((binding.propertyName ?? binding.name).text))
          rawBindings.add(binding.name.text)
      }
    }
  }
  function referencesRaw(expression: ts.Node): boolean {
    if (ts.isIdentifier(expression)) return rawBindings.has(expression.text)
    // Normalized functions may use raw owners internally; do not taint their public result.
    if (ts.isFunctionExpression(expression) || ts.isArrowFunction(expression)) return false
    if (ts.isPropertyAccessExpression(expression)) return referencesRaw(expression.expression)
    if (ts.isPropertyAssignment(expression)) return referencesRaw(expression.initializer)
    let found = false
    ts.forEachChild(expression, (child) => {
      if (referencesRaw(child)) found = true
    })
    return found
  }
  // Track top-level direct aliases, properties and destructuring until the binding set stabilizes.
  let previousSize = -1
  while (previousSize !== rawBindings.size) {
    previousSize = rawBindings.size
    for (const statement of source.statements) {
      if (!ts.isVariableStatement(statement)) continue
      for (const declaration of statement.declarationList.declarations) {
        if (declaration.initializer && referencesRaw(declaration.initializer))
          addBinding(declaration.name)
      }
    }
  }
  for (const statement of source.statements) {
    if (
      ts.isExportDeclaration(statement) &&
      !statement.moduleSpecifier &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const binding of statement.exportClause.elements) {
        if (rawBindings.has((binding.propertyName ?? binding.name).text))
          violations.push(`local export: ${binding.name.text}`)
      }
    } else if (ts.isExportAssignment(statement) && referencesRaw(statement.expression)) {
      violations.push('local export: default/raw expression')
    } else if (
      ts.isVariableStatement(statement) &&
      statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      for (const declaration of statement.declarationList.declarations) {
        if (declaration.initializer && referencesRaw(declaration.initializer))
          violations.push(`local export: ${declaration.name.getText(source)}`)
      }
    }
  }
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
