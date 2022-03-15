import { 
    ASTNode,
    ASTNodeWithChildren,
    ASTReader,
    ASTWriter,
    CompilerKind,
    compileSol,
    compileSourceString,
    ContractDefinition,
    DefaultASTWriterMapping,
    ElementaryTypeName,
    ElementaryTypeNameExpression,
    EventDefinition,
    FunctionDefinition,
    FunctionTypeName,
    ModifierDefinition,
    ParameterList,
    PossibleCompilerKinds,
    PrettyFormatter,
    SourceUnit,
    VariableDeclaration,
    CompileResult,
    CompileFailedError,
    PragmaDirective,
    EnumValue,
    EnumDefinition,
    IdentifierPath,
    UserDefinedTypeName,
    Block,
    IfStatement,
    ExpressionStatement,
    Assignment,
    BinaryOperation,
    MemberAccess,
    Identifier,
    FunctionCall,
    Literal,
    Return,
    StructDefinition,
    DoWhileStatement,
    UnaryOperation,
    StructuredDocumentation,
    ForStatement,
    TupleExpression,
    VariableDeclarationStatement,
    ASTContext,
    OverrideSpecifier,
    TypeName,
    Expression,
    ErrorDefinition,
    UserDefinedValueTypeDefinition,
    ModifierInvocation,
    WhileStatement,
    Statement,
    NewExpression,
    Conditional,
    IndexAccess,
    IndexRangeAccess,
    FunctionCallOptions,
    UncheckedBlock,
    EmitStatement,
    Continue,
    Break,
    Throw,
    PlaceholderStatement,
    RevertStatement,
    TryCatchClause,
    TryStatement,
    ArrayTypeName,
    Mapping,
    ImportDirective,
    InheritanceSpecifier,
    UsingForDirective
} from "solc-typed-ast";

const srcStr:string = "0:0:0";
let dsl = new Map<string, ASTNode>();
let id:number = 1;
let modified:SourceUnit = new SourceUnit(0, srcStr, "test.sol", 0, "test.sol", new Map());
let context:ASTContext = new ASTContext(modified);
let parent: ASTNodeWithChildren<ASTNode> = modified;
let refRedirect = new Map<number, number>();

let curFn:FunctionDefinition = undefined;
let curContract:ContractDefinition = undefined;

function visitChildren(copyFrom:ASTNodeWithChildren<ASTNode>, copied:ASTNodeWithChildren<ASTNode>): void {
    if(copyFrom == undefined) {
        return;
    }

    const oldParent:ASTNodeWithChildren<ASTNode> = parent;
    parent = copied;
    //node.walkChildren(unitDispatch);
    for(const unit of copyFrom.children) {
        unitDispatch(unit);
    }
    parent = oldParent;
}

function registerNode(oldNode:ASTNode, newNode:ASTNode) {
    if(newNode == undefined) {
        return;
    }
    
    context.register(newNode);
    if(oldNode != undefined) {
        refRedirect.set(oldNode.id, newNode.id);
    }
}

function addNode(oldNode:ASTNode, newNode: ASTNode) {
    registerNode(oldNode, newNode);
    parent.appendChild(newNode);
}

function cloneList(nodes: ASTNode[]): ASTNode[] {
    const cloneParent:ASTNodeWithChildren<ASTNode> = new ASTNodeWithChildren<ASTNode>(id, srcStr);
    const oldParent:ASTNodeWithChildren<ASTNode> = parent;
    parent = cloneParent;
    for(const node of nodes) {
        unitDispatch(node);
    }

    parent = oldParent;
    return Array.from(cloneParent.children);
}

function clone(node: ASTNode): ASTNode {
    if(node == undefined) {
        return undefined;
    }

    const cloneParent:ASTNodeWithChildren<ASTNode> = new ASTNodeWithChildren<ASTNode>(id, srcStr);
    const oldParent:ASTNodeWithChildren<ASTNode> = parent;
    parent = cloneParent;
    unitDispatch(node);
    parent = oldParent;
    return cloneParent.firstChild;
}

function cloneDocs(docs: string | StructuredDocumentation): string | StructuredDocumentation {
    if(docs instanceof StructuredDocumentation) {
        return clone(docs) as StructuredDocumentation;
    }

    return docs;
}

function getNewId(node:ASTNode, id:number):number {
    if(id < 0 || id == undefined) {
        return id;
    }

    if(!refRedirect.has(id)) {
        const oldParent:ASTNodeWithChildren<ASTNode> = parent;
        parent = modified;
        const refNode:ASTNode = node.context.locate(id);
        if(refNode == undefined) {
            console.log("Could not find referenced node: " + id);
            console.log(node);
            process.exit(1);
        } 
        unitDispatch(refNode);
        parent = oldParent;
    }
    return refRedirect.get(id);
}

/*
 * Top-level Constructs 
 */
function process_SourceUnit(node:SourceUnit): void {
    visitChildren(node, modified);
}

function process_PragmaDirective(node:PragmaDirective): void {
    const newPragma:PragmaDirective = new PragmaDirective(id++, srcStr, node.literals);
    addNode(node, newPragma);
}

function process_ContractDefinition(node:ContractDefinition): void {
    const newContract:ContractDefinition = new ContractDefinition(id++, srcStr, node.name, node.scope, node.kind, node.abstract, node.fullyImplemented, node.linearizedBaseContracts, node.usedErrors, node.documentation, [], node.nameLocation);
    addNode(node, newContract);
    curContract = newContract;
    visitChildren(node, newContract);
    curContract = undefined;
}

function process_ImportDirective(node:ImportDirective): void {
    //skip
}

function process_InheritanceSpecifier(node:InheritanceSpecifier): void {
    const newBase:UserDefinedTypeName | IdentifierPath = clone(node.vBaseType) as UserDefinedTypeName | IdentifierPath;
    const newArgs:Expression[] = cloneList(node.vArguments) as Expression[];
    const newInherit:InheritanceSpecifier = new InheritanceSpecifier(id++, srcStr, newBase, newArgs);
    addNode(node, newInherit);
}

/*
 * Types
 */
function process_IdentifierPath(node:IdentifierPath): void {
    const refId:number = getNewId(node, node.referencedDeclaration);
    const newPath:IdentifierPath = new IdentifierPath(id++, srcStr, node.name, refId);
    addNode(node, newPath);
}

function process_UserDefinedTypeName(node:UserDefinedTypeName): void {
    const refId:number = getNewId(node, node.referencedDeclaration);
    const newPath:IdentifierPath = clone(node.path) as IdentifierPath;
    const newType:UserDefinedTypeName = new UserDefinedTypeName(id++, srcStr, node.typeString, node.name, refId, newPath);
    addNode(node, newType);
}

function process_ElementaryTypeName(node:ElementaryTypeName): void {
    const newType:ElementaryTypeName = new ElementaryTypeName(id++, srcStr, node.typeString, node.name, node.stateMutability);
    addNode(node, newType);
}

function process_ArrayTypeName(node:ArrayTypeName): void {
    const newType:TypeName = clone(node.vBaseType) as TypeName;
    const newLen:Expression = clone(node.vLength) as Expression;
    const newArr:ArrayTypeName = new ArrayTypeName(id++, srcStr, node.typeString, newType, newLen);
    addNode(node, newArr);
}

function process_Mapping(node:Mapping): void {
    const newKey:TypeName = clone(node.vKeyType) as TypeName;
    const newVal:TypeName = clone(node.vValueType) as TypeName;
    const newMap:Mapping = new Mapping(id++, srcStr, node.typeString, newKey, newVal);
    addNode(node, newMap);
}

function process_FunctionTypeName(node:FunctionTypeName): void {
    const newParams:ParameterList = clone(node.vParameterTypes) as ParameterList;
    const newRets:ParameterList = clone(node.vReturnParameterTypes) as ParameterList;
    const newType:FunctionTypeName = new FunctionTypeName(id++, srcStr, node.typeString, node.visibility, node.stateMutability, newParams, newRets);
    addNode(node, newType);
}

/*
 * Contracts
 */

function process_UsingForDirective(node:UsingForDirective): void {
    const newLib:UserDefinedTypeName | IdentifierPath = clone(node.vLibraryName) as UserDefinedTypeName | IdentifierPath;
    const newType:TypeName = clone(node.vTypeName) as TypeName;
    const newUsing:UsingForDirective = new UsingForDirective(id++, srcStr, newLib, newType);
    addNode(node, newUsing);
}

function process_StructDefinition(node:StructDefinition): void {
    const newStruct:StructDefinition = new StructDefinition(id++, srcStr, node.name, node.scope, node.visibility, [], node.nameLocation);
    addNode(node, newStruct);
    visitChildren(node, newStruct);
}

function process_VariableDeclaration(node:VariableDeclaration): void {
    const newType:TypeName = clone(node.vType) as TypeName;
    const newOverride:OverrideSpecifier = clone(node.vOverrideSpecifier) as OverrideSpecifier;
    const newValue:Expression = clone(node.vValue) as Expression;
    const newVariable:VariableDeclaration = new VariableDeclaration(id++, srcStr, node.constant, node.indexed, node.name, node.scope, node.stateVariable, node.storageLocation, node.visibility, node.mutability, node.typeString, node.documentation, newType, newOverride, newValue, node.nameLocation);
    addNode(node, newVariable);
}

function process_UserDefinedValueTypeDefinition(node:UserDefinedValueTypeDefinition): void {
    const elemType:ElementaryTypeName = clone(node.underlyingType) as ElementaryTypeName;
    const newType:UserDefinedValueTypeDefinition = new UserDefinedValueTypeDefinition(id++, srcStr, node.name, elemType, node.nameLocation);

    addNode(node, newType);
}

function process_EnumDefinition(node:EnumDefinition): void {
    const newEnum:EnumDefinition = new EnumDefinition(id++, srcStr, node.name, [], node.nameLocation);
    addNode(node, newEnum);
    visitChildren(node, newEnum);
}

function process_EnumValue(node:EnumValue): void {
    const newVal:EnumValue = new EnumValue(id++, srcStr, node.name, node.nameLocation);
    addNode(node, newVal);
}

function process_ErrorDefinition(node:ErrorDefinition): void {
    const newParams:ParameterList = clone(node.vParameters) as ParameterList;
    const newErr:ErrorDefinition = new ErrorDefinition(id++, srcStr, node.name, newParams, node.documentation, node.nameLocation);
    addNode(node, newErr);
}

function process_EventDefinition(node:EventDefinition): void {
    const newParams:ParameterList = clone(node.vParameters) as ParameterList;
    const newEvent:EventDefinition = new EventDefinition(id++, srcStr, node.anonymous, node.name, newParams, node.documentation, node.nameLocation);
    addNode(node, newEvent);
}

function process_StructuredDocumentation(node:StructuredDocumentation): void {
    const newDoc:StructuredDocumentation = new StructuredDocumentation(id++, srcStr, node.text);
    addNode(node, newDoc);
}

function process_ModifierDefinition(node:ModifierDefinition): void {
    const newParams:ParameterList = clone(node.vParameters) as ParameterList;
    const newBody:Block = clone(node.vBody) as Block;
    const newOverride:OverrideSpecifier = clone(node.vOverrideSpecifier) as OverrideSpecifier;
    const newMod:ModifierDefinition = new ModifierDefinition(id++, srcStr, node.name, node.virtual, node.visibility, newParams, newOverride, newBody, node.documentation, node.nameLocation);
    addNode(node, newMod);
}

function process_OverrideSpecifier(node:OverrideSpecifier): void {
    const newOverride:OverrideSpecifier = new OverrideSpecifier(id++, srcStr, []);
    addNode(node, newOverride);
    visitChildren(node, newOverride);
}

function process_ModifierInvocation(node:ModifierInvocation): void {
    const newIdent:Identifier | IdentifierPath = clone(node.vModifierName) as Identifier | IdentifierPath;
    const newArgs:Expression[] = cloneList(node.vArguments) as Expression[];
    const newInv:ModifierInvocation = new ModifierInvocation(id++, srcStr, newIdent, newArgs, node.kind);
    addNode(node, newInv);
}

function process_FunctionDefinition(node:FunctionDefinition): void {
    const newParams:ParameterList = clone(node.vParameters) as ParameterList;
    const newRets:ParameterList = clone(node.vReturnParameters) as ParameterList;
    const newBody:Block = clone(node.vBody) as Block;
    const newOverride:OverrideSpecifier = clone(node.vOverrideSpecifier) as OverrideSpecifier;
    const mods:ModifierInvocation[] = cloneList(node.vModifiers) as ModifierInvocation[];
    const docs:string | StructuredDocumentation = cloneDocs(node.documentation);
    const newFn:FunctionDefinition = new FunctionDefinition(id++, srcStr, node.scope, node.kind, node.name, node.virtual, node.visibility, node.stateMutability, node.isConstructor, newParams, newRets, mods, newOverride, newBody, docs, node.nameLocation);

    addNode(node, newFn);
}

/*
 * Functions
 */
function process_ParameterList(node:ParameterList): void {
    const newParams:ParameterList = new ParameterList(id++, srcStr, []);
    addNode(node, newParams);
    visitChildren(node, newParams);
}

function process_Block(node:Block): void {
    const docs:string | StructuredDocumentation = cloneDocs(node.documentation);
    const newBlk:Block = new Block(id++, srcStr, [], docs);
    addNode(node, newBlk);
    visitChildren(node, newBlk);
}

function process_UncheckedBlock(node:UncheckedBlock): void {
    const docs:string | StructuredDocumentation = cloneDocs(node.documentation);
    const newBlk:UncheckedBlock = new UncheckedBlock(id++, srcStr, [], docs);
    addNode(node, newBlk);
    visitChildren(node, newBlk);
}

function process_IfStatement(node:IfStatement): void {
    const docs:string | StructuredDocumentation = cloneDocs(node.documentation);
    const newCond:Expression = clone(node.vCondition) as Expression;
    const newTrue:Statement = clone(node.vTrueBody) as Statement;
    const newFalse:Statement = clone(node.vFalseBody) as Statement;
    const newIf:IfStatement = new IfStatement(id++, srcStr, newCond, newTrue, newFalse, docs);
    addNode(node, newIf);
}

function process_WhileStatement(node:WhileStatement): void {
    const docs:string | StructuredDocumentation = cloneDocs(node.documentation);
    const newCond:Expression = clone(node.vCondition) as Expression;
    const newBody:Statement = clone(node.vBody) as Statement;
    const newWhile:WhileStatement = new WhileStatement(id++, srcStr, newCond, newBody, docs);
    addNode(node, newWhile);
}

function process_DoWhileStatement(node:DoWhileStatement): void {
    const docs:string | StructuredDocumentation = cloneDocs(node.documentation);
    const newCond:Expression = clone(node.vCondition) as Expression;
    const newBody:Statement = clone(node.vBody) as Statement;
    const newWhile:DoWhileStatement = new DoWhileStatement(id++, srcStr, newCond, newBody, docs);
    addNode(node, newWhile);
}

function process_ForStatement(node:ForStatement): void {
    const docs:string | StructuredDocumentation = cloneDocs(node.documentation);
    const newInit:VariableDeclarationStatement | ExpressionStatement = clone(node.vInitializationExpression) as VariableDeclarationStatement | ExpressionStatement;
    const newCond:Expression = clone(node.vCondition) as Expression;
    const newLoopExpr:ExpressionStatement = clone(node.vLoopExpression) as ExpressionStatement;
    const newBody:Statement = clone(node.vBody) as Statement;
    const newFor:ForStatement = new ForStatement(id++, srcStr, newBody, newInit, newCond, newLoopExpr, docs);
    addNode(node, newFor);
}


function process_ExpressionStatement(node:ExpressionStatement): void {
    const docs:string | StructuredDocumentation = cloneDocs(node.documentation);
    const newExpr:Expression = clone(node.vExpression) as Expression;
    const newStmt:ExpressionStatement = new ExpressionStatement(id++, srcStr, newExpr, docs);
    addNode(node, newStmt);
}

function process_VariableDeclarationStatement(node:VariableDeclarationStatement): void {
    const docs:string | StructuredDocumentation = cloneDocs(node.documentation);
    const newDecls:VariableDeclaration[] = cloneList(node.vDeclarations) as VariableDeclaration[];
    const newVal:Expression = clone(node.vInitialValue) as Expression;
    const newStmt:VariableDeclarationStatement = new VariableDeclarationStatement(id++, srcStr, node.assignments, newDecls, newVal, docs);
    addNode(node, newStmt)
}

function process_EmitStatement(node:EmitStatement): void {
    const docs:string | StructuredDocumentation = cloneDocs(node.documentation);
    const newCall:FunctionCall = clone(node.vEventCall) as FunctionCall;
    const newEmit:EmitStatement = new EmitStatement(id++, srcStr, newCall, docs);
    addNode(node, newEmit);
}

function process_Return(node:Return): void {
    const docs:string | StructuredDocumentation = cloneDocs(node.documentation);
    const newExpr:Expression = clone(node.vExpression) as Expression;
    const newRet:Return = new Return(id++, srcStr, node.functionReturnParameters, newExpr, docs);
    addNode(node, newRet);
}

function process_Continue(node:Continue): void {
    const docs:string | StructuredDocumentation = cloneDocs(node.documentation);
    const newCont:Continue = new Continue(id++, srcStr, docs);
    addNode(node, newCont);
}

function process_Break(node:Break): void {
    const docs:string | StructuredDocumentation = cloneDocs(node.documentation);
    const newBreak:Break = new Break(id++, srcStr, docs);
    addNode(node, newBreak);
}

function process_Throw(node:Throw): void {
    const docs:string | StructuredDocumentation = cloneDocs(node.documentation);
    const newThrow:Throw = new Throw(id++, srcStr, docs);
    addNode(node, newThrow);
}

function process_PlaceholderStatement(node:PlaceholderStatement): void {
    const docs:string | StructuredDocumentation = cloneDocs(node.documentation);
    const newStmt:PlaceholderStatement = new PlaceholderStatement(id++, srcStr, docs);
    addNode(node, newStmt);
}

function process_RevertStatement(node:RevertStatement): void {
    const docs:string | StructuredDocumentation = cloneDocs(node.documentation);
    const newCall:FunctionCall = clone(node.errorCall) as FunctionCall;
    const newRevert:RevertStatement = new RevertStatement(id++, srcStr, newCall, docs);
    addNode(node, newRevert);
}

function process_TryCatchClause(node:TryCatchClause): void {
    const docs:string | StructuredDocumentation = cloneDocs(node.documentation);
    const newParams:ParameterList = clone(node.vParameters) as ParameterList;
    const newBlk:Block = clone(node.vBlock) as Block;
    const newCatch:TryCatchClause = new TryCatchClause(id++, srcStr, node.errorName, newBlk, newParams, docs);
    addNode(node, newCatch);
}

function process_TryStatement(node:TryStatement): void {
    const docs:string | StructuredDocumentation = cloneDocs(node.documentation);
    const newCall:FunctionCall = clone(node.vExternalCall) as FunctionCall;
    const newClause:TryCatchClause[] = cloneList(node.vClauses) as TryCatchClause[];
    const newTry:TryStatement = new TryStatement(id++, srcStr, newCall, newClause, docs);
    addNode(node, newTry);
}

/*
 * Expressions
 */

function process_Assignment(node:Assignment): void {
    const newLhs:Expression = clone(node.vLeftHandSide) as Expression;
    const newRhs:Expression = clone(node.vRightHandSide) as Expression;
    const newAssign:Assignment = new Assignment(id++, srcStr, node.typeString, node.operator, newLhs, newRhs);
    addNode(node, newAssign);
}

function process_BinaryOperation(node:BinaryOperation): void {
    const newLhs:Expression = clone(node.vLeftExpression) as Expression;
    const newRhs:Expression = clone(node.vRightExpression) as Expression;
    const newBop:BinaryOperation = new BinaryOperation(id++, srcStr, node.typeString, node.operator, newLhs, newRhs);
    addNode(node, newBop);
}

function process_UnaryOperation(node:UnaryOperation): void {
    const newExpr:Expression = clone(node.vSubExpression) as Expression;
    const newUop:UnaryOperation = new UnaryOperation(id++, srcStr, node.typeString, node.prefix, node.operator, newExpr);
    addNode(node, newUop);
}

function process_MemberAccess(node:MemberAccess): void {
    const refId:number = getNewId(node, node.referencedDeclaration);
    const newExpr:Expression = clone(node.vExpression) as Expression;
    const newAccess:MemberAccess = new MemberAccess(id++, srcStr, node.typeString, newExpr, node.memberName, refId);
    addNode(node, newAccess);
}

function process_IndexAccess(node:IndexAccess): void {
    const newBaseExpr:Expression = clone(node.vBaseExpression) as Expression;
    const newIndexExpr:Expression = clone(node.vIndexExpression) as Expression;
    const newAccess:IndexAccess = new IndexAccess(id++, srcStr, node.typeString, newBaseExpr, newIndexExpr);
    addNode(node, newAccess);
}

function process_IndexRangeAccess(node:IndexRangeAccess): void {
    const newBaseExpr:Expression = clone(node.vBaseExpression) as Expression;
    const newStartExpr:Expression = clone(node.vStartExpression) as Expression;
    const newEndExpr:Expression = clone(node.vEndExpression) as Expression;
    const newAccess:IndexRangeAccess = new IndexRangeAccess(id++, srcStr, node.typeString, newBaseExpr, newStartExpr, newEndExpr);
    addNode(node, newAccess);
}

function process_NewExpression(node:NewExpression): void {
    const newType:TypeName = clone(node.vTypeName) as TypeName;
    const newNew:NewExpression = new NewExpression(id++, srcStr, node.typeString, newType);
    addNode(node, newNew);
}

function process_Identifier(node:Identifier): void {
    const refId:number = getNewId(node, node.referencedDeclaration);
    const newIdent:Identifier = new Identifier(id++, srcStr, node.typeString, node.name, refId);
    addNode(node, newIdent);
}

function process_FunctionCall(node:FunctionCall): void {
    const newExpr:Expression = clone(node.vExpression) as Expression;
    const newArgs:Expression[] = cloneList(node.vArguments) as Expression[];
    const newCall:FunctionCall = new FunctionCall(id++, srcStr, node.typeString, node.kind, newExpr, newArgs, node.fieldNames);
    addNode(node, newCall);
}

function process_Literal(node:Literal): void {
    const newLiteral:Literal = new Literal(id++, srcStr, node.typeString, node.kind, node.hexValue, node.value, node.subdenomination);
    addNode(node, newLiteral);
}

function process_TupleExpression(node:TupleExpression): void {
    let newComps:Array<Expression | null> = new Array<Expression | null>();
    for(const component of node.vOriginalComponents) {
        newComps.push(clone(component) as Expression | null);
    }

    const newExpr:TupleExpression = new TupleExpression(id++, srcStr, node.typeString, node.isInlineArray, newComps);
    addNode(node, newExpr);
}

function process_ElementaryTypeNameExpression(node:ElementaryTypeNameExpression): void {
    let newName:string | ElementaryTypeName = node.typeName;
    if(newName instanceof ElementaryTypeName) {
        newName = clone(newName) as ElementaryTypeName;
    }
    const newExpr:ElementaryTypeNameExpression = new ElementaryTypeNameExpression(id++, srcStr, node.typeString, newName);
    addNode(node, newExpr);
}

function process_Conditional(node:Conditional): void {
    const newCond:Expression = clone(node.vCondition) as Expression;
    const newTrue:Expression = clone(node.vTrueExpression) as Expression;
    const newFalse:Expression = clone(node.vFalseExpression) as Expression;
    const newExpr:Conditional = new Conditional(id++, srcStr, node.typeString, newCond, newTrue, newFalse);
    addNode(node, newExpr);
}

function process_FunctionCallOptions(node:FunctionCallOptions): void {
    const newExpr:Expression = clone(node.vExpression) as Expression;
    let newOptions:Map<string, Expression> = new Map<string, Expression>();
    for(const entry of node.vOptionsMap.entries()) {
        newOptions.set(entry[0], clone(entry[1]) as Expression);
    }
    const newFnCallOp = new FunctionCallOptions(id++, srcStr, node.typeString, newExpr, newOptions);
    addNode(node, newFnCallOp);
}

function unitDispatch(node:ASTNode): void {
    if(refRedirect.has(node.id)) {
        return;
    }

    if(node instanceof PragmaDirective) {
        process_PragmaDirective(node);
    }
    else if(node instanceof EnumValue) {
        process_EnumValue(node);
    }
    else if(node instanceof EnumDefinition) {
        process_EnumDefinition(node);
    }
    else if(node instanceof IdentifierPath) {
        process_IdentifierPath(node);
    }
    else if(node instanceof UserDefinedTypeName) {
        process_UserDefinedTypeName(node);
    }
    else if(node instanceof VariableDeclaration) {
        process_VariableDeclaration(node);
    }
    else if(node instanceof ElementaryTypeName) {
        process_ElementaryTypeName(node);
    }
    else if(node instanceof SourceUnit) {
        process_SourceUnit(node);
    }
    else if(node instanceof ContractDefinition) {
        process_ContractDefinition(node);
    }
    else if(node instanceof ModifierDefinition) {
        process_ModifierDefinition(node);
    }
    else if(node instanceof FunctionDefinition) {
        process_FunctionDefinition(node);
    }
    else if(node instanceof EventDefinition) {
        process_EventDefinition(node);
    }
    else if(node instanceof Block) {
        process_Block(node);
    }
    else if(node instanceof IfStatement) {
        process_IfStatement(node);
    }
    else if(node instanceof ExpressionStatement) {
        process_ExpressionStatement(node);
    }
    else if(node instanceof Assignment) {
        process_Assignment(node);
    }
    else if(node instanceof BinaryOperation) {
        process_BinaryOperation(node);
    }
    else if(node instanceof MemberAccess) {
        process_MemberAccess(node);
    }
    else if(node instanceof Identifier) {
        process_Identifier(node);
    }
    else if(node instanceof FunctionCall) {
        process_FunctionCall(node);
    }
    else if(node instanceof Literal) {
        process_Literal(node);
    }
    else if(node instanceof ParameterList) {
        process_ParameterList(node);
    }
    else if(node instanceof Return) {
        process_Return(node);
    }
    else if(node instanceof StructDefinition) {
        process_StructDefinition(node);
    }
    else if(node instanceof DoWhileStatement) {
        process_DoWhileStatement(node);
    }
    else if(node instanceof UnaryOperation) {
        process_UnaryOperation(node);
    }
    else if(node instanceof StructuredDocumentation) {
        process_StructuredDocumentation(node);
    }
    else if(node instanceof ForStatement) {
        process_ForStatement(node);
    }
    else if(node instanceof WhileStatement) {
        process_WhileStatement(node);
    }
    else if(node instanceof TupleExpression) {
        process_TupleExpression(node);
    }
    else if(node instanceof VariableDeclarationStatement) {
        process_VariableDeclarationStatement(node);
    }
    else if(node instanceof ElementaryTypeNameExpression) {
        process_ElementaryTypeNameExpression(node);
    }
    else if(node instanceof UserDefinedValueTypeDefinition) {
        process_UserDefinedValueTypeDefinition(node);
    }
    else if(node instanceof ErrorDefinition) {
        process_ErrorDefinition(node);
    }
    else if(node instanceof ModifierInvocation) {
        process_ModifierInvocation(node);
    }
    else if(node instanceof OverrideSpecifier) {
        process_OverrideSpecifier(node);
    }
    else if(node instanceof Conditional) {
        process_Conditional(node);
    }
    else if(node instanceof NewExpression) {
        process_NewExpression(node);
    }
    else if(node instanceof IndexAccess) {
        process_IndexAccess(node);
    }
    else if(node instanceof IndexRangeAccess) {
        process_IndexRangeAccess(node);
    }
    else if(node instanceof Conditional) {
        process_Conditional(node);
    }
    else if(node instanceof FunctionCallOptions) {
        process_FunctionCallOptions(node);
    }
    else if(node instanceof UncheckedBlock) {
        process_UncheckedBlock(node);
    }
    else if(node instanceof EmitStatement) {
        process_EmitStatement(node);
    }
    else if(node instanceof Continue) {
        process_Continue(node);
    }
    else if(node instanceof Break) {
        process_Break(node);
    }
    else if(node instanceof Throw) {
        process_Throw(node);
    }
    else if(node instanceof PlaceholderStatement) {
        process_PlaceholderStatement(node);
    }
    else if(node instanceof RevertStatement) {
        process_RevertStatement(node);
    }
    else if(node instanceof TryCatchClause) {
        process_TryCatchClause(node);
    }
    else if(node instanceof TryStatement) {
        process_TryStatement(node);
    }
    else if(node instanceof ArrayTypeName) {
        process_ArrayTypeName(node);
    }
    else if(node instanceof Mapping) {
        process_Mapping(node);
    }
    else if(node instanceof ImportDirective) {
        process_ImportDirective(node);
    }
    else if(node instanceof InheritanceSpecifier) {
        process_InheritanceSpecifier(node);
    }
    else if(node instanceof UsingForDirective) {
        process_UsingForDirective(node);
    }
    else {
        console.log("Unknown type");
        console.log(node);
        process.exit(1);
    }
}


async function readAST(
    fileName: string,
): Promise<SourceUnit[]> {
    const reader = new ASTReader();

    const result = await compileSol(fileName, "auto", [], undefined, undefined, undefined);

    return reader.read(result.data);
}

function writeAST(units: SourceUnit[], version: string): [string, Map<ASTNode, [number, number]>] {
    const formatter = new PrettyFormatter(4, 0);
    const writer = new ASTWriter(DefaultASTWriterMapping, formatter, version);
    const sourceMap = new Map<ASTNode, [number, number]>();
    for (const unit of units) {
        console.log(writer.write(unit));
    }

    return [units.map((unit) => writer.write(unit, sourceMap)).join("\n"), sourceMap];
}


async function compile(filename: string): Promise<CompileResult> {
    console.log("test");
    let result: CompileResult;

    try {
        result = await compileSol(filename, "auto", []);
    } catch (e) {
        if (e instanceof CompileFailedError) {
            console.error("Compile errors encountered:");

            for (const failure of e.failures) {
                console.error(`Solc ${failure.compilerVersion}:`);

                for (const error of failure.errors) {
                    console.error(error);
                }
            }
        } else {
            console.error(e.message);
        }

        process.exit(1);
    }

    return result;
}

async function test(filename: string) {
    const ast : SourceUnit[] = await readAST(filename);
    for(const unit of ast) {
        unitDispatch(unit);
    }
    var arr:SourceUnit[] = [modified];
    writeAST(arr, "0.8.0");
    //const result: CompileResult = await compile(filename);
    //const reader = new ASTReader();
    //const sourceUnits = reader.read(result.data);
    //console.log(result);
}

test(process.argv[2]);

