import luau from "@roblox-ts/luau-ast";

export function wrapMethodCall(exp: luau.IndexableExpression, self: luau.Expression) {
	return luau.create(luau.SyntaxKind.FunctionExpression, {
		hasDotDotDot: true,
		parameters: luau.list.make(),
		statements: luau.list.make(
			luau.create(luau.SyntaxKind.ReturnStatement, {
				expression: luau.call(exp, [self, luau.create(luau.SyntaxKind.VarArgsLiteral, {})]),
			}),
		),
	});
}
