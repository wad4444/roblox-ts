import luau from "@roblox-ts/luau-ast";
import { errors } from "Shared/diagnostics";
import { TransformState } from "TSTransformer";
import { DiagnosticService } from "TSTransformer/classes/DiagnosticService";
import { transformOptionalChain } from "TSTransformer/nodes/transformOptionalChain";
import { convertToIndexableExpression } from "TSTransformer/util/convertToIndexableExpression";
import { getConstantValueLiteral } from "TSTransformer/util/getConstantValueLiteral";
import { isMethod } from "TSTransformer/util/isMethod";
import { isValidMethodIndexWithoutCall } from "TSTransformer/util/isValidMethodIndexWithoutCall";
import { skipUpwards } from "TSTransformer/util/traversal";
import { validateNotAnyType } from "TSTransformer/util/validateNotAny";
import { wrapMethodCall } from "TSTransformer/util/wrapMethodCall";
import ts from "typescript";

export function transformPropertyAccessExpressionInner(
	state: TransformState,
	node: ts.PropertyAccessExpression,
	expression: luau.Expression,
	name: string,
) {
	// a in a.b
	validateNotAnyType(state, node.expression);

	if (ts.isPrototypeAccess(node)) {
		DiagnosticService.addDiagnostic(errors.noPrototype(node));
	}

	const topNode = skipUpwards(node);
	if (ts.isDeleteExpression(topNode.parent)) {
		state.prereq(
			luau.create(luau.SyntaxKind.Assignment, {
				left: luau.property(convertToIndexableExpression(expression), name),
				operator: "=",
				right: luau.nil(),
			}),
		);
		return luau.none();
	}

	if (ts.isBinaryExpression(topNode.parent) && isMethod(state, node)) {
		DiagnosticService.addDiagnostic(errors.noComparisonOfMethodSignatures(topNode.parent));
	}

	if (!isValidMethodIndexWithoutCall(state, topNode) && isMethod(state, node)) {
		const propertyAccess = luau.property(convertToIndexableExpression(expression), name);
		return wrapMethodCall(propertyAccess, propertyAccess.expression);
	}

	return luau.property(convertToIndexableExpression(expression), name);
}

export function transformPropertyAccessExpression(state: TransformState, node: ts.PropertyAccessExpression) {
	const constantValue = getConstantValueLiteral(state, node);
	if (constantValue) {
		return constantValue;
	}

	return transformOptionalChain(state, node);
}
